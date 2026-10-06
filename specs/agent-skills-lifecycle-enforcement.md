# Spec: Enforce the agent-skills lifecycle in Claude Code sessions

Status: Approved 2026-10-06
Issue: #1340
Owner decision: 2026-10-02, all four layers approved

## Objective

`CLAUDE.md` tells direct Claude Code sessions to run the lifecycle skills
(`spec`, `plan`, `build`, `test`, `review`, `ship`), but nothing enforces it. On
2026-09-30 a session diagnosed and pushed the service-worker stale-CSS fix
(branch `ccr-04a20580-7eh69y`) without invoking a single lifecycle skill.

Root causes found:

1. **The SessionStart hook is dead.** `hooks/hooks.json` runs
   `bash ${CLAUDE_PLUGIN_ROOT}/hooks/session-start.sh`. `CLAUDE_PLUGIN_ROOT` is
   only set when the repo is installed as a Claude Code plugin; there is no
   plugin manifest and no `.claude/settings.json`, so the hook never runs.
2. **The hook's output format is wrong.** `session-start.sh` prints
   `{"priority": ..., "message": ...}`, which Claude Code ignores. Claude Code
   reads `hookSpecificOutput.additionalContext`.
3. **The instruction is advisory.** `CLAUDE.md` says agents "should invoke"
   the skills.
4. **Nothing stops a push.** An agent that ignores the instructions can still
   commit, push and open a PR.

Desired behaviour: every Claude Code session in this repo starts with the
meta-skill loaded, is reminded of the lifecycle on every prompt, reads a
mandatory rule in `CLAUDE.md`, and cannot push or open a PR until the `test`
and `review` skills have run after its last file edit.

## Assumptions

1. Scope is Claude Code sessions (local CLI, desktop, and Claude Code on the
   web). Copilot cloud agents keep their own routing in
   `.github/copilot-instructions.md` and are out of scope.
2. Hooks are registered in a committed project `.claude/settings.json` using
   `$CLAUDE_PROJECT_DIR`, so they apply to every clone without plugin install.
3. Hook logic is written in Node (already required by the repo) rather than
   bash + `jq`, because the gate must parse JSON hook input and a JSONL
   transcript reliably.
4. "Skill ran" means the session transcript contains either a `Skill` tool
   call with `skill` equal to `test` / `review`, or a user-typed `/test` /
   `/review` slash command.
5. Freshness: a skill run only counts if it happened after the last
   `Edit`, `Write` or `NotebookEdit` tool call. File changes made through
   `Bash` (sed, heredocs) are not detected; this is a known limitation.
6. The escape hatch is the environment variable
   `BLOG_LIFECYCLE_GATE_BYPASS=1` in the Claude Code process environment.
   The agent cannot set it from a `Bash` tool call, because hooks inherit
   Claude Code's environment, not the tool command's.
7. `hooks/hooks.json` stays for plugin installs, pointing at the same script.

## Layers

| # | Layer | Mechanism | Effect |
|---|-------|-----------|--------|
| 1 | Session start | `SessionStart` hook, `hooks/session-start.sh` | Injects `.github/skills/using-agent-skills/SKILL.md` as context |
| 2 | Per-prompt reminder | `UserPromptSubmit` hook, `hooks/lifecycle-reminder.sh` | Injects a short lifecycle-order reminder on every prompt |
| 3 | Mandatory rule | `CLAUDE.md` | "Must" wording plus a top-of-file rule: no commit, push or PR before `test` and `review` |
| 4 | Push gate | `PreToolUse` hook, `hooks/lifecycle-gate.js` | Denies `git push`, `gh pr create`, `gh api .../pulls` POST and `mcp__github__create_pull_request` unless `test` and `review` ran after the last edit |

## Commands

```bash
bash tests/lifecycle-hooks.sh                   # fixture tests for all hooks
bundle exec jekyll build                        # site still builds
bash scripts/check-pr-scope.sh                  # scope guard passes
echo '{}' | bash hooks/session-start.sh | node -e 'JSON.parse(require("fs").readFileSync(0))'
```

## Project Structure

```
.claude/settings.json          → NEW: registers the three hooks
hooks/session-start.sh         → FIX: correct output format
hooks/lifecycle-reminder.sh    → NEW: UserPromptSubmit reminder
hooks/lifecycle-gate.js        → NEW: PreToolUse push/PR gate
hooks/hooks.json               → unchanged (plugin path)
CLAUDE.md                      → mandatory wording + top-of-file rule
tests/lifecycle-hooks.sh       → NEW: fixture tests
.github/workflows/test-build.yml → run tests/lifecycle-hooks.sh next to scope-guard.sh
```

## Code Style

Match `tests/scope-guard.sh`: header comment listing every case, `set -euo
pipefail`, a `run_case` helper asserting exit code and an output grep, a
PASS/FAIL tally. Hooks fail open on internal errors (malformed input,
unreadable transcript) except the gate, which fails closed for push/PR
commands so a parsing bug cannot silently disable it.

## Testing Strategy

`tests/lifecycle-hooks.sh` feeds hook-input JSON on stdin and synthetic JSONL
transcripts, and asserts:

- A. SessionStart emits valid JSON with `hookSpecificOutput.additionalContext`
  containing the meta-skill text.
- B. UserPromptSubmit emits the reminder.
- C. Gate: `git push` with no skills in transcript → denied.
- D. Gate: `git push` with only `test` → denied, names `review` as missing.
- E. Gate: `git push` with `test` and `review` after the last edit → allowed.
- F. Gate: `test` and `review`, then an `Edit` → denied (stale).
- G. Gate: user-typed `/test` and `/review` count.
- H. Gate: `gh pr create` and `mcp__github__create_pull_request` are gated.
- I. Gate: unrelated commands (`git status`, `git log`, `git push-hook-test`)
  → allowed. Detecting `git push` hidden inside quoted strings or `eval` is out
  of scope.
- J. Gate: `BLOG_LIFECYCLE_GATE_BYPASS=1` → allowed.
- K. Gate: missing or unreadable transcript on a push → denied (fail closed).

Then a live check in a real session: the gate denies a push before
`test`/`review`, and allows it after.

## Boundaries

- Always: keep hooks fast (< 1 s), dependency-free beyond Node and bash.
- Ask first: extending the gate to `git commit`.
- Never: modify protected files (`_config.yml`, `.github/CODEOWNERS`,
  `.github/copilot-instructions.md`, `Gemfile`, `Gemfile.lock`); let the agent
  bypass the gate from a tool call.

Note: `hooks/` is published into `_site/` because `_config.yml` does not exclude
it. `_config.yml` is protected, so that is left as a follow-up.

## Success Criteria

- [ ] A fresh Claude Code session in this repo receives the meta-skill at start.
- [ ] Every user prompt receives the lifecycle reminder.
- [ ] `CLAUDE.md` states the lifecycle as mandatory at the top of the file.
- [ ] `git push` / PR creation is denied until `test` and `review` run after the last edit, with a message naming the missing skills.
- [ ] `BLOG_LIFECYCLE_GATE_BYPASS=1` in the Claude Code environment allows the push.
- [ ] `tests/lifecycle-hooks.sh` passes locally and in CI.
- [ ] `bundle exec jekyll build` and the scope guard pass.

## Resolved Questions

1. Gate scope: push and PR creation only; `git commit` is not gated (owner, 2026-10-06).
2. CI: `tests/lifecycle-hooks.sh` runs in `.github/workflows/test-build.yml` next to `tests/scope-guard.sh` (owner, 2026-10-06).
