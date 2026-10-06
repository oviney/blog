#!/usr/bin/env bash
# lifecycle-hooks.sh — fixture tests for the Claude Code lifecycle hooks (#1340)
#
# Each case feeds a hook the JSON Claude Code sends on stdin, plus a synthetic
# JSONL transcript shaped like a real session's, then asserts on the hook's
# decision and output.
#
# Cases (per specs/agent-skills-lifecycle-enforcement.md):
#   A. SessionStart emits hookSpecificOutput.additionalContext with the meta-skill
#   B. UserPromptSubmit emits the lifecycle reminder
#   C. git push, no skills in transcript                 → deny, names test + review
#   D. git push, only `test` ran                         → deny, names review only
#   E. git push, test + review after the last edit       → allow
#   F. git push, test + review, then an Edit             → deny (stale)
#   G. git push, user-typed /test and /review            → allow
#   H. git push, only /code-review and code-review skill → deny (not the repo skill)
#   I. gh pr create, gh api POST .../pulls, chained and -C pushes, and the
#      MCP push/PR tools                                 → deny
#   J. git status, git log, gh api GET .../pulls, other MCP tools → allow
#   K. BLOG_LIFECYCLE_GATE_BYPASS=1 in the hook env      → allow
#   L. Bypass set inside the command string only         → deny
#   M. git push, transcript missing                      → deny (fail closed)
#   N. Malformed stdin                                   → allow (not a push we can see)
#
# Dependencies: bash, node. Same as the hooks under test.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
GATE="$REPO_ROOT/hooks/lifecycle-gate.js"

PASS=0
FAIL=0
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

pass() { echo "  ✅ $1"; PASS=$((PASS + 1)); }
fail() { echo "  ❌ $1"; FAIL=$((FAIL + 1)); }

# Transcript line builders, matching the JSONL Claude Code writes.
t_skill() { printf '{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Skill","input":{"skill":"%s"}}]}}\n' "$1"; }
t_edit()  { printf '{"type":"assistant","message":{"content":[{"type":"tool_use","name":"%s","input":{"file_path":"x"}}]}}\n' "${1:-Edit}"; }
t_typed() { printf '{"type":"queue-operation","operation":"enqueue","content":"%s"}\n' "$1"; }
t_text()  { printf '{"type":"user","message":{"role":"user","content":"hello"}}\n'; }

# transcript <name> <lines...>: writes a transcript file, prints its path.
transcript() {
  local f="$TMP/$1.jsonl"; shift
  : > "$f"
  local line
  for line in "$@"; do printf '%s\n' "$line" >> "$f"; done
  echo "$f"
}

# hook_input <transcript> <tool_name> <command>: PreToolUse stdin JSON.
hook_input() {
  node -e 'const [t, n, c] = process.argv.slice(1);
    const input = n === "Bash" ? { command: c } : { owner: "oviney", repo: "blog" };
    process.stdout.write(JSON.stringify({ session_id: "s", transcript_path: t,
      hook_event_name: "PreToolUse", tool_name: n, tool_input: input }));' "$1" "$2" "$3"
}

# gate_case <name> <expect allow|deny> <transcript> <tool_name> <command> [grep] [not_grep]
gate_case() {
  local name="$1" expect="$2" t="$3" tool="$4" cmd="$5" want="${6:-}" unwanted="${7:-}"
  local out decision
  out=$(hook_input "$t" "$tool" "$cmd" | node "$GATE" 2>/dev/null) || { fail "$name (gate exited non-zero)"; return; }
  decision=$(printf '%s' "$out" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
    if(!s.trim()){console.log("allow");return}
    console.log(JSON.parse(s).hookSpecificOutput.permissionDecision)})' 2>/dev/null || echo "unparseable")
  if [ "$decision" != "$expect" ]; then fail "$name (expected $expect, got $decision)"; return; fi
  if [ -n "$want" ] && ! printf '%s' "$out" | grep -q -- "$want"; then fail "$name (output lacks '$want')"; return; fi
  if [ -n "$unwanted" ] && printf '%s' "$out" | grep -q -- "$unwanted"; then fail "$name (output has '$unwanted')"; return; fi
  pass "$name"
}

# context_of <script>: runs a context hook, prints additionalContext (empty on failure).
context_of() {
  echo '{}' | CLAUDE_PROJECT_DIR="$REPO_ROOT" bash "$1" 2>/dev/null | node -e 'let s="";
    process.stdin.on("data",d=>s+=d).on("end",()=>{try{
      process.stdout.write(JSON.parse(s).hookSpecificOutput.additionalContext||"")}catch(e){}})'
}

echo "Case A: SessionStart"
ctx=$(context_of "$REPO_ROOT/hooks/session-start.sh" || true)
if printf '%s' "$ctx" | grep -q "Using Agent Skills"; then pass "A. meta-skill injected"; else fail "A. meta-skill injected"; fi

echo "Case B: UserPromptSubmit"
ctx=$(context_of "$REPO_ROOT/hooks/lifecycle-reminder.sh" || true)
if printf '%s' "$ctx" | grep -q "spec" && printf '%s' "$ctx" | grep -q "review"; then
  pass "B. lifecycle reminder injected"; else fail "B. lifecycle reminder injected"; fi

echo "Cases C-N: push gate"
NONE=$(transcript none "$(t_text)" "$(t_edit)")
ONLY_TEST=$(transcript only-test "$(t_edit)" "$(t_skill test)")
FRESH=$(transcript fresh "$(t_edit Write)" "$(t_skill test)" "$(t_skill review)")
STALE=$(transcript stale "$(t_skill test)" "$(t_skill review)" "$(t_edit)")
TYPED=$(transcript typed "$(t_edit NotebookEdit)" "$(t_typed '/test')" "$(t_typed '/review ')")
BUILTIN=$(transcript builtin "$(t_edit)" "$(t_skill test)" "$(t_typed '/code-review')" "$(t_skill code-review)")

gate_case "C. push with no skills" deny "$NONE" Bash "git push -u origin main" "test" ""
gate_case "C. names review too" deny "$NONE" Bash "git push" "review" ""
gate_case "D. push with only test" deny "$ONLY_TEST" Bash "git push" "missing: review" "missing: test"
gate_case "E. test + review after last edit" allow "$FRESH" Bash "git push -u origin feature"
gate_case "F. edit after test + review" deny "$STALE" Bash "git push" "missing: test, review"
gate_case "G. user-typed /test and /review" allow "$TYPED" Bash "git push"
gate_case "H. /code-review is not review" deny "$BUILTIN" Bash "git push" "missing: review"

gate_case "I. gh pr create" deny "$NONE" Bash "gh pr create --title x"
gate_case "I. gh api POST pulls" deny "$NONE" Bash "gh api repos/oviney/blog/pulls -f title=x -f head=b"
gate_case "I. gh api -X POST pulls" deny "$NONE" Bash "gh api -X POST repos/oviney/blog/pulls --input body.json"
gate_case "I. chained push" deny "$NONE" Bash "cd /repo && git add . && git commit -m x && git push"
gate_case "I. git -C push" deny "$NONE" Bash "git -C /repo push origin HEAD"
gate_case "I. env-prefixed push" deny "$NONE" Bash "GIT_TRACE=1 git push"
gate_case "I. push on a later line" deny "$NONE" Bash $'echo start\ngit push'
gate_case "I. MCP create_pull_request" deny "$NONE" mcp__github__create_pull_request ""
gate_case "I. MCP push_files" deny "$NONE" mcp__github__push_files ""
gate_case "I. MCP create_or_update_file" deny "$NONE" mcp__github__create_or_update_file ""
gate_case "I. MCP delete_file" deny "$NONE" mcp__github__delete_file ""

gate_case "J. git status" allow "$NONE" Bash "git status"
gate_case "J. git log" allow "$NONE" Bash "git log --oneline -3"
gate_case "J. not a push subcommand" allow "$NONE" Bash "git push-hook-test"
gate_case "J. git commit" allow "$NONE" Bash "git commit -m 'wip'"
gate_case "J. gh api GET pulls" allow "$NONE" Bash "gh api repos/oviney/blog/pulls --jq '.[].number'"
gate_case "J. MCP read tool" allow "$NONE" mcp__github__pull_request_read ""

out=$(hook_input "$NONE" Bash "git push" | BLOG_LIFECYCLE_GATE_BYPASS=1 node "$GATE" 2>/dev/null || echo "exit-nonzero")
if [ -z "$out" ]; then pass "K. bypass env allows push"; else fail "K. bypass env allows push"; fi

gate_case "L. bypass in command string" deny "$NONE" Bash "BLOG_LIFECYCLE_GATE_BYPASS=1 git push"
gate_case "M. missing transcript fails closed" deny "$TMP/does-not-exist.jsonl" Bash "git push" "transcript"

out=$(printf 'not json' | node "$GATE" 2>/dev/null || echo "exit-nonzero")
if [ -z "$out" ]; then pass "N. malformed stdin allowed"; else fail "N. malformed stdin allowed"; fi

echo ""
echo "Passed: $PASS  Failed: $FAIL"
[ "$FAIL" -eq 0 ]
