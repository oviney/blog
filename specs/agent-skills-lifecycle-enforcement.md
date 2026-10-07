# Spec: Enforce the agent-skills lifecycle in Claude Code sessions

Status: Amendment 1 approved 2026-10-07
Issue: #1340
Owner decisions: 2026-10-02, all four layers approved; 2026-10-06, freshness
via git snapshot (Amendment 1)

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
mandatory rule in `CLAUDE.md`, and cannot push or open a PR unless the `test`
and `review` skills ran against exactly the content being pushed.

## Amendment 1 (2026-10-06): why the design changed

The first build passed its 32 fixture tests, but the `review` phase (an
independent reviewer that verified each finding against the running gate)
returned **changes requested**:

| # | Finding | Severity | Resolution |
|---|---------|----------|------------|
| R1 | Edits made with `sed`, heredocs, `MultiEdit` or subagents did not make `test`/`review` stale; the transcript only showed `Edit`/`Write`/`NotebookEdit` | Blocker | Freshness now compares git trees (below) |
| R2 | The gate failed open on `null` stdin (TypeError, exit 1) | Should-fix | `main` wrapped; any error on a gated action denies |
| R3 | A `Skill` call that was denied or errored still counted | Should-fix | Recording moves to `PostToolUse`, which fires only on success |
| R4 | Real pushes slipped past: `(git push)`, `env X=1 git push`, `timeout 60 git push`, `nohup git push &`, `bash -c "git push"`, `xargs git push`, `/usr/bin/git push`, `git -C "a b" push` | Should-fix | Command parser hardened |
| R5 | False positives: heredoc bodies and quoted strings containing `git push`; `gh api -X GET .../pulls -f ...` | Nit | Heredoc bodies and quoted text are ignored, except the argument of `sh -c`/`bash -c`; explicit `GET` is not a write |
| R6 | Merge operations (`gh pr merge`, MCP merge) are not gated | Nit | Intentional: admin-merging reviewed PRs is the documented workflow. Recorded below |
| R7 | `hooks/hooks.json` leaves `${CLAUDE_PLUGIN_ROOT}` unquoted | Nit | Quoted |

## Assumptions

1. Scope is Claude Code sessions (local CLI, desktop, and Claude Code on the
   web). Copilot cloud agents keep their own routing in
   `.github/copilot-instructions.md` and are out of scope.
2. Hooks are registered in a committed project `.claude/settings.json` using
   `$CLAUDE_PROJECT_DIR`, so they apply to every clone without plugin install.
3. Hook logic is written in Node (already required by the repo).
4. **Recording (Amendment 1).** When the `test` or `review` skill runs, a hook
   records a *snapshot*: the git tree of the whole working directory (tracked
   files plus untracked, non-ignored files), built in a temporary index with
   `git add -A && git write-tree`. It takes about 10 ms in this repo and never
   touches the real index. Two triggers record it:
   - `PostToolUse` on the `Skill` tool, when `skill` is exactly `test` or
     `review`. It fires only when the call succeeded, so denied or failed calls
     do not count (R3).
   - `UserPromptSubmit`, when the user's prompt starts with `/test` or
     `/review`.
   Snapshots are stored per skill in `.git/lifecycle-gate.json` (via
   `git rev-parse --git-path`), never committed and shared across sessions in
   the clone: content reviewed in one session stays reviewed in the next.
   The built-in `/code-review` does not count as `review`.
5. **Freshness (Amendment 1).** For `git push`, `gh pr create` and `gh api`
   PR writes, the gate compares the `test` and `review` snapshots with
   `HEAD^{tree}`, the content being pushed. Running the skills on uncommitted
   work and then committing it matches exactly. Any change afterwards, by any
   tool, `Bash`, or subagent, does not (R1). The MCP remote-write tools send
   content from their arguments rather than from `HEAD`, so for them the
   snapshots must match the current working-directory tree instead.
6. On a mismatch the deny message names the stale skill(s) and lists up to ten
   paths that differ (`git diff --name-only`), so the agent knows what changed.
7. The escape hatch is the environment variable
   `BLOG_LIFECYCLE_GATE_BYPASS=1` in the Claude Code process environment.
   The agent cannot set it from a `Bash` tool call, because hooks inherit
   Claude Code's environment, not the tool command's.
8. `hooks/hooks.json` stays for plugin installs, pointing at the same script.

## Known limits (recorded, not fixed)

- **Not a sandbox.** The gate is a guardrail for a cooperative but forgetful
  agent. A determined agent could edit `.git/lifecycle-gate.json`, push from
  `$(...)`/backticks/`eval`, or call git through a script. Those are out of
  scope.
- **Missing Node fails open.** If `node` is not installed, the hooks exit 127
  and Claude Code treats that as a non-blocking error. Node is a hard
  dependency of this repo (Playwright), so this is accepted rather than
  blocking every `Bash` call.
- **Merges are not gated** (R6), by design.
- **Untracked scratch files** present when `test`/`review` ran become part of
  the snapshot. If they are not committed, the push is denied and the message
  lists them; delete or commit them, then rerun the skills.

## Layers

| # | Layer | Mechanism | Effect |
|---|-------|-----------|--------|
| 1 | Session start | `SessionStart` hook, `hooks/session-start.sh` | Injects `.github/skills/using-agent-skills/SKILL.md` as context |
| 2 | Per-prompt reminder | `UserPromptSubmit` hook, `hooks/lifecycle-reminder.sh` | Injects a short lifecycle-order reminder on every prompt |
| 3 | Mandatory rule | `CLAUDE.md` | "Must" wording plus a top-of-file rule: no push or PR before `test` and `review` |
| 4a | Snapshot recorder | `PostToolUse` (`Skill`) and `UserPromptSubmit` hooks, `hooks/lifecycle-record.js` | Records the working-directory tree when `test` or `review` runs |
| 4b | Push gate | `PreToolUse` hook, `hooks/lifecycle-gate.js` | Denies `git push`, `gh pr create`, `gh api` writes to `.../pulls`, and the GitHub MCP remote-write tools (`create_pull_request`, `push_files`, `create_or_update_file`, `delete_file`) unless both snapshots match the content being pushed |

## Commands

```bash
bash tests/lifecycle-hooks.sh                   # fixture tests for all hooks
bundle exec jekyll build                        # site still builds
bash scripts/check-pr-scope.sh                  # scope guard passes
```

## Project Structure

```
.claude/settings.json          → registers the hooks (adds PostToolUse + recorder)
hooks/session-start.sh         → FIX: correct output format
hooks/lifecycle-reminder.sh    → NEW: UserPromptSubmit reminder
hooks/lifecycle-snapshot.js    → NEW (A1): shared tree-snapshot + state helpers
hooks/lifecycle-record.js      → NEW (A1): records snapshots
hooks/lifecycle-gate.js        → NEW: PreToolUse push/PR gate (A1: compares trees)
hooks/hooks.json               → quote ${CLAUDE_PLUGIN_ROOT} (R7)
CLAUDE.md                      → mandatory wording + top-of-file rule
tests/lifecycle-hooks.sh       → NEW: fixture tests
.github/workflows/test-build.yml → run tests/lifecycle-hooks.sh next to scope-guard.sh
```

10 files, under the 15-file scope cap.

## Code Style

Match `tests/scope-guard.sh`: header comment listing every case, `set -euo
pipefail`, temporary git repos per case, a PASS/FAIL tally. The context hooks
fail open. The gate fails closed: any internal error while handling a gated
action denies it.

## Testing Strategy

`tests/lifecycle-hooks.sh` builds a temporary git repo per case, drives the
recorder and the gate with the JSON Claude Code sends, and asserts:

- A. SessionStart emits `hookSpecificOutput.additionalContext` with the meta-skill.
- B. UserPromptSubmit reminder is emitted.
- C. Recorder: successful `Skill` `test`/`review` writes a snapshot; `code-review`,
  `blog:test` and other skills do not; typed `/test` and `/review` prompts do;
  `/code-review` does not.
- D. Gate: no snapshots → deny, names `test` and `review`.
- E. Gate: only `test` recorded → deny, names `review` only.
- F. Gate: both recorded, then commit → allow (uncommitted work reviewed, then committed).
- G. Gate: both recorded, then a file changed by plain shell (`sed`/`echo >`) and
  committed → deny, lists the changed path (R1).
- H. Gate: both recorded, then a new untracked file committed → deny.
- I. Gate: every push form in R4 → deny when stale.
- J. Gate: `gh pr create`, `gh api` POST pulls, MCP write tools → deny when stale;
  MCP tools allow when the working tree matches.
- K. Gate: false-positive forms in R5 and read-only commands → allow.
- L. Gate: bypass env → allow; bypass inside the command string → deny.
- M. Gate: `null`, non-object, or malformed stdin on a gated tool → deny (R2);
  malformed stdin with no visible gated action → allow.
- N. Gate: not a git repo / no `HEAD` → deny (fail closed).

Then a live check in a real session: the gate denies a push before
`test`/`review`, and allows it after.

## Boundaries

- Always: keep hooks fast (< 1 s), dependency-free beyond Node, bash and git.
- Ask first: extending the gate to `git commit` or merges.
- Never: modify protected files (`_config.yml`, `.github/CODEOWNERS`,
  `.github/copilot-instructions.md`, `Gemfile`, `Gemfile.lock`); let the agent
  bypass the gate from a tool call; touch the real git index.

Note: `hooks/` is published into `_site/` because `_config.yml` does not exclude
it. `_config.yml` is protected, so that is left as an owner follow-up.

## Success Criteria

- [ ] A fresh Claude Code session in this repo receives the meta-skill at start.
- [ ] Every user prompt receives the lifecycle reminder.
- [ ] `CLAUDE.md` states the lifecycle as mandatory at the top of the file.
- [ ] Push / PR creation is denied unless `test` and `review` ran on exactly the content being pushed, whatever tool made the edits; the message names the stale skills and the changed paths.
- [ ] Review findings R1 to R5 and R7 each have a passing fixture test.
- [ ] `BLOG_LIFECYCLE_GATE_BYPASS=1` in the Claude Code environment allows the push.
- [ ] `tests/lifecycle-hooks.sh` passes locally and in CI.
- [ ] `bundle exec jekyll build` and the scope guard pass.

## Resolved Questions

1. Gate scope: push and PR creation only; `git commit` is not gated (owner, 2026-10-06).
2. CI: `tests/lifecycle-hooks.sh` runs in `.github/workflows/test-build.yml` next to `tests/scope-guard.sh` (owner, 2026-10-06).
3. Freshness: git tree snapshot, not transcript heuristics (owner, 2026-10-06).
