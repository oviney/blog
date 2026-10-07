#!/usr/bin/env bash
# lifecycle-hooks.sh — fixture tests for the Claude Code lifecycle hooks (#1340)
#
# Each gate/recorder case builds a throwaway git repo, feeds the hook the JSON
# Claude Code sends on stdin, and asserts on the hook's decision and output.
# Cases follow specs/agent-skills-lifecycle-enforcement.md (Amendments 1 and
# 1.1); R1-R14 refer to the review findings recorded there.
#
#   A. SessionStart emits hookSpecificOutput.additionalContext with the meta-skill
#   B. UserPromptSubmit reminder is emitted
#   C. Recorder: Skill test/review and typed /test, /review record a snapshot;
#      code-review, blog:test, /code-review and mid-sentence /test do not; the
#      recorder never blocks
#   D. Gate: nothing recorded                         → deny, names test + review
#   E. Gate: only test recorded                       → deny, names review only
#   F. Gate: reviewed uncommitted work, then commit   → allow
#   G. Gate: file changed by plain shell after review → deny, lists the path (R1)
#   H. Gate: new file committed after review          → deny; uncommitted edit → allow
#   I. Gate: every push form from R4 (and earlier)    → deny when stale
#   J. Gate: gh pr create, gh api POST, MCP writes    → deny when stale;
#      MCP write allowed when the working tree matches
#   K. Gate: false-positive forms (R5) and read-only commands → allow
#   L. Gate: bypass env allows; bypass in the command string does not
#   M. Gate: null / malformed stdin                   → no crash; gated MCP call denies (R2)
#   N. Gate: not a git repo                           → deny (fail closed)
#   O. hooks/hooks.json quotes ${CLAUDE_PLUGIN_ROOT} (R7)
#   P. Refspecs (R8): unreviewed feat via feat, feat:main, +feat, --head feat,
#      head=feat, --input head, MCP head → deny; main, HEAD:x, deletes,
#      --dry-run → allow; --all/--mirror/--tags/--branches → always deny;
#      unknown ref → deny
#   Q. Target repo (R9): cd / -C into an unreviewed repo → deny; -C into a
#      reviewed repo from an unreviewed cwd → allow; quoted paths with spaces
#   R. Parser (R10): --git-dir X, --work-tree X, sudo -u, line continuation
#   S. Concurrency (R11): 20 parallel test+review records keep both
#   T. Temp index (R12): no temp files left behind
#
# Dependencies: bash, git, node. Same as the hooks under test.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
GATE="$REPO_ROOT/hooks/lifecycle-gate.js"
RECORD="$REPO_ROOT/hooks/lifecycle-record.js"

PASS=0
FAIL=0
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
# The hooks must not see the developer's own bypass or project dir.
unset BLOG_LIFECYCLE_GATE_BYPASS CLAUDE_PROJECT_DIR

pass() { echo "  ✅ $1"; PASS=$((PASS + 1)); }
fail() { echo "  ❌ $1"; FAIL=$((FAIL + 1)); }

# new_repo <name>: a git repo with one committed file, prints its path.
new_repo() {
  local r="$TMP/$1"
  git init -q "$r"
  git -C "$r" config user.email "lifecycle-test@example.com"
  git -C "$r" config user.name "lifecycle-test"
  git -C "$r" config commit.gpgsign false
  printf 'one\n' > "$r/a.txt"
  git -C "$r" add . && git -C "$r" commit -q -m "baseline"
  echo "$r"
}

commit_all() { git -C "$1" add -A && git -C "$1" commit -q -m "${2:-change}"; }

# json <node expression using argv a, b, c>: prints JSON built in node.
json() { local expr="$1"; shift; node -e "const [a,b,c]=process.argv.slice(1);process.stdout.write(JSON.stringify($expr))" "$@"; }

record_skill()  { json '{hook_event_name:"PostToolUse",cwd:a,tool_name:"Skill",tool_input:{skill:b}}' "$1" "$2" | node "$RECORD"; }
record_prompt() { json '{hook_event_name:"UserPromptSubmit",cwd:a,prompt:b}' "$1" "$2" | node "$RECORD"; }
recorded()      { node -e 'const fs=require("fs");
  process.stdout.write(["review","test"].filter(k=>fs.existsSync(process.argv[1]+"/.git/lifecycle-gate-"+k+".json")).join(","))' "$1"; }
record_both()   { record_skill "$1" test; record_skill "$1" review; }

# gate_out <repo> <tool_name> <command | MCP tool_input JSON>: the gate's stdout.
gate_out() {
  json 'b==="Bash"?{hook_event_name:"PreToolUse",cwd:a,tool_name:b,tool_input:{command:c}}:{hook_event_name:"PreToolUse",cwd:a,tool_name:b,tool_input:Object.assign({owner:"o",repo:"r"},c?JSON.parse(c):{})}' "$1" "$2" "$3" \
    | node "$GATE" 2>/dev/null
}

decision() { node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
  if(!s.trim()){console.log("allow");return}
  try{console.log(JSON.parse(s).hookSpecificOutput.permissionDecision)}catch(e){console.log("unparseable")}})'; }

# gate_case <name> <allow|deny> <repo> <tool_name> <command> [grep] [not_grep]
gate_case() {
  local name="$1" expect="$2" repo="$3" tool="$4" cmd="$5" want="${6:-}" unwanted="${7:-}"
  local out got
  out=$(gate_out "$repo" "$tool" "$cmd") || { fail "$name (gate exited non-zero)"; return; }
  got=$(printf '%s' "$out" | decision)
  if [ "$got" != "$expect" ]; then fail "$name (expected $expect, got $got)"; return; fi
  if [ -n "$want" ] && ! printf '%s' "$out" | grep -q -- "$want"; then fail "$name (output lacks '$want')"; return; fi
  if [ -n "$unwanted" ] && printf '%s' "$out" | grep -q -- "$unwanted"; then fail "$name (output has '$unwanted')"; return; fi
  pass "$name"
}

check() { if [ "$2" = "$3" ]; then pass "$1"; else fail "$1 (expected '$3', got '$2')"; fi; }

context_of() {
  echo '{}' | CLAUDE_PROJECT_DIR="$REPO_ROOT" bash "$1" 2>/dev/null | node -e 'let s="";
    process.stdin.on("data",d=>s+=d).on("end",()=>{try{
      process.stdout.write(JSON.parse(s).hookSpecificOutput.additionalContext||"")}catch(e){}})'
}

echo "Case A: SessionStart"
ctx=$(context_of "$REPO_ROOT/hooks/session-start.sh" || true)
if printf '%s' "$ctx" | grep -q "Using Agent Skills"; then pass "A. meta-skill injected"; else fail "A. meta-skill injected"; fi

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

echo "Cases D-H: freshness"
D=$(new_repo none)
gate_case "D. nothing recorded" deny "$D" Bash "git push" "content: test, review"
E=$(new_repo only-test); record_skill "$E" test
gate_case "E. only test recorded" deny "$E" Bash "git push" "content: review" "content: test"
F=$(new_repo fresh); printf 'two\n' > "$F/b.txt"; record_both "$F"; commit_all "$F"
gate_case "F. reviewed work, then committed" allow "$F" Bash "git push -u origin feature"
G=$(new_repo shell-edit); record_both "$G"; sed -i 's/one/ONE/' "$G/a.txt"; commit_all "$G"
gate_case "G. sed edit after review (R1)" deny "$G" Bash "git push" "a.txt"
H=$(new_repo new-file); record_both "$H"; printf 'x\n' > "$H/new.txt"; commit_all "$H"
gate_case "H. new file after review" deny "$H" Bash "git push" "new.txt"
H2=$(new_repo uncommitted); record_both "$H2"; printf 'wip\n' >> "$H2/a.txt"
gate_case "H. uncommitted edit, HEAD still reviewed" allow "$H2" Bash "git push"

echo "Case I: push forms (stale repo)"
for c in "git push" "git push -u origin main" "cd /r && git add . && git commit -m x && git push" \
         "git -C /r push origin HEAD" "GIT_TRACE=1 git push" $'echo start\ngit push' "(git push)" \
         "(cd /r && git push)" "env GIT_TRACE=1 git push" "timeout 120 git push origin HEAD" \
         "nohup git push &" 'bash -c "git push"' "sh -c 'cd /r && git push'" "echo HEAD | xargs git push origin" \
         "/usr/bin/git push" '\git push' 'git -C "/path with space" push' "git --git-dir=/r/.git push" \
         "git -c http.x=y push" "git push 2>&1 | tail -2" "git push&&echo ok"; do
  gate_case "I. $c" deny "$D" Bash "$c"
done

echo "Case J: PR creation and MCP writes"
gate_case "J. gh pr create" deny "$D" Bash "gh pr create --title x"
gate_case "J. gh api POST pulls" deny "$D" Bash "gh api repos/o/r/pulls -f title=x -f head=b"
gate_case "J. gh api -X POST quoted endpoint" deny "$D" Bash 'gh api -X POST "repos/o/r/pulls" --input body.json'
for t in create_pull_request push_files create_or_update_file delete_file; do
  gate_case "J. MCP $t stale" deny "$D" "mcp__github__$t" ""
done
J=$(new_repo mcp-fresh); record_both "$J"
gate_case "J. MCP push_files on reviewed tree" allow "$J" mcp__github__push_files ""

echo "Case K: not pushes"
gate_case "K. heredoc commit message" allow "$D" Bash $'git commit -F - <<\'EOF\'\nfix: x\n\ngit push is now gated\nEOF'
gate_case "K. heredoc docs file" allow "$D" Bash $'cat > d.md <<EOF\n```bash\ngit push -u origin b\n```\nEOF'
gate_case "K. && inside a quoted message" allow "$D" Bash 'git commit -m "fix && git push later"'
gate_case "K. grep for the string" allow "$D" Bash 'grep -rn "git push" docs/'
gate_case "K. gh api -X GET with -f" allow "$D" Bash "gh api -X GET repos/o/r/pulls -f state=closed"
gate_case "K. gh api GET pulls" allow "$D" Bash "gh api repos/o/r/pulls --jq '.[].number'"
gate_case "K. git stash push" allow "$D" Bash "git stash push -m wip"
gate_case "K. git status / log / commit" allow "$D" Bash "git status && git log --oneline -3 && git commit -m wip"
gate_case "K. not a push subcommand" allow "$D" Bash "git push-hook-test"
gate_case "K. MCP read tool" allow "$D" mcp__github__pull_request_read ""

echo "Case L: bypass"
out=$(json '{hook_event_name:"PreToolUse",cwd:a,tool_name:"Bash",tool_input:{command:"git push"}}' "$D" \
  | BLOG_LIFECYCLE_GATE_BYPASS=1 node "$GATE" 2>/dev/null || echo "exit-nonzero")
check "L. bypass env allows push" "$out" ""
gate_case "L. bypass in command string" deny "$D" Bash "BLOG_LIFECYCLE_GATE_BYPASS=1 git push"

echo "Case M: malformed input"
out=$(printf 'null' | node "$GATE" 2>/dev/null; echo "rc=$?"); check "M. null stdin, no crash" "$out" "rc=0"
out=$(printf 'not json' | node "$GATE" 2>/dev/null; echo "rc=$?"); check "M. non-JSON stdin allowed" "$out" "rc=0"
out=$(json '{tool_name:"Bash",tool_input:null,cwd:a}' "$D" | node "$GATE" 2>/dev/null; echo "rc=$?")
check "M. Bash with null input allowed" "$out" "rc=0"
got=$(json '{tool_name:"mcp__github__push_files",tool_input:null,cwd:a}' "$D" | node "$GATE" 2>/dev/null | decision)
check "M. gated MCP call with null input denies (R2)" "$got" "deny"

echo "Case N: not a git repo"
mkdir -p "$TMP/plain"
gate_case "N. push outside a git repo fails closed" deny "$TMP/plain" Bash "git push" "could not verify"

echo "Case O: plugin hook path"
if grep -q '"bash \\"${CLAUDE_PLUGIN_ROOT}\\"/hooks/session-start.sh"' "$REPO_ROOT/hooks/hooks.json"; then
  pass "O. CLAUDE_PLUGIN_ROOT quoted (R7)"; else fail "O. CLAUDE_PLUGIN_ROOT quoted (R7)"; fi

echo "Case P: refspecs (R8)"
P=$(new_repo refspecs)
git -C "$P" checkout -q -b feat; printf 'evil\n' > "$P/evil.txt"; commit_all "$P" "unreviewed"
git -C "$P" checkout -q -; record_both "$P"
printf '{"head":"feat","base":"main"}' > "$TMP/body-feat.json"
for c in "git push origin feat" "git push origin feat:main" "git push origin +feat" "git push -u origin feat" \
         "gh pr create --head feat --title x" "gh pr create -H feat --title x" \
         "gh api repos/o/r/pulls -f head=feat -f base=main" "gh api -X POST repos/o/r/pulls --input $TMP/body-feat.json"; do
  gate_case "P. $c" deny "$P" Bash "$c" "feat"
done
gate_case "P. MCP create_pull_request head feat" deny "$P" mcp__github__create_pull_request '{"head":"feat","base":"main"}'
gate_case "P. MCP create_pull_request head main" allow "$P" mcp__github__create_pull_request '{"head":"main","base":"x"}'
for c in "git push origin main" "git push -u origin main" "git push origin HEAD:refs/heads/x" "gh pr create --title x" \
         "git push origin :old" "git push origin --delete old" "git push --dry-run origin feat" "git push -n origin feat"; do
  gate_case "P. $c" allow "$P" Bash "$c"
done
J2=$(new_repo all-reviewed); record_both "$J2"
for c in "git push --all origin" "git push --mirror origin" "git push --tags" "git push origin --branches"; do
  gate_case "P. bulk: $c" deny "$J2" Bash "$c" "one at a time"
done
gate_case "P. unknown ref" deny "$P" Bash "git push origin nosuch" "nosuch"

echo "Case Q: target repo (R9)"
SP_REPO=$(new_repo "with space"); record_both "$SP_REPO"
gate_case "Q. cd into unreviewed repo" deny "$J2" Bash "cd $D && git push"
gate_case "Q. -C into unreviewed repo" deny "$J2" Bash "git -C $D push"
gate_case "Q. -C into reviewed repo from unreviewed cwd" allow "$D" Bash "git -C $J2 push"
gate_case "Q. quoted -C path with spaces, reviewed" allow "$D" Bash "git -C \"$SP_REPO\" push origin main"
gate_case "Q. quoted cd path with spaces, reviewed" allow "$D" Bash "cd '$SP_REPO' && git push"
gate_case "Q. relative cd then push" deny "$J2" Bash "cd ../none && git push"

echo "Case R: parser (R10)"
gate_case "R. --git-dir <dir> from reviewed cwd" deny "$J2" Bash "git --git-dir $D/.git push"
gate_case "R. --work-tree X --git-dir X" deny "$D" Bash "git --work-tree . --git-dir .git push"
gate_case "R. sudo -u me git push" deny "$D" Bash "sudo -u me git push"
gate_case "R. line continuation" deny "$D" Bash $'git \\\n  push origin main'

echo "Case S: concurrent records (R11)"
S=$(new_repo concurrent); ok=0
for i in $(seq 1 20); do
  rm -f "$S"/.git/lifecycle-gate-*.json
  record_skill "$S" test & record_skill "$S" review & wait
  [ "$(recorded "$S")" = "review,test" ] && ok=$((ok + 1))
done
check "S. both snapshots kept in 20/20 parallel runs" "$ok" "20"

echo "Case T: temp index (R12)"
mkdir -p "$TMP/tmpcheck"
TMPDIR="$TMP/tmpcheck" record_both "$J2"
json '{hook_event_name:"PreToolUse",cwd:a,tool_name:"mcp__github__push_files",tool_input:{}}' "$J2" | TMPDIR="$TMP/tmpcheck" node "$GATE" >/dev/null 2>&1 || true
check "T. no temp files left behind" "$(ls -A "$TMP/tmpcheck")" ""

echo ""
echo "Passed: $PASS  Failed: $FAIL"
[ "$FAIL" -eq 0 ]
