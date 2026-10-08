# Spec: Enforce the agent-skills lifecycle in Claude Code sessions

Status: Amendment 2.4 (#1350 follow-ups) 2026-10-08; Amendment 2.3 approved 2026-10-07
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

## Amendment 2.3 (2026-10-07): sixth review — remove, don't harden

The sixth `review` again found holes in conveniences added on top of the core
design (git reports the pushed refs; both snapshots must match), not in the
core, which has held for three rounds. The owner chose to **remove** the
convenience rather than harden it.

| # | Finding | Severity | Resolution |
|---|---------|----------|------------|
| R37 | `--uninstall` let an agent remove the check and push unreviewed work in one command, and the reject message suggested it | Blocker | `--uninstall` refuses (exit 2) when `CLAUDECODE=1` unless the owner bypass is set; the gate also denies commands that run it; the reject message tells the owner to run it from their own terminal |
| R38 | The default-branch skip and the install source trusted local tracking refs, which `git remote set-head`, `git fetch . X:refs/remotes/origin/main` or `git update-ref` rewrite | Should-fix | **The default-branch skip is removed.** The only skip left is git's live `<remote sha>` for the same ref already containing the commit (a no-op or rewind), which cannot be faked locally. Install reads only `refs/remotes/origin/main`, never `origin/HEAD`. The gate guards `set-head`, `update-ref`, and fetches into `refs/remotes/` |
| R39 | A default-branch checker that fails to load installed "successfully", then every push failed with a raw Node stack | Nit | After copying, install loads the copy; if it fails, install falls back to the working tree and says why |
| R40 | A default branch with only some of the hooks silently fell back to the working tree | Nit | Fall back only when the default branch has none of the copied files; if it has some, install refuses |
| R41 | The `.git/lifecycle-gate` guard missed `lifecycle-gate*`, `.//lifecycle-gate`, and `cd .git && rm -rf lifecycle-gate` | Nit | The guard matches `lifecycle-gate` anywhere in a command except the snapshot files `lifecycle-gate-test.json` / `lifecycle-gate-review.json` and paths under `hooks/` |

Consequence of removing the skip: pushing an unchanged, already-reviewed
`main` to a new branch (`git push origin main:new-branch`) now needs
`test`/`review` like any other push. Agents push branches that contain their
own changes, so this is rare.

### Amendment 2.4 (#1350): nits from the seventh review

The seventh review approved Amendment 2.3 with seven nits, tracked in #1350.

| # | Finding | Severity | Resolution |
|---|---------|----------|------------|
| R42 | "Local refs before the first install" understated the limit: every push reinstalls the checker copy from `refs/remotes/origin/main`, so rewriting that ref matters at any time. The fetch guard missed the short form `:remotes/` | Nit | Limit reworded (Known limits); the fetch guard matches `:(refs/)?remotes/` |
| R43 | The fetch guard blocked legitimate fetches from `origin` into tracking refs and widening `remote.origin.fetch` | Nit | The guard fires only when the fetch source is `.`, a path (`/`, `./`, `../`, `~`) or a `file://` URL |
| R44 | `git remote set-head` was guarded although nothing reads `origin/HEAD` any more | Nit | Guard removed |
| R45 | The uninstall refusal only mentioned the owner's terminal, which Claude Code on the web does not have | Nit | It also names launching Claude Code with `BLOG_LIFECYCLE_GATE_BYPASS=1` |
| R46 | The list of files to copy came from the running checker while the files came from `origin/main`, so a later helper would break installs from older branches | Nit | The list is read from the `COPIED` line of `origin/main`'s checker. The line must exist, list `lifecycle-prepush.js`, and name only bare `.js` files in `hooks/`, otherwise install refuses. Copies of files no longer listed are removed, so a missing entry fails the same way on every machine |
| R47 | Header comments and Assumption 5b did not describe R37, R38 and R41 | Nit | Updated |
| R48 | No fixture pinned the remaining skip | Nit | Fixtures: a force-push rewind to an ancestor of the remote ref passes with stale snapshots; a push of a commit the remote lacks is checked |

Review of Amendment 2.4 (changes requested):

| # | Finding | Severity | Resolution |
|---|---------|----------|------------|
| R49 | Allowing fetches from `origin` (R43) let `git fetch origin +<pre-hooks commit>:refs/remotes/origin/main` make install fall back to the editable working tree | Should-fix | The fallback for "`origin/main` has none of the hooks" is removed: install refuses and says to run `git fetch origin`. This closes the downgrade for every ref writer, not only fetch |
| R50 | Known limits recorded one bypass of the narrowed fetch guard and presented the guard as covering the ordinary commands | Should-fix | Known limits list the unguarded ref writers and state that R49 is what bounds them |
| R51 | Nits: stale helper copies were never pruned; a missing `COPIED` line silently used the running list; the refusal for a list without the checker was misleading; the gate's uninstall denial lacked the launch-time bypass; a traversal fixture asserted the wrong path; the guard fired for any `remotes/` destination | Nit | Unlisted `.js` copies are removed; a missing line and a list without `lifecycle-prepush.js` each refuse with their own message; the gate's denial names the bypass; the fixture checks the repo root; the guard is limited to `remotes/origin/` |

Second review of Amendment 2.4 (changes requested):

| # | Finding | Severity | Resolution |
|---|---------|----------|------------|
| R52 | Older checkers stay reachable on `origin` (the #1340 branch, `refs/pull/1349/head`); a fetch the gate allows could point `origin/main` at one that trusts local tracking refs, and an unreviewed push then passed | Should-fix | Anti-rollback floor: install refuses a checker on `origin/main` that lacks the exact line `const SOURCE_REF = 'refs/remotes/origin/main';`, which every checker from R38 on carries and the older ones do not |
| R53 | With no `origin/main` (a single-branch clone), the `git fetch origin` hint did not help, and the refused install left no shim, so git itself enforced nothing | Should-fix | The hint is `git fetch origin main:refs/remotes/origin/main`; every source refusal still writes the shim, which keeps an earlier copy in use or, without one, blocks Claude's pushes through its missing-copy branch |
| R54 | Pruning (R51) followed a symlinked copy dir and deleted `.js` files outside it | Nit | Install refuses when the copy dir is not a plain directory |

The third review approved, with nits:

| # | Finding | Severity | Resolution |
|---|---------|----------|------------|
| R55 | SessionStart repeated "pushes will be blocked"; the refusal said pushes "stay blocked" even when an earlier copy keeps enforcing; the gate called the check "not active"; the Known limit overstated what the text-marker floor proves; the floor line could be reformatted by accident | Nit | The refusal names the git-layer state (earlier copy in use, or shim rejecting); SessionStart says the gate denies push commands; the gate says the check "could not be installed"; the limit names unmerged branches carrying the floor line; a comment guards the line. A shim for a symlinked copy dir is declined: it would run whatever the symlink points at |

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
     Deletes (all-zero local sha) publish nothing and pass. So do commits
     git's live `<remote sha>` for the same ref already contains (a no-op or
     rewind); git fetches that sha from the remote during the push, so it
     cannot be faked locally (R27, narrowed by R32 and R38). Bulk pushes
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
5a. **Installation (Amendments 2.1 to 2.4).** `hooks/lifecycle-prepush.js --install`
   copies the checker and `lifecycle-snapshot.js` **from the committed
   `refs/remotes/origin/main`** (never `origin/HEAD`, R38) into
   `<git common dir>/lifecycle-gate/`, so unmerged edits to the hooks cannot
   weaken the installed check (R33). If `origin/main` does not carry the
   checker, install refuses and says to run
   `git fetch origin main:refs/remotes/origin/main` (R49, R53; the
   working-tree fallback served only until #1340 merged). It also refuses a
   checker older than the R38 floor, recognised by the exact line
   `const SOURCE_REF = 'refs/remotes/origin/main';` (R52). These refusals
   still write the shim, so git keeps blocking Claude's pushes, through an
   earlier copy or the shim's missing-copy branch (R53). A copy dir that is
   not a plain directory is refused (R54). It falls back to
   the working tree, and says so, only when the copy from `origin/main` fails
   to load (R39); if `origin/main` has only some of the listed files, it
   refuses (R40). The list of files comes from the `COPIED` line of
   `origin/main`'s checker, so a later helper still installs from an older
   branch; a missing line, a list without `lifecycle-prepush.js`, or one
   naming anything but bare `.js` files in `hooks/` makes install refuse
   (R46). Copies of files no longer listed are removed.
   `--uninstall` removes the shim and the copy, but refuses inside a Claude
   Code session unless the owner bypass is set (R37). It
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
   `.git/hooks`, `lifecycle-gate` anywhere except the snapshot files and
   `hooks/lifecycle-gate.js` (R34, R41), the checker's `--uninstall` (R37),
   `update-ref`, a fetch from `.`, a path or `file://` into
   `(refs/)remotes/origin/` (R38, R42, R43, R51), `send-pack` (pushes without running
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
  its own session. The pre-push check is protected: the copy comes from
  `origin/main` (R33), and without the hooks there install refuses (R49).
- **Branches from before this PR** have no recorder, so with the shim
  installed every Claude push is rejected. The owner can run
  `node .git/lifecycle-gate/lifecycle-prepush.js --uninstall` from their own
  terminal (R35; refused inside Claude Code, R37) or use the bypass.
- **The local `origin/main` ref chooses the checker** (R42). Every command
  that mentions `push` reinstalls the checker copy from
  `refs/remotes/origin/main`, so an agent that deliberately points that ref at
  other content changes the installed checker from then on, not only before
  the first install. That is deliberate tampering, covered by "Not a
  sandbox". The gate guards two ordinary commands for it: `update-ref`, and
  fetches from `.`, a path or `file://` into `(refs/)remotes/origin/`.
  Substring matching cannot cover every ref writer, so these are not
  guarded: `git pull` or `git push --force` to `.`, `git symbolic-ref`,
  changing the remote URL (`remote set-url`, `-c remote.<x>.url`), a second
  remote pointing at a local path, fetch options that take a separate
  argument before the source (`--depth 1 .`), sources such as `.git` or
  `$PWD`, Windows paths, and a quoted destination. Fetches from `origin` into
  its tracking refs are allowed on purpose (R43), so an agent can also point
  `origin/main` at any older commit or branch on `origin`. What bounds all of
  these: install never falls back to the working tree when `origin/main`
  lacks the checker (R49), and refuses checkers older than the R38 floor,
  which trusted local tracking refs (R52). The floor is a text marker, so
  moving the ref can still select any committed checker that carries the R38
  floor line, including one on an unmerged branch on `origin` (a Copilot
  cloud-agent branch, which pre-push never covers, or a branch pushed after
  `test` and `review`), or such a checker that fails to load, which reaches
  the R39 working-tree fallback. Each needs a weakened checker authored on
  purpose, which "Not a sandbox" covers. A later change that weakens the
  checker on purpose should raise the floor marker in the same PR. When the
  copy dir is not a plain directory (R54), install writes no shim, because
  the shim would run whatever the symlink points at; the gate still denies
  push commands.
- **Republishing reviewed commits.** With the default-branch skip removed
  (R38), pushing an unchanged, already-merged commit to a new branch needs
  `test` and `review` first, like any push.

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
- M. Amendment 2.3: under `CLAUDECODE=1`, `--uninstall` is refused and the
  shim stays, and the gate denies a command running it (R37); after
  `git remote set-head origin <unreviewed>` or rewriting
  `refs/remotes/origin/main` to an unreviewed commit, pushing that commit onto
  `main` is rejected (R38) and `update-ref` is denied by the gate
  (`set-head` is allowed since R44, as nothing reads `origin/HEAD`);
  `main:new-branch` with a stale snapshot is rejected while a true no-op push
  passes; a checker on `origin/main` that fails to load triggers the announced
  fallback (R39); `origin/main` with only one of the two files makes install
  refuse (R40); `rm -rf .git/lifecycle-gate*` and `cd .git && rm -rf
  lifecycle-gate` are denied, reading the snapshot JSON is not (R41).
- N. Amendment 2.4: fetches from `.`, `./`, `../`, an absolute or home path,
  or `file://` into `remotes/` or `refs/remotes/` are denied (R42); fetches
  from `origin` into tracking refs, `remote.origin.fetch` config and
  `git remote set-head` are allowed (R43, R44); the uninstall refusal names
  the launch-time bypass (R45); a helper listed on `origin/main` but absent
  from the running checker's list is copied and the checker loads, a listed
  helper missing on `origin/main` or a list naming `../../evil.js` makes
  install refuse (R46); a force-push rewind to an ancestor of the remote ref
  passes with stale snapshots, while a push of a commit the remote lacks is
  checked (R48). Review round: with `origin/main` lacking the hooks, install
  refuses with a `git fetch origin` hint and writes no copy, including after
  `git fetch origin +<pre-hooks commit>:refs/remotes/origin/main` with a
  weakened working tree (R49); a checker without a `COPIED` line refuses, a
  helper dropped from the list is pruned, the gate's uninstall denial names
  the bypass, and a mirror fetched into `refs/remotes/mirror/` is allowed
  (R51). Fixture repos commit the hooks, as the blog does since #1340.
  Second review round: a checker on `origin/main` without the floor line is
  refused and the current copy stays (R52); a refused install gives the
  single-branch-safe fetch, writes the shim, and a Claude push is rejected
  by git (R53); a symlinked copy dir is refused and nothing outside it is
  deleted (R54).

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
- [ ] Review findings R1 to R5, R7 to R12, R15 to R21, R23 to R26, R28 to R30, R32 to R35, R37 to R46, R48, R49 and R51 to R55 each have a passing fixture test (R13 is superseded by R25; R27's default-branch case is removed by R38; R22, R28 and R36 are documented limits).
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
10. Remove the default-branch skip rather than harden it; fix R37-R41 (owner, 2026-10-07).
11. Ship Amendment 2.3 and track the seventh review's nits in #1350 (owner, 2026-10-07); work them as Amendment 2.4 (owner, 2026-10-08).
