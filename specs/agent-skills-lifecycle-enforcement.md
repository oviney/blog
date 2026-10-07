# Spec: Enforce the agent-skills lifecycle in Claude Code sessions

Status: Amendment 2 approved 2026-10-07
Issue: #1340
Owner decisions: 2026-10-02, all four layers approved; 2026-10-06, freshness
via git snapshot (Amendment 1); 2026-10-07, fix all second-review findings and
block bulk pushes (Amendment 1.1); 2026-10-07, move push enforcement to a git
pre-push hook and check bulk pushes ref by ref (Amendment 2)

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

## Amendment 1.1 (2026-10-07): second review

The second `review` confirmed R1 to R5 and R7 fixed, and returned **changes
requested** on new findings. The owner approved fixing all of them and chose to
block bulk pushes outright.

| # | Finding | Severity | Resolution |
|---|---------|----------|------------|
| R8 | Only `HEAD` was checked: `git push origin feat`, `feat:main`, `--all`, `--tags`, `gh pr create --head feat` pushed unreviewed content | Blocker | Every source ref being pushed is resolved and must match; bulk pushes are always denied |
| R9 | The gate checked the session's cwd, not the repo being pushed (`cd /other && git push`, `git -C ../wt push`) | Should-fix | Target repo taken from `-C`, `--git-dir`, or a preceding `cd` in the same command |
| R10 | Missed forms: `git --git-dir .git push`, `--work-tree X`, `sudo -u me git push`, `git \`⏎`push` | Should-fix | Parser handles them |
| R11 | Recording `test` and `review` at the same moment lost one snapshot (27/30 runs) | Should-fix | One state file per skill, written atomically (temp file + rename) |
| R12 | Temp index path was predictable in a shared `/tmp` | Nit | Private `mkdtemp` directory |
| R13 | `git push --dry-run` was denied | Nit | Allowed: nothing is sent |
| R14 | The spec claimed an exact check for MCP file writes | Nit | Reworded: for those tools it is a proxy check (Known limits) |

## Amendment 2 (2026-10-07): enforce pushes in git, not in a shell parser

The third `review` confirmed R8 to R13 fixed and again returned **changes
requested**, on everyday shell forms the command parser misread:

| # | Finding | Severity |
|---|---------|----------|
| R15 | Pushes inside `if`/`while`/`until`, or behind `timeout -k 5`, `nice -n`, `env -u`, `stdbuf`, `xargs -I` were allowed | Blocker |
| R16 | An apostrophe in a `#` comment (or `\'` outside quotes) hid the following lines | Blocker |
| R17 | With no refspec, `remote.<name>.push` or `push.default=matching` pushed unreviewed refs; "no refspec means HEAD" was wrong | Should-fix |
| R18 | `pushd`, `if cd`, `GIT_DIR=...` targets were missed | Should-fix |
| R19 | Realistic commands (`cd "$(git rev-parse --show-toplevel)"`, `$(git branch --show-current)`, `--head='feat'`) were falsely denied, with a misleading "git ENOENT" | Should-fix |
| R20 | `gh api` writes to `contents/`, `git/refs` and GraphQL commit mutations were not gated | Should-fix |

Three reviews each found new holes in the same component. Shell is too
expressive to parse with patterns, so the owner chose to stop parsing: **git
itself reports what a push sends.** Its `pre-push` hook receives one line per
ref, `<local ref> <local sha> <remote ref> <remote sha>`, after every shell
expansion, `cd`, keyword, comment, config default and environment variable has
already been applied (verified 2026-10-07 in a throwaway repo: single, `--all`
and `--tags` pushes list each ref; deletes carry an all-zero local sha; the
hook inherits `CLAUDECODE=1`; exit 1 blocks the push and leaves the remote
unchanged). R15 to R19 disappear by construction.

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
   Each skill's snapshot is its own file, `.git/lifecycle-gate-test.json` and
   `.git/lifecycle-gate-review.json` (via `git rev-parse --git-path`, so linked
   worktrees keep separate state), written atomically (R11). They are never
   committed and are shared across sessions in the clone: content reviewed in
   one session stays reviewed in the next. The built-in `/code-review` does
   not count as `review`.
5. **Freshness (Amendment 2).** Two enforcement points, neither of which
   parses shell:
   - **Pushes: `hooks/lifecycle-prepush.js` as git's `pre-push` hook.** For
     each line git passes, it resolves the local sha's tree (`<sha>^{tree}`,
     which also peels annotated tags) and requires both snapshots to equal it.
     Deletes (all-zero local sha) publish nothing and pass. Bulk pushes
     (`--all`, `--tags`, matching, configured refspecs) are checked ref by ref
     (owner decision, replacing Amendment 1.1's blanket block). On failure it
     prints the stale skills, the failing refs and the changed paths, and exits
     1. It enforces only when `CLAUDECODE=1` (set by Claude Code on every shell
     command it runs), so the owner's own pushes are never affected, and it
     honours `BLOG_LIFECYCLE_GATE_BYPASS=1`.
   - **Writes that bypass git: `hooks/lifecycle-gate.js` as `PreToolUse`.**
     The GitHub MCP file-write tools (`push_files`, `create_or_update_file`,
     `delete_file`) and `gh api` writes to `contents/`, `git/refs`,
     `git/trees`, `git/commits`, `git/blobs`, or GraphQL `createCommitOnBranch`
     / `createRef` / `updateRef` require both snapshots to equal the current
     working tree, as a proxy (Known limits). Matching is by whole-command
     substring, not segment parsing.
   **PR creation is no longer gated**: a PR can only be opened from a branch
   already on the remote, and getting it there went through `pre-push`.
   Running the skills on uncommitted work and then committing it matches
   exactly. Any change afterwards, by any tool, `Bash`, or subagent, does not
   (R1).
5a. **Installation.** `hooks/lifecycle-prepush.js --install` writes a small
   `.git/hooks/pre-push` shim (never committed) that exits 0 unless
   `CLAUDECODE=1`, then runs the checker from the installing checkout. It runs
   from `hooks/session-start.sh` and, defensively, from the `PreToolUse` gate
   whenever a `Bash` command mentions `push`. It never overwrites a `pre-push`
   hook it did not write; if one exists, or `core.hooksPath` is set, it does
   not install and the gate denies Claude's pushes with a message saying why
   (fail closed).
5b. **Evasion guards (`PreToolUse`, substring checks).** Deny a `Bash` command
   that contains `--no-verify` together with `push`, or `core.hooksPath`,
   `.git/hooks`, `send-pack` (pushes without running hooks), `CLAUDECODE`, or
   `BLOG_LIFECYCLE_GATE_BYPASS`; and deny
   `Edit`/`Write`/`NotebookEdit` on paths under `.git/hooks/`.
6. On a mismatch the deny message names the stale skill(s) and lists up to ten
   paths that differ (`git diff --name-only`), so the agent knows what changed.
7. The escape hatch is the environment variable
   `BLOG_LIFECYCLE_GATE_BYPASS=1` in the Claude Code process environment.
   The agent cannot set it from a `Bash` tool call, because hooks inherit
   Claude Code's environment, not the tool command's.
8. `hooks/hooks.json` stays for plugin installs, pointing at the same script.

## Known limits (recorded, not fixed)

- **Not a sandbox.** The gate is a guardrail for a cooperative but forgetful
  agent. A determined agent could edit the `.git/lifecycle-gate-*.json` files
  or the installed shim through some indirection the substring guards miss
  (a script file, `eval`), or push over HTTP with its own credentials. Those
  are out of scope. Since Amendment 2, the shell form of a push no longer
  matters: git reports the refs.
- **Missing Node.** Since Amendment 2, a missing `node` fails closed for
  Claude's pushes: the pre-push shim cannot run the checker, so git rejects the
  push. The `PreToolUse` hooks still exit 127, which Claude Code treats as
  non-blocking, so the out-of-git proxy checks fail open in that case. Node is
  a hard dependency of this repo (Playwright), so this is accepted.
- **Guards match text, not intent.** The evasion guards are substring checks
  over the whole command, so a commit message that mentions, say,
  `--no-verify` and `push` is blocked too. The deny message says to write such
  text to a file first (`git commit -F <file>`).
- **Merges are not gated** (R6), by design.
- **MCP file writes are a proxy check** (R14). `push_files` and
  `create_or_update_file` send content from their own arguments; the gate can
  only require that the working tree is the reviewed one, not that the
  arguments match it.
- **Only the tip is checked.** A ref's tree must match; intermediate commits on
  the pushed branch are not inspected individually.
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
| 4b | Push gate | git `pre-push` hook, `hooks/lifecycle-prepush.js` (installed into `.git/hooks/pre-push`) | For Claude sessions, rejects any push whose refs do not all match both snapshots |
| 4c | Out-of-git writes and evasion guards | `PreToolUse` hook, `hooks/lifecycle-gate.js` | Proxy check for MCP file writes and `gh api` content writes; blocks `--no-verify` pushes, hook-path tampering, and setting `CLAUDECODE` / the bypass variable |

## Commands

```bash
bash tests/lifecycle-hooks.sh                   # fixture tests for all hooks
bundle exec jekyll build                        # site still builds
bash scripts/check-pr-scope.sh                  # scope guard passes
```

## Project Structure

```
.claude/settings.json          → registers the hooks (PreToolUse also matches Edit|Write|NotebookEdit)
hooks/session-start.sh         → FIX: correct output format; installs the pre-push shim
hooks/lifecycle-reminder.sh    → NEW: UserPromptSubmit reminder
hooks/lifecycle-snapshot.js    → NEW: shared tree-snapshot + state helpers
hooks/lifecycle-record.js      → NEW: records snapshots
hooks/lifecycle-prepush.js     → NEW (A2): git pre-push checker and --install
hooks/lifecycle-gate.js        → NEW: PreToolUse proxy checks + evasion guards (A2: no shell parsing)
hooks/hooks.json               → quote ${CLAUDE_PLUGIN_ROOT} (R7)
CLAUDE.md                      → mandatory wording + top-of-file rule
tests/lifecycle-hooks.sh       → NEW: fixture tests
.github/workflows/test-build.yml → run tests/lifecycle-hooks.sh next to scope-guard.sh
```

12 files including this spec, under the 15-file scope cap.

## Code Style

Match `tests/scope-guard.sh`: header comment listing every case, `set -euo
pipefail`, temporary git repos per case, a PASS/FAIL tally. The context hooks
fail open. The gate fails closed: any internal error while handling a gated
action denies it.

## Testing Strategy

`tests/lifecycle-hooks.sh` builds throwaway git repos with real local bare
remotes and performs **real pushes** with the shim installed, asserting the
push exit code and what the remote received:

- A, B. Context hooks emit the meta-skill and the reminder.
- C. Recorder: as before (exact skill names, typed prompts, never blocks).
- D. Freshness: nothing recorded, only `test`, reviewed-then-committed,
  `sed`/new-file after review (R1), uncommitted edit after review.
- E. Refs (R8, R17): unreviewed `feat`, `feat:main`, `+feat`; `--all` and
  `--tags` with every ref reviewed (accepted) and with one unreviewed (rejected,
  names it); deletes accepted; `remote.origin.push` and `push.default=matching`
  configs pushing an unreviewed ref rejected.
- F. Shell forms (R15, R16, R18, R19) run through `bash -c`, each must be
  rejected when stale and accepted when reviewed: `if`/`while`, `timeout -k`,
  `nice -n`, `env -u`, `xargs -I`, a `# don't` comment, `pushd`, `GIT_DIR=`,
  `cd "$(git rev-parse --show-toplevel)"`, `$(git branch --show-current)`.
- G. Scope: without `CLAUDECODE=1` an unreviewed push is accepted (owner's
  own pushes); with `BLOG_LIFECYCLE_GATE_BYPASS=1` it is accepted; a linked
  worktree keeps its own snapshots.
- H. Installer: installs, is idempotent, refuses to overwrite a foreign
  `pre-push`, refuses when `core.hooksPath` is set, and the gate then denies
  pushes with the reason.
- I. `PreToolUse`: evasion guards deny (`--no-verify` push, `core.hooksPath`,
  `.git/hooks`, `CLAUDECODE`, bypass variable, `Edit` on `.git/hooks/pre-push`);
  ordinary commands, `gh pr create` and `git commit` are allowed; MCP file
  writes and `gh api` content writes (R20) use the proxy check; `gh api -X GET`
  is allowed; malformed input does not crash (R2).
- J. Concurrency and temp cleanup (R11, R12); quoted plugin path (R7).

Then a live check in a real session: a push is rejected before
`test`/`review`, and accepted after.

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
- [ ] In a Claude session, a push is rejected by git unless `test` and `review` ran on exactly the content of every ref it sends, however the command was written and whatever tool made the edits; the message names the stale skills, refs and changed paths.
- [ ] Pushes from outside Claude Code are unaffected.
- [ ] Out-of-git writes (MCP file tools, `gh api` content writes) use the working-tree proxy check; the evasion guards deny.
- [ ] Review findings R1 to R5, R7 to R13 and R15 to R20 each have a passing fixture test.
- [ ] `BLOG_LIFECYCLE_GATE_BYPASS=1` in the Claude Code environment allows the push.
- [ ] `tests/lifecycle-hooks.sh` passes locally and in CI.
- [ ] `bundle exec jekyll build` and the scope guard pass.

## Resolved Questions

1. Gate scope: push and PR creation only; `git commit` is not gated (owner, 2026-10-06).
2. CI: `tests/lifecycle-hooks.sh` runs in `.github/workflows/test-build.yml` next to `tests/scope-guard.sh` (owner, 2026-10-06).
3. Freshness: git tree snapshot, not transcript heuristics (owner, 2026-10-06).
4. Bulk pushes are always denied rather than checked ref by ref (owner, 2026-10-07).
5. Fix all second-review findings, including nits, in this PR (owner, 2026-10-07).
6. Enforce pushes with a git pre-push hook instead of parsing shell (owner, 2026-10-07).
7. Check bulk pushes ref by ref, superseding decision 4 (owner, 2026-10-07).
