# Spec: Enforce the agent-skills lifecycle in Claude Code sessions

Status: Amendment 2.2 approved 2026-10-07
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

## Amendment 2.1 (2026-10-07): fourth review

The fourth `review` re-verified R1 to R5, R7 to R12 and R15 to R20 with real
pushes and found no blockers; the pre-push design held. It returned **changes
requested** on installation plumbing. The owner approved fixing all findings.

| # | Finding | Severity | Resolution |
|---|---------|----------|------------|
| R21 | The gate installed the blog's shim into unrelated repos the session pushed from, blocking Claude there permanently | Should-fix | Install only into this project's repo (same git common dir as `$CLAUDE_PROJECT_DIR`) or a clone of the blog (contains `hooks/lifecycle-prepush.js`) |
| R22 | A blog clone the session never ran a command in has no shim | Should-fix | Covered once any command runs there (R21 rule); otherwise a Known limit |
| R23 | The shim ran the checker from the checked-out branch, and checked that file before the owner bypass: a branch without it blocked every Claude push with no bypass | Should-fix | The shim tests the bypass first; install copies the checker and snapshot helper into `<git common dir>/lifecycle-gate/`, so the check no longer depends on the branch |
| R24 | A shim without its executable bit counted as installed; git then skipped it | Should-fix | Install always restores mode 755 and treats a non-executable shim as not installed |
| R25 | `git push --dry-run` with stale snapshots is rejected (git runs pre-push for dry runs), contradicting R13 | Nit | Accepted and documented: nothing is sent either way |
| R26 | Only the exact `mcp__github__*` names were checked; a differently named GitHub MCP server was not | Nit | Tool names matched by pattern `mcp__<anything with github>__{push_files, create_or_update_file, delete_file}`, in the gate and the settings matcher |
| R27 | Pushing a commit already on the remote (e.g. `main:new-branch` with `main` = `origin/main`) was rejected | Nit | A ref whose commit is already reachable from the remote's tracking refs publishes nothing new and passes |
| R28 | Setting `core.hooksPath` later is only noticed when a command mentions `push` | Nit | Documented in 5a |
| R29 | The per-prompt reminder still said PR creation is blocked and "after your last edit" | Nit | Reworded to the exact-content rule |
| R30 | Fixture A installed a shim into the real checkout | Nit | Fixture A uses a temporary repo |
| R31 | Recording takes about 60 ms on this repo, not 10 ms | Nit | Corrected |

A linked worktree does not accept a review recorded in the main checkout; this
stays a Known limit, because sharing snapshots between worktrees would let one
worktree's review count for another's different work.

## Amendment 2.2 (2026-10-07): fifth review

The fifth `review` re-verified the pre-push design and R21 to R31 by experiment,
and found two should-fixes, both introduced by Amendment 2.1. The owner approved
fixing all findings.

| # | Finding | Severity | Resolution |
|---|---------|----------|------------|
| R32 | The R27 skip trusted any local tracking ref: an unreviewed branch fetched from someone else could be pushed onto `main`, and a stale tracking ref let a deleted remote branch be recreated | Should-fix | Skip only when git's own `<remote sha>` for that ref already contains the commit (a no-op or rewind, checked live by git), or the commit is in the remote's default branch (`refs/remotes/<remote>/HEAD`, else `.../main`), which is PR-reviewed. R27's `main:new-branch` case still passes |
| R33 | The checker copy was refreshed from the working tree on every push command, so editing the tracked hooks weakened the installed check (undoing R23), and worktrees on different versions overwrote each other's copy | Should-fix | Install copies the checker from the committed default branch (`origin/HEAD`, else `origin/main`). Only when that branch does not have the hooks yet (true until this PR merges) does it fall back to the working tree, and it says so |
| R34 | The path guard needed a trailing slash: `rm -rf .git/lifecycle-gate` was allowed | Nit | Guard matches the directory name followed by `/`, whitespace, a quote or the end |
| R35 | No uninstall path: on a branch from before this PR (no recorder), every Claude push is rejected with advice that cannot help | Nit | `lifecycle-prepush.js --uninstall` removes the shim and the copy; the reject message tells the owner about it and the bypass |
| R36 | Pushing by URL instead of a remote name disables the R27/R32 skip | Nit | Documented: it fails safe (the push is checked) |

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
   `git add -A && git write-tree`. It takes about 60 ms in this repo and never
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
     Deletes (all-zero local sha) publish nothing and pass. So do commits git
     reports the remote ref already contains (a no-op or rewind), and commits
     in the remote's default branch (`refs/remotes/<remote>/HEAD`, else
     `.../main`), which is PR-reviewed (R27, narrowed by R32). Bulk pushes
     (`--all`, `--tags`, matching, configured refspecs) are checked ref by ref
     (owner decision, replacing Amendment 1.1's blanket block). On failure it
     prints the stale skills, the failing refs and the changed paths, and exits
     1. It enforces only when `CLAUDECODE=1` (set by Claude Code on every shell
     command it runs), so the owner's own pushes are never affected, and it
     honours `BLOG_LIFECYCLE_GATE_BYPASS=1`.
   - **Writes that bypass git: `hooks/lifecycle-gate.js` as `PreToolUse`.**
     The GitHub MCP file-write tools (`push_files`, `create_or_update_file`,
     `delete_file`, from any MCP server whose name contains `github`, R26) and
     `gh api` writes to `contents/`, `git/refs`,
     `git/trees`, `git/commits`, `git/blobs`, or GraphQL `createCommitOnBranch`
     / `createRef` / `updateRef` require both snapshots to equal the current
     working tree, as a proxy (Known limits). Matching is by whole-command
     substring, not segment parsing.
   **PR creation is no longer gated**: a PR can only be opened from a branch
   already on the remote, and getting it there went through `pre-push`.
   Running the skills on uncommitted work and then committing it matches
   exactly. Any change afterwards, by any tool, `Bash`, or subagent, does not
   (R1).
5a. **Installation (Amendments 2.1 and 2.2).** `hooks/lifecycle-prepush.js --install`
   copies the checker and `lifecycle-snapshot.js` **from the committed default
   branch** (`origin/HEAD`, else `origin/main`) into
   `<git common dir>/lifecycle-gate/`, so unmerged edits to the hooks cannot
   weaken the installed check (R33); only while that branch lacks the hooks
   (until this PR merges) does it copy from the working tree, and it says so. It
   also writes a `.git/hooks/pre-push` shim
   (none of it committed). The shim exits 0 unless `CLAUDECODE=1`, then exits 0
   if `BLOG_LIFECYCLE_GATE_BYPASS=1`, then runs the copied checker, so the check
   does not depend on which branch is checked out (R23). Install always sets
   mode 755; a non-executable shim counts as not installed (R24). It runs from
   `hooks/session-start.sh` and, defensively, from the `PreToolUse` gate when a
   `Bash` command mentions `push`, but only for this project's repo (same git
   common dir as `$CLAUDE_PROJECT_DIR`) or a blog clone (its top level contains
   `hooks/lifecycle-prepush.js`); unrelated repos are never touched (R21). It
   never overwrites a `pre-push` hook it did not write; if one exists, or
   `core.hooksPath` is set, it does not install and the gate denies Claude's
   pushes with a message saying why (fail closed). A `core.hooksPath` set
   *after* installation is only noticed when a command mentions `push` (R28).
5b. **Evasion guards (`PreToolUse`, substring checks).** Deny a `Bash` command
   that contains `--no-verify` together with `push`, or `core.hooksPath`,
   `.git/hooks`, `.git/lifecycle-gate`, `send-pack` (pushes without running
   hooks), `CLAUDECODE`, or `BLOG_LIFECYCLE_GATE_BYPASS`; and deny
   `Edit`/`Write`/`NotebookEdit` on paths under `.git/hooks/` or
   `.git/lifecycle-gate/`.
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
- **Other blog clones** (R22). A clone or worktree checkout the session has not
  yet run any command in has no shim, so a `cd /other-clone && git push` from
  elsewhere is not checked until a command runs there.
- **Worktrees review separately.** A linked worktree does not accept a review
  recorded in the main checkout, even for identical content; run the skills in
  the worktree.
- **Dry runs are checked** (R25). git runs pre-push for `git push --dry-run`, so
  a dry run with stale snapshots is rejected. Nothing is sent either way.
- **Pushing by URL** (R36) instead of a remote name means there are no
  tracking refs to consult, so the already-published skip never applies and
  the push is checked in full. This fails safe.
- **Editing the hook code.** Claude Code runs the `PreToolUse` hooks from the
  working tree, so an agent editing `hooks/lifecycle-gate.js` changes them for
  its own session. The pre-push check is protected once this PR is merged (the
  copy comes from the default branch, R33); until then it falls back to the
  working tree.
- **Branches from before this PR** have no recorder, so with the shim
  installed every Claude push is rejected. The owner can run
  `node .git/lifecycle-gate/lifecycle-prepush.js --uninstall` (R35) or use the
  bypass.

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
- K. Amendment 2.1: the gate does not install into an unrelated repo and does
  for a blog repo (R21); with the checker copy missing, the bypass still lets
  the push through and without it the push is rejected (R23); the shim points
  at the copy in the git common dir, not the checkout (R23); a non-executable
  shim is restored by install (R24); a stale dry run is rejected (R25);
  differently named GitHub MCP write tools are checked (R26); pushing an
  already-published commit to a new branch is accepted (R27); the reminder
  wording (R29); fixture A uses a temporary repo (R30).
- L. Amendment 2.2: an unreviewed branch fetched from another clone pushed
  onto `main` is rejected, and a stale tracking ref cannot recreate a deleted
  remote branch (R32); a no-op push of an unchanged ref passes; with the hooks
  on the remote's default branch, a weakened working-tree checker is not what
  gets installed (R33) and the fallback says so; `rm -rf .git/lifecycle-gate`
  is denied while reading the snapshot JSON files is not (R34); `--uninstall`
  removes the shim and the copy, and leaves a foreign hook alone (R35).

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
- [ ] Review findings R1 to R5, R7 to R12, R15 to R21, R23 to R30 and R32 to R35 each have a passing fixture test (R13 is superseded by R25; R22, R28 and R36 are documented limits).
- [ ] Installation never touches unrelated repos, does not depend on the checked-out branch, and the owner bypass works even when the checker is missing.
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
8. Fix all fourth-review findings (R21-R31) in this PR; keep worktree review separation and other-clone coverage as Known limits (owner, 2026-10-07).
9. Fix all fifth-review findings (R32-R36) in this PR (owner, 2026-10-07).
