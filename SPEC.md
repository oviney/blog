# SPEC — Scope-guard label exemption for legitimate AGENTS.md / ARCHITECTURE.md changes (#985)

**Status:** Draft — awaiting approval
**Issue:** [#985](https://github.com/oviney/blog/issues/985)
**Labels:** `agent:qa-gatekeeper`, `governance-update`
**Date:** 2026-05-24
**Lifecycle phase:** DEFINE
**Spawned from:** PR [#984](https://github.com/oviney/blog/pull/984) (closed #946) admin-merge follow-up — `check-agent-scope` red against a legitimate issue-driven `AGENTS.md` change.

---

## 1. Situation

`scripts/check-pr-scope.sh` Rule 1 (lines 75–80) loops over `PROTECTED_FILES` (lines 43–51) — `_config.yml`, `Gemfile`, `Gemfile.lock`, `.github/CODEOWNERS`, `.github/copilot-instructions.md`, `AGENTS.md`, `ARCHITECTURE.md` — and emits a `VIOLATION [protected-file]` for any one of them appearing in the diff. **Rule 1 has no `PR_LABELS` bypass**, unlike:
- **Rule 2** (>15 files / scope-explosion) which respects the `bulk-content` label (lines 86–94)
- **Rule 3** (`.github/skills/` or `.github/instructions/`) which respects the `governance-update` label (lines 100–109)

This means every PR that legitimately modifies `AGENTS.md` (a `governance-update`-relevant doc, but explicitly listed under Rule 1 not Rule 3) trips the guard. Most recent precedent: PR #984 / issue #946 (handoff-graph PR), admin-merged through the false-positive failure on 2026-05-24T22:33:33Z.

The protection itself is correct — accidental side-effect modifications to `AGENTS.md` *should* trip the guard. What's missing is a deliberate-intent escape hatch for the rare issue-driven case.

`bulk-content` and `governance-update` are precedent: they signal deliberate intent and bypass a specific rule. The same pattern applies here.

CI surface: the guard runs as the `check-agent-scope` job in `.github/workflows/test-build.yml:95-107`. No test currently exists for `scripts/check-pr-scope.sh`.

---

## 2. Objective

Add a label-based exemption to `scripts/check-pr-scope.sh` Rule 1 that lets a PR modifying `AGENTS.md` or `ARCHITECTURE.md` pass the guard when (and only when) the PR carries a new `protected-file-update` label. Other protected files (`_config.yml`, `Gemfile`, `Gemfile.lock`, `.github/CODEOWNERS`, `.github/copilot-instructions.md`) **remain unbypassable** — they're load-bearing infra, not docs. Cover the change with a small fixture-based test (`tests/scope-guard.sh`) wired into the `test-build.yml` workflow.

---

## 3. Design Decisions (confirmed 2026-05-24)

| Decision | Choice | Rationale |
|---|---|---|
| Label name | **`protected-file-update`** | Parallels `bulk-content` and `governance-update`; intent is explicit ("this PR intentionally modifies a protected file"). |
| Bypass scope | **Per-file allow-list** (`AGENTS.md`, `ARCHITECTURE.md` only) | Issue-driven docs work needs an escape hatch; infra files (`_config.yml`, `Gemfile*`, `.github/CODEOWNERS`, `.github/copilot-instructions.md`) should always require a dedicated audit trail beyond a single label. Per-file design preserves that distinction. |
| Bypass mechanism | **Two-tier check inside Rule 1**: per-file flag + label check, NOT an early-return at the top of Rule 1 | An all-or-nothing rule bypass (matching `governance-update`'s Rule 3 pattern) would expose infra files to the same label — undesirable. Two-tier keeps infra files always-protected. |
| Bypass log line | `check-pr-scope: protected-file-update label present — bypassing protection for 'AGENTS.md'.` (one per bypassed file) | Mirrors existing skip-message style; explicit per-file logging makes the audit trail obvious in CI logs. |
| Test strategy | **New `tests/scope-guard.sh` with 3 fixture cases** (temp-git-repo approach) | No production-script changes for testability; black-box test against the real script via env vars. Wired into `test-build.yml` as a new step. |
| Test fixture mechanism | **Per-case temp git repo** (`mktemp -d` + `git init` + commit baseline + branch + modify) | Self-contained, no fixture files in the main repo, hermetic. ~30 lines of helper code. |
| Documentation | **Update `scripts/check-pr-scope.sh` header docblock** (lines 21–29 already document `bulk-content` + `governance-update`) AND add a `protected-file-update` row to the label table in `CLAUDE.md` (alongside `bulk-content` and `governance-update`) | One source of truth (the script header) + one human-readable index (`CLAUDE.md`). No new doc file. |

---

## 4. Acceptance Criteria

- [ ] **AC-1** `scripts/check-pr-scope.sh` Rule 1 (protected-file loop) gains a per-file label bypass for `AGENTS.md` and `ARCHITECTURE.md` only.
- [ ] **AC-2** Bypass triggers only when `PR_LABELS` contains `protected-file-update`. Without the label, the guard still flags `AGENTS.md` / `ARCHITECTURE.md` modifications as `VIOLATION [protected-file]`.
- [ ] **AC-3** Bypass does NOT apply to `_config.yml`, `Gemfile`, `Gemfile.lock`, `.github/CODEOWNERS`, or `.github/copilot-instructions.md` — those still trip the guard even with the label.
- [ ] **AC-4** New `tests/scope-guard.sh` test with three fixture cases:
  - **Case A:** `AGENTS.md` modified, no `PR_LABELS` → guard fails (exit 1), output contains `VIOLATION [protected-file]: 'AGENTS.md'`.
  - **Case B:** `AGENTS.md` modified, `PR_LABELS="protected-file-update"` → guard passes (exit 0), output contains `bypassing protection for 'AGENTS.md'`.
  - **Case C:** `Gemfile` modified, `PR_LABELS="protected-file-update"` → guard fails (exit 1), output contains `VIOLATION [protected-file]: 'Gemfile'`.
- [ ] **AC-5** `tests/scope-guard.sh` is invoked from `.github/workflows/test-build.yml` (new step or new job under the existing `check-agent-scope` workflow), exits 0 when all three cases pass.
- [ ] **AC-6** `scripts/check-pr-scope.sh` header docblock (lines 21–29) is updated to document the new label alongside `bulk-content` and `governance-update`, including PASS/FAIL examples.
- [ ] **AC-7** `CLAUDE.md` "Local Agent Labels" table (or wherever scope-guard labels are documented today) gains a row for `protected-file-update`.
- [ ] **AC-8** Running the script locally with the live PR #984 diff state (replay) returns exit 0 when `PR_LABELS=protected-file-update` is set, and exit 1 when unset — manual replay check.
- [ ] **AC-9** `bundle exec jekyll build` exits 0 (the change touches only `scripts/`, `tests/`, `.github/workflows/`, `CLAUDE.md`, and `scripts/check-pr-scope.sh` docblock; no Jekyll content surface).
- [ ] **AC-10** *(amended 2026-05-24 during BUILD — original ≤ 7 omitted the archived prior-PR lifecycle carry-over)* Scope-guard boundary on this PR: `git diff --name-only main...HEAD` returns exactly — `scripts/check-pr-scope.sh`, `tests/scope-guard.sh` (new), `.github/workflows/test-build.yml`, `CLAUDE.md`, plus the lifecycle artifacts (`SPEC.md`, `tasks/plan.md`, `tasks/todo.md`), plus the carry-over archived #946 lifecycle artifacts (`tasks/archive/2026-05-24-handoff-graph-946/{plan,todo}.md`). Total **≤ 9 files** — the +2 vs. the original is the always-present prior-PR archive overhead now formalised so future SPECs can account for it from the start.

---

## 5. Commands

```bash
# Local development loop
bundle exec jekyll build                          # AC-9
bash scripts/check-pr-scope.sh                    # baseline (expected: pass — no protected file in our diff today)
bash tests/scope-guard.sh                         # AC-4 — runs all three fixture cases

# Manual replay against #984's diff shape (AC-8)
git checkout 4e22be8e^                            # parent of #984's merge commit
bash scripts/check-pr-scope.sh                    # expected: FAIL on AGENTS.md (no label)
PR_LABELS="protected-file-update" bash scripts/check-pr-scope.sh   # expected: PASS

# CI verification
gh pr checks <new PR>                              # check-agent-scope expected pass
```

---

## 6. Project Structure (touched files)

```
scripts/check-pr-scope.sh         M   Rule 1 gains per-file label bypass; docblock updated
tests/scope-guard.sh              A   New — three fixture cases (~80 lines)
.github/workflows/test-build.yml  M   Add invocation of tests/scope-guard.sh
CLAUDE.md                         M   Document protected-file-update label in scope-guard table
SPEC.md                           M   This file
tasks/plan.md                     M   #985 plan
tasks/todo.md                     M   #985 todo
```

No changes to `_config.yml`, `_layouts/`, `_sass/`, `_posts/`, `Gemfile`, `Gemfile.lock`, `.github/CODEOWNERS`, `.github/copilot-instructions.md`, or `AGENTS.md`. The latter is deliberately untouched — this PR fixes the guard, not the doc.

---

## 7. Code Style

- **Bash style** — match existing `scripts/check-pr-scope.sh` conventions: `set -euo pipefail`, lowercase `local` vars, `echo` for status, `||` fallbacks for portability. No new dependencies beyond `git` and `bash`.
- **Label check** — reuse the existing `echo "${PR_LABELS:-}" | grep -q '<label>'` pattern (used by Rules 2 and 3 today). Don't introduce `[[ ]]` or `=~` matching — keep consistent.
- **Bypass log line** — single line per bypass, prefixed `check-pr-scope:` for grep-ability in CI logs.
- **Test script** — POSIX-friendly bash where possible; use `mktemp -d` for sandboxing; clean up temp dirs in a `trap`. No external test framework (no bats, no shellspec) — keep the dependency footprint minimal per the existing script's `git + bash only` constraint.
- **Comments** — only where the *why* is non-obvious (e.g., explaining why the per-file bypass list is separate from `PROTECTED_FILES`). No restating what the code does.

---

## 8. Testing Strategy

| Layer | Check |
|---|---|
| Unit/script | `tests/scope-guard.sh` cases A, B, C (AC-4) — black-box test against `check-pr-scope.sh` with three fixture diffs and PR_LABELS values |
| Integration | `.github/workflows/test-build.yml` runs `tests/scope-guard.sh` on every PR push (AC-5) — guards against regression |
| Manual | One-shot replay against #984's diff state (AC-8) — confirms the real-world false positive is now fixed |
| Build | `bundle exec jekyll build` (AC-9) — sanity check that the change doesn't affect site builds |

No Playwright spec — no UI surface touched.

---

## 9. Boundaries

**Always:**
- Run `bash tests/scope-guard.sh` locally before pushing.
- Run `bash scripts/check-pr-scope.sh` (without PR_LABELS) against the branch — expect PASS (no protected file in our diff today).
- Use the existing label-check pattern (`echo "${PR_LABELS:-}" | grep -q '<label>'`).
- Match existing bash style in `scripts/check-pr-scope.sh`.

**Ask first about:**
- Adding any file to the `PROTECTED_FILE_UPDATE_BYPASS` allow-list beyond `AGENTS.md` and `ARCHITECTURE.md`.
- Changing the label name from `protected-file-update` to anything else (would break docs and CLAUDE.md cross-refs).
- Renaming or restructuring `scripts/check-pr-scope.sh` (out of scope; this is a targeted addition).
- Introducing a test framework dependency (bats/shellspec) — the existing constraint is bash + git only.

**Never:**
- Remove any file from `PROTECTED_FILES` (the existing protection list is intentional). [Out of scope per #985]
- Make the bypass apply to `_config.yml`, `Gemfile`, `Gemfile.lock`, `.github/CODEOWNERS`, or `.github/copilot-instructions.md`. [Out of scope per #985]
- Extend the existing `governance-update` label to cover Rule 1. [Out of scope per #985 — conflates two distinct categories]
- Touch any file under `_posts/`, `_sass/`, `_layouts/`, or `_config.yml`. [Boundary]
- Modify `AGENTS.md` or `ARCHITECTURE.md` in this PR (they're the *test subject* of the new exemption, not the implementation target).

---

## 10. Risks

| Risk | Mitigation |
|---|---|
| The bash label-check pattern `grep -q 'protected-file-update'` substring-matches inside another label like `protected-file-update-experimental` (false positive) | Add anchors: `grep -q '\bprotected-file-update\b'`. But the existing `bulk-content` / `governance-update` checks don't use anchors — match precedent and accept the substring risk (no other labels with this prefix exist today). Flag as a future hardening item if a confusable label is ever added. |
| `tests/scope-guard.sh` creates temp git repos in CI — slow or flaky | Each case ~1s; three cases total. Negligible CI cost. If flakiness appears, debug via the `trap` cleanup logging. |
| `.github/workflows/test-build.yml` change touches a workflow file — could trip the scope guard itself when CI re-runs on this PR (Rule 4 forbids `agent:qa-gatekeeper` from touching `.github/workflows/` only if the agent label is set in PR_LABELS) | This PR carries `agent:qa-gatekeeper` + `governance-update`. Rule 4 for `agent:qa-gatekeeper` *allows* `.github/workflows/` (line 67 in AGENTS.md / line 128 in the script). No conflict. |
| Script change breaks the existing `check-agent-scope` job for non-#985 PRs in flight | Run `bash scripts/check-pr-scope.sh` against the current branch with no protected files in diff → expect PASS. Run with `AGENTS.md` modified + no label → expect FAIL. Both behaviours unchanged. Verified by Cases A and C in the new test. |
| Manual replay (AC-8) requires checking out a historical SHA — workflow risk | The replay is documented as an offline verification step, not in CI. Don't commit anything from the replay checkout. Use a worktree or detached HEAD. |

---

## 11. Out of Scope

Per issue #985:

- Removing `AGENTS.md` or `ARCHITECTURE.md` from `PROTECTED_FILES`.
- Extending the bypass to `_config.yml`, `Gemfile`, `Gemfile.lock`, `.github/CODEOWNERS`, or `.github/copilot-instructions.md`.
- Extending `governance-update` to cover Rule 1.
- Refactoring the script's overall structure (e.g., extracting rules into separate functions).
- Adding a `--self-test` mode to the script itself.
- Documenting the label outside `scripts/check-pr-scope.sh` docblock + `CLAUDE.md` (no separate `LABELS.md`).
- Backfilling label-bypass tests for the existing `bulk-content` and `governance-update` rules (worthwhile follow-up, separate issue).
