#!/usr/bin/env bash
# lifecycle-hooks.sh — fixture tests for the Claude Code lifecycle hooks (#1340)
#
# Pushes are real: each repo gets a local bare `origin` and the pre-push shim,
# and every push case asserts what the remote actually received. Cases follow
# specs/agent-skills-lifecycle-enforcement.md (Amendment 2); R-numbers are the
# review findings recorded there.
#
#   A. SessionStart emits the meta-skill (and installs the shim)
#   B. UserPromptSubmit reminder is emitted
#   C. Recorder: exact skill names and typed /test, /review; never blocks
#   D. Freshness: nothing / only test recorded, reviewed-then-committed,
#      sed or new file after review (R1), uncommitted edit after review
#   E. Refs (R8, R17): other branches, feat:main, tags, --all, deletes, and
#      remote.<name>.push / push.default=matching configs
#   F. Shell forms (R15, R16, R18, R19): if/while, timeout -k, nice -n, env -u,
#      xargs -I, a "# don't" comment, pushd, GIT_DIR=, $(...) arguments
#   G. Scope: no CLAUDECODE → unaffected; bypass env; linked worktrees
#   H. Installer: installs, idempotent, never overwrites a foreign hook,
#      refuses when core.hooksPath is set
#   I. PreToolUse: evasion guards, install-on-push, MCP and gh api content
#      writes (R20) via the proxy check, ordinary commands, malformed input (R2)
#   J. Concurrent records (R11), temp cleanup (R12), quoted plugin path (R7)
#
# Dependencies: bash, git, node. Same as the hooks under test.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
GATE="$REPO_ROOT/hooks/lifecycle-gate.js"
RECORD="$REPO_ROOT/hooks/lifecycle-record.js"
PREPUSH="$REPO_ROOT/hooks/lifecycle-prepush.js"

PASS=0
FAIL=0
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
# The hooks must not see the caller's own session marker, bypass, or project dir.
unset CLAUDECODE BLOG_LIFECYCLE_GATE_BYPASS CLAUDE_PROJECT_DIR

pass() { echo "  ✅ $1"; PASS=$((PASS + 1)); }
fail() { echo "  ❌ $1"; FAIL=$((FAIL + 1)); }
check() { if [ "$2" = "$3" ]; then pass "$1"; else fail "$1 (expected '$3', got '$2')"; fi; }

# new_repo <name>: repo with a committed a.txt, a bare origin holding main, and
# the shim installed. Prints its path.
new_repo() {
  local r="$TMP/$1"
  git init -q --bare "$r.git"
  git init -q -b main "$r"
  git -C "$r" config user.email "lifecycle-test@example.com"
  git -C "$r" config user.name "lifecycle-test"
  git -C "$r" config commit.gpgsign false
  git -C "$r" remote add origin "$r.git"
  printf 'one\n' > "$r/a.txt"
  git -C "$r" add . && git -C "$r" commit -q -m "baseline"
  git -C "$r" push -q origin main 2>/dev/null
  node "$PREPUSH" --install "$r" >/dev/null 2>&1 || true
  echo "$r"
}

commit_all() { git -C "$1" add -A && git -C "$1" commit -q -m "${2:-change}"; }
remote_sha() { git -C "$1" ls-remote origin "$2" 2>/dev/null | cut -f1; }

json() { local expr="$1"; shift; node -e "const [a,b,c]=process.argv.slice(1);process.stdout.write(JSON.stringify($expr))" "$@"; }
record_skill()  { json '{hook_event_name:"PostToolUse",cwd:a,tool_name:"Skill",tool_input:{skill:b}}' "$1" "$2" | node "$RECORD"; }
record_prompt() { json '{hook_event_name:"UserPromptSubmit",cwd:a,prompt:b}' "$1" "$2" | node "$RECORD"; }
record_both()   { record_skill "$1" test; record_skill "$1" review; }
recorded()      { node -e 'const fs=require("fs");
  process.stdout.write(["review","test"].filter(k=>fs.existsSync(process.argv[1]+"/.git/lifecycle-gate-"+k+".json")).join(","))' "$1"; }

# push_case <name> <accept|reject> <repo> <remote ref> <expected sha if accepted> <cmd> [grep]
# Runs <cmd> under bash from $TMP as a Claude session would (CLAUDECODE=1), then
# checks whether the remote ref moved to the expected sha or stayed where it was.
push_case() {
  local name="$1" expect="$2" repo="$3" ref="$4" want_sha="$5" cmd="$6" grep_for="${7:-}"
  local before after out got
  before=$(remote_sha "$repo" "$ref")
  out=$(cd "$TMP" && CLAUDECODE=1 bash -c "$cmd" 2>&1) || true
  after=$(remote_sha "$repo" "$ref")
  if [ "$after" = "$before" ] && [ "$after" != "$want_sha" ]; then got=reject
  elif [ "$after" = "$want_sha" ]; then got=accept
  else got="moved-elsewhere"; fi
  if [ "$got" != "$expect" ]; then fail "$name (expected $expect, got $got)"; return; fi
  if [ -n "$grep_for" ] && ! printf '%s' "$out" | grep -q -- "$grep_for"; then fail "$name (output lacks '$grep_for')"; return; fi
  pass "$name"
}

# gate_out <cwd> <tool_name> <command | tool_input JSON>: PreToolUse stdout.
gate_out() {
  json 'b==="Bash"?{hook_event_name:"PreToolUse",cwd:a,tool_name:b,tool_input:{command:c}}:{hook_event_name:"PreToolUse",cwd:a,tool_name:b,tool_input:c?JSON.parse(c):{}}' "$1" "$2" "$3" \
    | node "$GATE" 2>/dev/null
}
decision() { node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
  if(!s.trim()){console.log("allow");return}
  try{console.log(JSON.parse(s).hookSpecificOutput.permissionDecision)}catch(e){console.log("unparseable")}})'; }
# gate_case <name> <allow|deny> <cwd> <tool_name> <command | JSON> [grep]
gate_case() {
  local out got
  out=$(gate_out "$3" "$4" "$5") || { fail "$1 (gate exited non-zero)"; return; }
  got=$(printf '%s' "$out" | decision)
  if [ "$got" != "$2" ]; then fail "$1 (expected $2, got $got)"; return; fi
  if [ -n "${6:-}" ] && ! printf '%s' "$out" | grep -q -- "$6"; then fail "$1 (output lacks '$6')"; return; fi
  pass "$1"
}

context_of() {
  echo '{}' | CLAUDE_PROJECT_DIR="$REPO_ROOT" bash "$1" 2>/dev/null | node -e 'let s="";
    process.stdin.on("data",d=>s+=d).on("end",()=>{try{
      process.stdout.write(JSON.parse(s).hookSpecificOutput.additionalContext||"")}catch(e){}})'
}

echo "Case A: SessionStart"
ctx=$(context_of "$REPO_ROOT/hooks/session-start.sh" || true)
if printf '%s' "$ctx" | grep -q "Using Agent Skills"; then pass "A. meta-skill injected"; else fail "A. meta-skill injected"; fi
if printf '%s' "$ctx" | grep -q "pre-push"; then pass "A. reports the pre-push shim"; else fail "A. reports the pre-push shim"; fi

echo "Case B: UserPromptSubmit reminder"
ctx=$(context_of "$REPO_ROOT/hooks/lifecycle-reminder.sh" || true)
if printf '%s' "$ctx" | grep -q "spec" && printf '%s' "$ctx" | grep -q "review"; then
  pass "B. lifecycle reminder injected"; else fail "B. lifecycle reminder injected"; fi

echo "Case C: recorder"
R=$(new_repo rec)
record_skill "$R" test 2>/dev/null || true
check "C. Skill test recorded" "$(recorded "$R")" "test"
record_skill "$R" code-review 2>/dev/null || true; record_skill "$R" blog:test 2>/dev/null || true
check "C. code-review and blog:test ignored" "$(recorded "$R")" "test"
record_prompt "$R" "/review please" 2>/dev/null || true
check "C. typed /review recorded" "$(recorded "$R")" "review,test"
R2=$(new_repo rec2)
record_prompt "$R2" "/code-review" 2>/dev/null || true; record_prompt "$R2" "please run /test" 2>/dev/null || true
check "C. /code-review and mid-sentence /test ignored" "$(recorded "$R2")" ""
out=$(record_skill "$R2" test 2>/dev/null; printf 'not json' | node "$RECORD" 2>/dev/null; echo "rc=$?")
check "C. recorder prints nothing and exits 0" "$out" "rc=0"
check "C. index untouched by snapshot" "$(git -C "$R" status --porcelain)" ""

echo "Case D: freshness"
D=$(new_repo none); printf 'x\n' >> "$D/a.txt"; commit_all "$D"
push_case "D. nothing recorded" reject "$D" refs/heads/main "$(git -C "$D" rev-parse HEAD)" "cd '$D' && git push origin main" "test, review"
E1=$(new_repo only-test); printf 'x\n' >> "$E1/a.txt"; commit_all "$E1"; record_skill "$E1" test
push_case "D. only test recorded" reject "$E1" refs/heads/main "$(git -C "$E1" rev-parse HEAD)" "cd '$E1' && git push origin main" "content: review"
F=$(new_repo fresh); printf 'two\n' > "$F/b.txt"; record_both "$F"; commit_all "$F"
push_case "D. reviewed work, then committed" accept "$F" refs/heads/main "$(git -C "$F" rev-parse HEAD)" "cd '$F' && git push origin main"
G=$(new_repo shell-edit); record_both "$G"; sed -i 's/one/ONE/' "$G/a.txt"; commit_all "$G"
push_case "D. sed edit after review (R1)" reject "$G" refs/heads/main "$(git -C "$G" rev-parse HEAD)" "cd '$G' && git push origin main" "a.txt"
H=$(new_repo new-file); record_both "$H"; printf 'x\n' > "$H/new.txt"; commit_all "$H"
push_case "D. new file after review" reject "$H" refs/heads/main "$(git -C "$H" rev-parse HEAD)" "cd '$H' && git push origin main" "new.txt"
H2=$(new_repo uncommitted); printf 'r\n' > "$H2/b.txt"; commit_all "$H2"; record_both "$H2"; printf 'wip\n' >> "$H2/a.txt"
push_case "D. uncommitted edit, HEAD still reviewed" accept "$H2" refs/heads/main "$(git -C "$H2" rev-parse HEAD)" "cd '$H2' && git push origin main"

echo "Case E: refs (R8, R17)"
E=$(new_repo refs)
git -C "$E" checkout -q -b feat; printf 'evil\n' > "$E/evil.txt"; commit_all "$E" unreviewed; FEAT=$(git -C "$E" rev-parse feat)
git -C "$E" checkout -q main; printf 'ok\n' > "$E/ok.txt"; commit_all "$E" reviewed; record_both "$E"; MAIN=$(git -C "$E" rev-parse main)
push_case "E. other branch: git push origin feat" reject "$E" refs/heads/feat "$FEAT" "cd '$E' && git push origin feat" "refs/heads/feat"
push_case "E. feat:main" reject "$E" refs/heads/main "$FEAT" "cd '$E' && git push origin feat:main"
push_case "E. +feat:other" reject "$E" refs/heads/other "$FEAT" "cd '$E' && git push origin +feat:other"
push_case "E. --all with an unreviewed branch" reject "$E" refs/heads/feat "$FEAT" "cd '$E' && git push --all origin" "feat"
git -C "$E" tag -a bad -m bad feat
push_case "E. tag on unreviewed commit" reject "$E" refs/tags/bad "$(git -C "$E" rev-parse bad)" "cd '$E' && git push origin bad"
git -C "$E" config remote.origin.push "refs/heads/feat:refs/heads/main"
push_case "E. remote.origin.push config (R17)" reject "$E" refs/heads/main "$FEAT" "cd '$E' && git push origin"
git -C "$E" config --unset remote.origin.push
push_case "E. reviewed main" accept "$E" refs/heads/main "$MAIN" "cd '$E' && git push origin main"
git -C "$E" tag -a good -m good main
push_case "E. --tags with an unreviewed tag" reject "$E" refs/tags/bad "$(git -C "$E" rev-parse bad)" "cd '$E' && git push --tags origin" "bad"
git -C "$E" tag -d bad >/dev/null
push_case "E. --tags, only reviewed tags" accept "$E" refs/tags/good "$(git -C "$E" rev-parse good)" "cd '$E' && git push --tags origin"
git -C "$E" push -q origin main:gone 2>/dev/null
push_case "E. delete a remote branch" accept "$E" refs/heads/gone "" "cd '$E' && git push origin :gone"
M=$(new_repo matching); git -C "$M" checkout -q -b feat; git -C "$M" push -q origin feat 2>/dev/null
printf 'evil\n' > "$M/evil.txt"; commit_all "$M"; MF=$(git -C "$M" rev-parse feat); git -C "$M" checkout -q main; record_both "$M"
push_case "E. push.default=matching (R17)" reject "$M" refs/heads/feat "$MF" "cd '$M' && git -c push.default=matching push origin" "feat"
A2=$(new_repo all-reviewed); git -C "$A2" branch twin; record_both "$A2"
push_case "E. --all, every ref reviewed" accept "$A2" refs/heads/twin "$(git -C "$A2" rev-parse twin)" "cd '$A2' && git push --all origin"

echo "Case F: shell forms (R15, R16, R18, R19), stale repo"
S=$(new_repo shell); printf 'x\n' >> "$S/a.txt"; commit_all "$S"; SH=$(git -C "$S" rev-parse HEAD)
for c in "cd '$S' && if git push origin main; then echo ok; fi" \
         "cd '$S' && while ! git push origin main; do break; done" \
         "cd '$S' && timeout -k 5 60 git push origin main" \
         "cd '$S' && nice -n 10 git push origin main" \
         "cd '$S' && env -u FOO git push origin main" \
         "cd '$S' && echo main | xargs -I {} git push origin {}" \
         $'cd \''"$S"$'\' && git status >/dev/null   # don\'t push yet\ngit push origin main' \
         "pushd '$S' >/dev/null && git push origin main" \
         "GIT_DIR='$S/.git' git push origin main" \
         "cd \"\$(git -C '$S' rev-parse --show-toplevel)\" && git push origin \"\$(git branch --show-current)\""; do
  push_case "F. stale: ${c//$TMP/\$TMP}" reject "$S" refs/heads/main "$SH" "$c"
done
record_both "$S"
push_case "F. reviewed: GIT_DIR= form" accept "$S" refs/heads/main "$SH" "GIT_DIR='$S/.git' git push origin main"

echo "Case G: scope"
N=$(new_repo human); printf 'x\n' >> "$N/a.txt"; commit_all "$N"
out=$(cd "$N" && git push -q origin main 2>&1) || true
check "G. without CLAUDECODE an unreviewed push goes through" "$(remote_sha "$N" refs/heads/main)" "$(git -C "$N" rev-parse HEAD)"
B=$(new_repo bypass); printf 'x\n' >> "$B/a.txt"; commit_all "$B"
out=$(cd "$B" && CLAUDECODE=1 BLOG_LIFECYCLE_GATE_BYPASS=1 git push -q origin main 2>&1) || true
check "G. bypass env lets the push through" "$(remote_sha "$B" refs/heads/main)" "$(git -C "$B" rev-parse HEAD)"
W=$(new_repo worktree); record_both "$W"; git -C "$W" worktree add -q -b wt "$TMP/wt" 2>/dev/null
git -C "$TMP/wt" config user.email t@e; printf 'w\n' > "$TMP/wt/w.txt"; commit_all "$TMP/wt"; WT=$(git -C "$TMP/wt" rev-parse HEAD)
push_case "G. worktree without its own review" reject "$W" refs/heads/wt "$WT" "cd '$TMP/wt' && git push origin wt"
record_both "$TMP/wt"
push_case "G. worktree after its own review" accept "$W" refs/heads/wt "$WT" "cd '$TMP/wt' && git push origin wt"

echo "Case H: installer"
I=$(new_repo install)
check "H. shim installed" "$(grep -c 'lifecycle-gate pre-push shim' "$I/.git/hooks/pre-push")" "1"
rc=0; node "$PREPUSH" --install "$I" >/dev/null 2>&1 || rc=$?
check "H. reinstall is idempotent" "$rc:$(grep -c 'lifecycle-gate pre-push shim' "$I/.git/hooks/pre-push")" "0:1"
X=$(new_repo foreign); printf '#!/bin/sh\necho mine\n' > "$X/.git/hooks/pre-push"
rc=0; node "$PREPUSH" --install "$X" >/dev/null 2>&1 || rc=$?
check "H. foreign pre-push left alone" "$rc:$(cat "$X/.git/hooks/pre-push" | tail -1)" "2:echo mine"
Y=$(new_repo hookspath); rm -f "$Y/.git/hooks/pre-push"; git -C "$Y" config core.hooksPath .githooks
rc=0; node "$PREPUSH" --install "$Y" >/dev/null 2>&1 || rc=$?
check "H. core.hooksPath set: refuses" "$rc" "2"

echo "Case I: PreToolUse gate"
for c in "git push --no-verify origin main" "git -c core.hooksPath=/dev/null push" "rm .git/hooks/pre-push" \
         "git send-pack origin main" "CLAUDECODE=0 git push" "BLOG_LIFECYCLE_GATE_BYPASS=1 git push"; do
  gate_case "I. guard: $c" deny "$A2" Bash "$c"
done
gate_case "I. guard: Edit on .git/hooks/pre-push" deny "$A2" Edit "{\"file_path\":\"$A2/.git/hooks/pre-push\"}"
gate_case "I. Edit on an ordinary file" allow "$A2" Edit "{\"file_path\":\"$A2/a.txt\"}"
for c in "git status" "git commit -m wip" "gh pr create --title x" 'grep -rn "git push" docs/' \
         "gh api -X GET repos/o/r/contents/a.txt" "git push origin main"; do
  gate_case "I. allowed: $c" allow "$A2" Bash "$c"
done
U=$(new_repo uninstalled); rm -f "$U/.git/hooks/pre-push"
gate_case "I. push installs a missing shim" allow "$U" Bash "git push origin main"
check "I. shim present afterwards" "$(grep -c 'lifecycle-gate pre-push shim' "$U/.git/hooks/pre-push" 2>/dev/null || echo 0)" "1"
gate_case "I. push with a foreign hook is denied" deny "$X" Bash "git push origin main" "pre-push"
gate_case "I. MCP push_files, stale" deny "$D" mcp__github__push_files '{"owner":"o","repo":"r"}' "test, review"
gate_case "I. MCP push_files, reviewed tree" allow "$A2" mcp__github__push_files '{"owner":"o","repo":"r"}'
gate_case "I. gh api contents PUT, stale (R20)" deny "$D" Bash "gh api -X PUT repos/o/r/contents/a.txt -f message=x -f content=eA=="
gate_case "I. gh api git/refs PATCH, stale (R20)" deny "$D" Bash "gh api repos/o/r/git/refs/heads/main -X PATCH -f sha=abc"
gate_case "I. gh api graphql createCommitOnBranch, stale (R20)" deny "$D" Bash "gh api graphql -f query='mutation { createCommitOnBranch(input: {}) { commit { oid } } }'"
gate_case "I. gh api contents PUT, reviewed tree" allow "$A2" Bash "gh api -X PUT repos/o/r/contents/a.txt -f message=x"
out=$(printf 'null' | node "$GATE" 2>/dev/null; echo "rc=$?"); check "I. null stdin, no crash" "$out" "rc=0"
out=$(printf 'not json' | node "$GATE" 2>/dev/null; echo "rc=$?"); check "I. non-JSON stdin allowed" "$out" "rc=0"
got=$(json '{tool_name:"mcp__github__push_files",tool_input:null,cwd:a}' "$D" | node "$GATE" 2>/dev/null | decision)
check "I. MCP write with null input denies (R2)" "$got" "deny"
out=$(json '{hook_event_name:"PreToolUse",cwd:a,tool_name:"Bash",tool_input:{command:"git push --no-verify"}}' "$A2" \
  | BLOG_LIFECYCLE_GATE_BYPASS=1 node "$GATE" 2>/dev/null || echo "exit-nonzero")
check "I. bypass env skips the gate" "$out" ""

echo "Case J: concurrency, temp files, plugin path"
C=$(new_repo concurrent); ok=0
for i in $(seq 1 20); do
  rm -f "$C"/.git/lifecycle-gate-*.json
  record_skill "$C" test & record_skill "$C" review & wait
  [ "$(recorded "$C")" = "review,test" ] && ok=$((ok + 1))
done
check "J. both snapshots kept in 20/20 parallel runs (R11)" "$ok" "20"
mkdir -p "$TMP/tmpcheck"
TMPDIR="$TMP/tmpcheck" record_both "$A2"
json '{hook_event_name:"PreToolUse",cwd:a,tool_name:"mcp__github__push_files",tool_input:{}}' "$A2" | TMPDIR="$TMP/tmpcheck" node "$GATE" >/dev/null 2>&1 || true
check "J. no temp files left behind (R12)" "$(ls -A "$TMP/tmpcheck")" ""
if grep -q '"bash \\"${CLAUDE_PLUGIN_ROOT}\\"/hooks/session-start.sh"' "$REPO_ROOT/hooks/hooks.json"; then
  pass "J. CLAUDE_PLUGIN_ROOT quoted (R7)"; else fail "J. CLAUDE_PLUGIN_ROOT quoted (R7)"; fi

echo ""
echo "Passed: $PASS  Failed: $FAIL"
[ "$FAIL" -eq 0 ]
