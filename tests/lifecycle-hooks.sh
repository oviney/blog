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
#   K. Amendment 2.1: install scope (R21), self-contained shim and bypass with
#      a missing checker (R23), executable bit (R24), dry runs (R25), renamed
#      GitHub MCP tools (R26), already-published commits (R27)
#   L. Amendment 2.2: fetched or stale refs cannot ride the published-commit
#      skip (R32), the checker copy comes from the default branch (R33), the
#      guard path without a trailing slash (R34), --uninstall (R35)
#   M. Amendment 2.3: uninstall refused inside Claude Code (R37), rewritten
#      local tracking refs (R38), a checker on origin/main that fails to load
#      (R39), partial hooks on origin/main (R40), widened guards (R41)
#   N. Amendment 2.4 (#1350): fetch guard short form and local sources only,
#      set-head allowed, uninstall message, copy list from origin/main, rewind
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

# new_repo <name> [nohooks]: repo with a committed a.txt and the hooks under
# test (so origin/main carries them, as on the real blog since #1340; install
# refuses without them, R49), a bare origin holding main, and the shim
# installed. `nohooks` leaves the hooks out: an unrelated repo. Prints its path.
new_repo() {
  local r="$TMP/$1"
  git init -q --bare "$r.git"
  git init -q -b main "$r"
  git -C "$r" config user.email "lifecycle-test@example.com"
  git -C "$r" config user.name "lifecycle-test"
  git -C "$r" config commit.gpgsign false
  git -C "$r" remote add origin "$r.git"
  printf 'one\n' > "$r/a.txt"
  if [ "${2:-}" != nohooks ]; then
    mkdir -p "$r/hooks"; cp "$REPO_ROOT/hooks/lifecycle-prepush.js" "$REPO_ROOT/hooks/lifecycle-snapshot.js" "$r/hooks/"
  fi
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

# context_of <hook script> <project dir>: the hook's additionalContext.
context_of() {
  echo '{}' | CLAUDE_PROJECT_DIR="$2" bash "$1" 2>/dev/null | node -e 'let s="";
    process.stdin.on("data",d=>s+=d).on("end",()=>{try{
      process.stdout.write(JSON.parse(s).hookSpecificOutput.additionalContext||"")}catch(e){}})'
}

echo "Case A: SessionStart (on a temporary project, never the real checkout, R30)"
AP=$(new_repo session-project); rm -f "$AP/.git/hooks/pre-push"
mkdir -p "$AP/.github/skills/using-agent-skills"
cp "$REPO_ROOT/.github/skills/using-agent-skills/SKILL.md" "$AP/.github/skills/using-agent-skills/"
ctx=$(context_of "$REPO_ROOT/hooks/session-start.sh" "$AP" || true)
if printf '%s' "$ctx" | grep -q "Using Agent Skills"; then pass "A. meta-skill injected"; else fail "A. meta-skill injected"; fi
if printf '%s' "$ctx" | grep -q "pre-push"; then pass "A. reports the pre-push shim"; else fail "A. reports the pre-push shim"; fi
check "A. shim installed in the session's project" "$(grep -c 'lifecycle-gate pre-push shim' "$AP/.git/hooks/pre-push" 2>/dev/null || echo 0)" "1"

echo "Case B: UserPromptSubmit reminder"
ctx=$(context_of "$REPO_ROOT/hooks/lifecycle-reminder.sh" "$REPO_ROOT" || true)
if printf '%s' "$ctx" | grep -q "spec" && printf '%s' "$ctx" | grep -q "review"; then
  pass "B. lifecycle reminder injected"; else fail "B. lifecycle reminder injected"; fi
if printf '%s' "$ctx" | grep -q "exactly the content" && ! printf '%s' "$ctx" | grep -q "PR creation"; then
  pass "B. reminder states the exact-content rule (R29)"; else fail "B. reminder states the exact-content rule (R29)"; fi

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
gate_case "I. guard deny explains the commit -F workaround" deny "$A2" Bash 'git commit -m "mention --no-verify push"' "commit -F"
gate_case "I. guard: Edit on .git/hooks/pre-push" deny "$A2" Edit "{\"file_path\":\"$A2/.git/hooks/pre-push\"}"
gate_case "I. Edit on an ordinary file" allow "$A2" Edit "{\"file_path\":\"$A2/a.txt\"}"
for c in "git status" "git commit -m wip" "gh pr create --title x" 'grep -rn "git push" docs/' \
         "gh api -X GET repos/o/r/contents/a.txt" "git push origin main"; do
  gate_case "I. allowed: $c" allow "$A2" Bash "$c"
done
U=$(new_repo uninstalled); rm -f "$U/.git/hooks/pre-push"
CLAUDE_PROJECT_DIR="$U" gate_case "I. push installs a missing shim in the project" allow "$U" Bash "git push origin main"
check "I. shim present afterwards" "$(grep -c 'lifecycle-gate pre-push shim' "$U/.git/hooks/pre-push" 2>/dev/null || echo 0)" "1"
CLAUDE_PROJECT_DIR="$X" gate_case "I. push with a foreign hook is denied" deny "$X" Bash "git push origin main" "pre-push"
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

echo "Case K: Amendment 2.1 (R21, R23-R27)"
K0=$(new_repo unrelated nohooks); rm -f "$K0/.git/hooks/pre-push"
CLAUDE_PROJECT_DIR="$A2" gate_case "K. unrelated repo: push allowed by the gate (R21)" allow "$K0" Bash "git push origin main"
check "K. unrelated repo: no shim installed (R21)" "$([ -e "$K0/.git/hooks/pre-push" ] && echo yes || echo no)" "no"
KB=$(new_repo blog-clone); rm -f "$KB/.git/hooks/pre-push"
CLAUDE_PROJECT_DIR="$A2" gate_case "K. another blog clone: push allowed by the gate" allow "$KB" Bash "git push origin main"
check "K. another blog clone: shim installed (R21)" "$(grep -c 'lifecycle-gate pre-push shim' "$KB/.git/hooks/pre-push" 2>/dev/null || echo 0)" "1"
check "K. shim runs the copy in the git common dir (R23)" "$(grep -c '/lifecycle-gate/lifecycle-prepush.js' "$A2/.git/hooks/pre-push")" "2"
check "K. checker and helper copied (R23)" "$([ -f "$A2/.git/lifecycle-gate/lifecycle-prepush.js" ] && [ -f "$A2/.git/lifecycle-gate/lifecycle-snapshot.js" ] && echo yes || echo no)" "yes"
K1=$(new_repo missing-checker); printf 'x\n' >> "$K1/a.txt"; commit_all "$K1"; rm -f "$K1/.git/lifecycle-gate/lifecycle-prepush.js"
push_case "K. checker copy missing: push rejected (fail closed)" reject "$K1" refs/heads/main "$(git -C "$K1" rev-parse HEAD)" "cd '$K1' && git push origin main" "missing"
out=$(cd "$K1" && CLAUDECODE=1 BLOG_LIFECYCLE_GATE_BYPASS=1 git push -q origin main 2>&1) || true
check "K. checker copy missing: owner bypass still works (R23)" "$(remote_sha "$K1" refs/heads/main)" "$(git -C "$K1" rev-parse HEAD)"
K3=$(new_repo not-executable); chmod -x "$K3/.git/hooks/pre-push"
rc=0; node "$PREPUSH" --install "$K3" >/dev/null 2>&1 || rc=$?
check "K. install restores the executable bit (R24)" "$rc:$([ -x "$K3/.git/hooks/pre-push" ] && echo exec || echo noexec)" "0:exec"
K4=$(new_repo dry-run); printf 'x\n' >> "$K4/a.txt"; commit_all "$K4"
rc=0; out=$(cd "$K4" && CLAUDECODE=1 git push --dry-run origin main 2>&1) || rc=$?
check "K. stale dry run is rejected, documented (R25)" "$([ "$rc" -ne 0 ] && printf '%s' "$out" | grep -q 'push rejected' && echo rejected || echo "rc=$rc")" "rejected"
for t in mcp__plugin_github_github__push_files mcp__github_remote__create_or_update_file mcp__my-github__delete_file; do
  gate_case "K. renamed GitHub MCP tool: $t (R26)" deny "$D" "$t" '{"owner":"o","repo":"r"}' "test, review"
  check "K. settings matcher covers $t (R26)" "$(node -e 'const s=require(process.argv[1]);const m=s.hooks.PreToolUse[0].matcher;process.stdout.write(String(new RegExp("^(?:"+m+")$").test(process.argv[2])))' "$REPO_ROOT/.claude/settings.json" "$t")" "true"
done
gate_case "K. a non-GitHub MCP tool is not checked" allow "$D" mcp__notes__push_files '{}'
K5=$(new_repo published)
push_case "K. main:new-branch without review is checked (R27 narrowed by R38)" reject "$K5" refs/heads/feat/new "$(git -C "$K5" rev-parse main)" "cd '$K5' && git push origin main:feat/new"

echo "Case L: Amendment 2.2 (R32-R35)"
# other_clone <repo> <name>: a second clone of <repo>'s origin, as another contributor.
other_clone() {
  git clone -q "$1.git" "$TMP/$2" 2>/dev/null
  git -C "$TMP/$2" config user.email other@example.com; git -C "$TMP/$2" config user.name other
  echo "$TMP/$2"
}
LA=$(new_repo fetched); LO=$(other_clone "$LA" fetched-other)
git -C "$LO" checkout -q -b copilot/x origin/main; printf 'evil\n' > "$LO/evil.txt"; commit_all "$LO" unreviewed; git -C "$LO" push -q origin copilot/x 2>/dev/null
git -C "$LA" fetch -q origin; record_both "$LA"
push_case "L. fetched unreviewed branch onto main (R32)" reject "$LA" refs/heads/main "$(git -C "$LA" rev-parse origin/copilot/x)" "cd '$LA' && git push origin origin/copilot/x:main" "uninstall"
LB=$(new_repo stale-ref); git -C "$LB" checkout -q -b bad; printf 'evil\n' > "$LB/evil.txt"; commit_all "$LB" unreviewed
git -C "$LB" push -q origin bad 2>/dev/null; git -C "$LB" checkout -q main; record_both "$LB"
LBO=$(other_clone "$LB" stale-other); git -C "$LBO" push -q origin :bad 2>/dev/null
check "L. local tracking ref is stale (setup)" "$(git -C "$LB" rev-parse --verify -q origin/bad >/dev/null && echo stale || echo gone)" "stale"
push_case "L. stale tracking ref cannot recreate a deleted branch (R32)" reject "$LB" refs/heads/bad "$(git -C "$LB" rev-parse bad)" "cd '$LB' && git push origin bad:bad"
LN=$(new_repo noop)
push_case "L. no-op push of an unchanged ref passes" accept "$LN" refs/heads/main "$(git -C "$LN" rev-parse main)" "cd '$LN' && git push origin main:main"
LC=$(new_repo default-branch-source)
printf '#!/usr/bin/env node\nprocess.exit(0)\n' > "$LC/hooks/lifecycle-prepush.js"
out=$(node "$PREPUSH" --install "$LC" 2>&1) || true
check "L. copy comes from the default branch, not the edited working tree (R33)" \
  "$(git -C "$LC" show origin/main:hooks/lifecycle-prepush.js | cmp -s - "$LC/.git/lifecycle-gate/lifecycle-prepush.js" && echo same || echo different)" "same"
git -C "$LC" checkout -q -- hooks; printf 'x\n' >> "$LC/a.txt"; commit_all "$LC"
push_case "L. weakened working-tree checker does not let a stale push through (R33)" reject "$LC" refs/heads/main "$(git -C "$LC" rev-parse HEAD)" "cd '$LC' && git push origin main"
LH=$(new_repo no-hooks-on-main nohooks); mkdir -p "$LH/hooks"; cp "$REPO_ROOT/hooks/lifecycle-prepush.js" "$REPO_ROOT/hooks/lifecycle-snapshot.js" "$LH/hooks/"
rc=0; out=$(node "$PREPUSH" --install "$LH" 2>&1) || rc=$?
check "L. origin/main without the hooks: install refuses, no working-tree copy (R33, R49)" \
  "$rc:$([ -e "$LH/.git/hooks/pre-push" ] && echo shim || echo noshim):$([ -e "$LH/.git/lifecycle-gate" ] && echo copy || echo nocopy)" "2:shim:nocopy"
if printf '%s' "$out" | grep -q "git fetch origin main:refs/remotes/origin/main"; then pass "L. the refusal gives a fetch that works in single-branch clones too (R49, R53)"; else fail "L. the refusal gives a fetch that works in single-branch clones too (R49, R53) ($out)"; fi
if printf '%s' "$out" | grep -q "shim rejects Claude's pushes"; then pass "L. without a copy, the refusal says the shim rejects pushes (R55)"; else fail "L. without a copy, the refusal says the shim rejects pushes (R55) ($out)"; fi
printf 'x\n' >> "$LH/a.txt"; commit_all "$LH"; record_both "$LH"
push_case "L. refused install still blocks Claude pushes at the git layer (R53)" reject "$LH" refs/heads/main "$(git -C "$LH" rev-parse HEAD)" "cd '$LH' && git push origin main" "git fetch origin main:refs/remotes/origin/main"
gate_case "L. guard: rm -rf .git/lifecycle-gate (R34)" deny "$A2" Bash "rm -rf .git/lifecycle-gate"
gate_case "L. guard: mv .git/lifecycle-gate (R34)" deny "$A2" Bash "mv .git/lifecycle-gate /tmp/x"
gate_case "L. reading a snapshot file is allowed (R34)" allow "$A2" Bash "cat .git/lifecycle-gate-test.json"
LU=$(new_repo uninstall)
rc=0; node "$PREPUSH" --uninstall "$LU" >/dev/null 2>&1 || rc=$?
check "L. --uninstall removes the shim and the copy (R35)" "$rc:$([ -e "$LU/.git/hooks/pre-push" ] && echo shim || echo noshim):$([ -e "$LU/.git/lifecycle-gate" ] && echo copy || echo nocopy)" "0:noshim:nocopy"
rc=0; node "$PREPUSH" --uninstall "$X" >/dev/null 2>&1 || rc=$?
check "L. --uninstall leaves a foreign hook alone (R35)" "$rc:$(tail -1 "$X/.git/hooks/pre-push")" "2:echo mine"

echo "Case M: Amendment 2.3 (R37-R41)"
MU=$(new_repo uninstall-claude)
rc=0; out=$(CLAUDECODE=1 node "$PREPUSH" --uninstall "$MU" 2>&1) || rc=$?
check "M. --uninstall refused inside Claude Code, shim stays (R37)" "$rc:$([ -e "$MU/.git/hooks/pre-push" ] && echo shim || echo noshim)" "2:shim"
if printf '%s' "$out" | grep -q "own terminal"; then pass "M. refusal points the owner to their own terminal (R37)"; else fail "M. refusal points the owner to their own terminal (R37) ($out)"; fi
rc=0; CLAUDECODE=1 BLOG_LIFECYCLE_GATE_BYPASS=1 node "$PREPUSH" --uninstall "$MU" >/dev/null 2>&1 || rc=$?
check "M. --uninstall with the owner bypass works (R37)" "$rc:$([ -e "$MU/.git/hooks/pre-push" ] && echo shim || echo noshim)" "0:noshim"
for c in "node hooks/lifecycle-prepush.js --uninstall && git push origin main" \
         "git update-ref refs/remotes/origin/main HEAD" \
         "git fetch . feat:refs/remotes/origin/main" "rm -rf .git/lifecycle-gate*" "rm -rf ./.git//lifecycle-gate" \
         "cd .git && rm -rf lifecycle-gate"; do
  gate_case "M. guard: $c (R37, R38, R41)" deny "$A2" Bash "$c"
done
for c in "cat .git/lifecycle-gate-review.json" "node --check hooks/lifecycle-gate.js" "git fetch origin" "git remote -v"; do
  gate_case "M. allowed: $c" allow "$A2" Bash "$c"
done
MS=$(new_repo set-head); MSO=$(other_clone "$MS" set-head-other)
git -C "$MSO" checkout -q -b copilot/x origin/main; printf 'evil\n' > "$MSO/evil.txt"; commit_all "$MSO" unreviewed; git -C "$MSO" push -q origin copilot/x 2>/dev/null
git -C "$MS" fetch -q origin; record_both "$MS"; EVIL=$(git -C "$MS" rev-parse origin/copilot/x)
git -C "$MS" remote set-head origin copilot/x
push_case "M. origin/HEAD pointed at an unreviewed branch (R38)" reject "$MS" refs/heads/main "$EVIL" "cd '$MS' && git push origin origin/copilot/x:main"
git -C "$MS" update-ref refs/remotes/origin/main "$EVIL"
push_case "M. origin/main rewritten to an unreviewed commit (R38)" reject "$MS" refs/heads/main "$EVIL" "cd '$MS' && git push origin $EVIL:refs/heads/main"
MB=$(new_repo broken-checker)
printf "const SOURCE_REF = 'refs/remotes/origin/main';\nconst COPIED = ['lifecycle-prepush.js', 'lifecycle-snapshot.js'];\nrequire('./lifecycle-util');\n" > "$MB/hooks/lifecycle-prepush.js"
commit_all "$MB" "broken checker on main"; git -C "$MB" push -q origin main 2>/dev/null
rc=0; out=$(node "$PREPUSH" --install "$MB" 2>&1) || rc=$?
check "M. checker on origin/main that fails to load is not installed (R39)" \
  "$rc:$(cmp -s "$REPO_ROOT/hooks/lifecycle-prepush.js" "$MB/.git/lifecycle-gate/lifecycle-prepush.js" && echo working-tree || echo other)" "0:working-tree"
if printf '%s' "$out" | grep -q "failed to load"; then pass "M. the load failure is announced (R39)"; else fail "M. the load failure is announced (R39) ($out)"; fi
MP=$(new_repo partial-hooks); git -C "$MP" rm -q hooks/lifecycle-snapshot.js
commit_all "$MP" "only the checker on main"; git -C "$MP" push -q origin main 2>/dev/null; rm -f "$MP/.git/hooks/pre-push"
rc=0; out=$(node "$PREPUSH" --install "$MP" 2>&1) || rc=$?
check "M. origin/main with only some hooks: install refuses (R40)" "$rc:$([ -e "$MP/.git/hooks/pre-push" ] && echo shim || echo noshim)" "2:shim"
if printf '%s' "$out" | grep -q "earlier checker copy stays in use"; then pass "M. the refusal says the earlier copy stays in use (R55)"; else fail "M. the refusal says the earlier copy stays in use (R55) ($out)"; fi

echo "Case N: Amendment 2.4 (#1350)"
# Item 1: the short form of a fetch into a tracking ref, and other local sources.
for c in "git fetch . feat:remotes/origin/main" "git fetch ./ feat:refs/remotes/origin/main" \
         "git fetch ../other feat:remotes/origin/main" "git fetch /tmp/x feat:refs/remotes/origin/main" \
         "git fetch file:///tmp/x feat:refs/remotes/origin/main" "git fetch --force . +feat:refs/remotes/origin/main" \
         "git fetch ~/clone feat:remotes/origin/main"; do
  gate_case "N. guard: $c (item 1)" deny "$A2" Bash "$c"
done
# Items 2 and 3: fetches from a named remote, refspec config, and set-head are ordinary.
for c in "git fetch origin main:refs/remotes/origin/main" "git fetch origin '+refs/heads/*:refs/remotes/origin/*'" \
         "git config remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*'" \
         "git config --add remote.origin.fetch +refs/heads/dev:refs/remotes/origin/dev" \
         "git remote set-head origin -a" "git remote set-head origin copilot/x"; do
  gate_case "N. allowed: $c (items 2, 3)" allow "$A2" Bash "$c"
done
# Item 4: the refusal names the launch-time bypass too (no terminal on the web).
NU=$(new_repo uninstall-message)
out=$(CLAUDECODE=1 node "$PREPUSH" --uninstall "$NU" 2>&1) || true
if printf '%s' "$out" | grep -q "BLOG_LIFECYCLE_GATE_BYPASS=1"; then pass "N. refusal mentions the launch-time bypass (item 4)"; else fail "N. refusal mentions the launch-time bypass (item 4) ($out)"; fi
# Item 5: the files to copy come from origin/main's checker, not this one.
# hooks_on_main <name> <COPIED list> [extra helper]: origin/main carries a checker
# whose COPIED line is <list> and which requires ./lifecycle-extra when given.
hooks_on_main() {
  local r; r=$(new_repo "$1"); mkdir -p "$r/hooks"; rm -f "$r/.git/hooks/pre-push"
  sed "s#^const COPIED = .*#const COPIED = $2;#" "$REPO_ROOT/hooks/lifecycle-prepush.js" > "$r/hooks/lifecycle-prepush.js"
  cp "$REPO_ROOT/hooks/lifecycle-snapshot.js" "$r/hooks/"
  if [ -n "${3:-}" ]; then
    printf "require('./lifecycle-extra');\n" >> "$r/hooks/lifecycle-prepush.js"
    printf 'module.exports = {};\n' > "$r/hooks/lifecycle-extra.js"
  fi
  commit_all "$r" "hooks on main"; git -C "$r" push -q origin main 2>/dev/null
  echo "$r"
}
NM=$(hooks_on_main manifest "['lifecycle-prepush.js', 'lifecycle-snapshot.js', 'lifecycle-extra.js']" extra)
rc=0; out=$(node "$PREPUSH" --install "$NM" 2>&1) || rc=$?
check "N. a helper added on origin/main is copied and the checker loads (item 5)" \
  "$rc:$([ -f "$NM/.git/lifecycle-gate/lifecycle-extra.js" ] && echo extra || echo noextra):$(git -C "$NM" show origin/main:hooks/lifecycle-prepush.js | cmp -s - "$NM/.git/lifecycle-gate/lifecycle-prepush.js" && echo from-main || echo fallback)" \
  "0:extra:from-main"
NX=$(hooks_on_main manifest-missing "['lifecycle-prepush.js', 'lifecycle-snapshot.js', 'lifecycle-extra.js']")
rc=0; node "$PREPUSH" --install "$NX" >/dev/null 2>&1 || rc=$?
check "N. a listed helper missing on origin/main: install refuses (item 5, R40)" "$rc:$([ -e "$NX/.git/hooks/pre-push" ] && echo shim || echo noshim)" "2:shim"
NT=$(hooks_on_main manifest-traversal "['lifecycle-prepush.js', 'lifecycle-snapshot.js', '../../evil.js']")
rc=0; node "$PREPUSH" --install "$NT" >/dev/null 2>&1 || rc=$?
check "N. a list naming a path outside hooks/: install refuses (item 5)" "$rc:$([ -e "$NT/.git/hooks/pre-push" ] && echo shim || echo noshim):$([ -e "$NT/evil.js" ] && echo written || echo safe)" "2:shim:safe"
NC=$(new_repo manifest-absent); rm -f "$NC/.git/hooks/pre-push"
sed -i '/^const COPIED = /d' "$NC/hooks/lifecycle-prepush.js"; commit_all "$NC" "checker without a COPIED line"; git -C "$NC" push -q origin main 2>/dev/null
rc=0; node "$PREPUSH" --install "$NC" >/dev/null 2>&1 || rc=$?
check "N. a checker on origin/main without a COPIED line: install refuses (review nit 2)" "$rc:$([ -e "$NC/.git/hooks/pre-push" ] && echo shim || echo noshim)" "2:shim"
cp "$REPO_ROOT/hooks/lifecycle-prepush.js" "$NM/hooks/"; git -C "$NM" rm -q hooks/lifecycle-extra.js
commit_all "$NM" "helper dropped"; git -C "$NM" push -q origin main 2>/dev/null
rc=0; node "$PREPUSH" --install "$NM" >/dev/null 2>&1 || rc=$?
check "N. a helper no longer listed is pruned from the copy (review nit 1)" "$rc:$([ -f "$NM/.git/lifecycle-gate/lifecycle-extra.js" ] && echo stale || echo pruned)" "0:pruned"
# R49: pointing origin/main at a commit from before the hooks (a fetch from the
# named remote, which the gate allows) must not let a weakened working tree in.
ND=$(new_repo downgrade nohooks); PRE=$(git -C "$ND" rev-parse HEAD)
mkdir -p "$ND/hooks"; cp "$REPO_ROOT/hooks/lifecycle-prepush.js" "$REPO_ROOT/hooks/lifecycle-snapshot.js" "$ND/hooks/"
commit_all "$ND" "hooks on main"; git -C "$ND" push -q origin main 2>/dev/null; node "$PREPUSH" --install "$ND" >/dev/null 2>&1 || true
gate_case "N. fetching an older origin commit into origin/main is allowed by the gate (R43)" allow "$ND" Bash "git fetch origin +$PRE:refs/remotes/origin/main"
git -C "$ND" fetch -q origin "+$PRE:refs/remotes/origin/main"; printf '\n// WEAKENED\n' >> "$ND/hooks/lifecycle-prepush.js"
# In a session the installer runs from the repo's own hooks/ (SessionStart, the gate).
rc=0; node "$ND/hooks/lifecycle-prepush.js" --install "$ND" >/dev/null 2>&1 || rc=$?
check "N. origin/main moved before the hooks: install refuses, the copy is not the working tree (R49)" \
  "$rc:$(grep -q WEAKENED "$ND/.git/lifecycle-gate/lifecycle-prepush.js" && echo weakened || echo intact)" "2:intact"
# R52: a committed checker from before R38 (no SOURCE_REF floor line) trusts
# local tracking refs; pointing origin/main at one must not install it.
NR=$(new_repo rollback); sed -i "/^const SOURCE_REF = /d" "$NR/hooks/lifecycle-prepush.js"
commit_all "$NR" "pre-R38 checker"; git -C "$NR" push -q origin main 2>/dev/null
rc=0; out=$(node "$PREPUSH" --install "$NR" 2>&1) || rc=$?
check "N. a checker below the floor on origin/main: install refuses, the copy stays current (R52)" \
  "$rc:$(grep -c "^const SOURCE_REF = 'refs/remotes/origin/main';" "$NR/.git/lifecycle-gate/lifecycle-prepush.js")" "2:1"
if printf '%s' "$out" | grep -q "older than"; then pass "N. the floor refusal says why (R52)"; else fail "N. the floor refusal says why (R52) ($out)"; fi
# Review round 2 nit: a symlinked copy dir is refused before anything is pruned.
SY=$(new_repo symlinked-copy); mkdir -p "$TMP/outside"; printf 'keep\n' > "$TMP/outside/victim.js"
rm -rf "$SY/.git/lifecycle-gate"; ln -s "$TMP/outside" "$SY/.git/lifecycle-gate"
rc=0; node "$PREPUSH" --install "$SY" >/dev/null 2>&1 || rc=$?
check "N. a symlinked copy dir: install refuses, nothing outside is deleted (R54)" "$rc:$([ -f "$TMP/outside/victim.js" ] && echo kept || echo deleted)" "2:kept"
gate_case "N. the gate's uninstall denial names the launch-time bypass (review nit 4)" deny "$A2" Bash \
  "node hooks/lifecycle-prepush.js --uninstall" "BLOG_LIFECYCLE_GATE_BYPASS=1"
gate_case "N. allowed: a local mirror fetched into its own tracking refs (review nit 6)" allow "$A2" Bash \
  "git fetch /srv/mirror 'refs/heads/*:refs/remotes/mirror/*'"
# Item 7: a force-push that rewinds to a commit the remote ref already contains
# publishes nothing, so it passes even with stale snapshots; anything else is checked.
NF=$(new_repo rewind); printf 'two\n' >> "$NF/a.txt"; commit_all "$NF" reviewed; record_both "$NF"
push_case "N. reviewed commit pushed (setup)" accept "$NF" refs/heads/main "$(git -C "$NF" rev-parse HEAD)" "cd '$NF' && git push origin main"
git -C "$NF" reset -q --hard HEAD~1
push_case "N. force-push rewind to an ancestor passes (item 7)" accept "$NF" refs/heads/main "$(git -C "$NF" rev-parse HEAD)" "cd '$NF' && git push --force origin main"
printf 'unreviewed\n' > "$NF/b.txt"; commit_all "$NF" unreviewed
push_case "N. force-push of a commit the remote lacks is checked (item 7)" reject "$NF" refs/heads/main "$(git -C "$NF" rev-parse HEAD)" "cd '$NF' && git push --force origin main"

echo ""
echo "Passed: $PASS  Failed: $FAIL"
[ "$FAIL" -eq 0 ]
