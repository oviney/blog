# SPEC — Anchor bulk-content / governance-update label greps + add drift guard (#987)

**Status:** Draft — awaiting approval
**Issue:** [#987](https://github.com/oviney/blog/issues/987)
**Labels:** `agent:qa-gatekeeper`, `governance-update`
**Date:** 2026-05-25
**Lifecycle phase:** DEFINE
**Spawned from:** PR [#988](https://github.com/oviney/blog/pull/988) (closed #985) /ship review — code-reviewer Critical scoped to `protected-file-update` only; security-auditor flagged same antipattern on `bulk-content` / `governance-update` as Info.

---

## 1. Situation

`scripts/check-pr-scope.sh` uses unanchored substring greps for the `bulk-content` and `governance-update` labels:

- **line 110** — `if echo "${PR_LABELS:-}" | grep -q 'bulk-content'; then`
- **line 124** — `if echo "${PR_LABELS:-}" | grep -q 'governance-update'; then`

Confusable label names (e.g. `not-bulk-content-foo`, `governance-update-experimental`) trip these bypasses. The `protected-file-update` label (added by #985 / PR #988) was originally written with the same antipattern; #988 caught and anchored it (`scripts/check-pr-scope.sh:96` post-merge) but deliberately scoped the fix to the new label per the user's "fix new grep only + Case D pin" decision during /ship review.

Security-auditor judged the remaining two unanchored greps **not currently exploitable** in this threat model:
- Labels can only be applied by users with `triage`/`write` on `oviney/blog`.
- Forked PRs cannot mutate labels.
- An attacker with label-write privilege can apply the canonical label directly — the substring confusion variant adds no privilege.

The hole is **consistency debt**, not an active vulnerability. Closing it cleans up the antipattern globally, gives all three rule-level bypasses the same security posture, and adds regression-prevention via fixture cases that pin the anchored semantics.

CI surface: `scripts/check-pr-scope.sh` runs in `.github/workflows/test-build.yml` `check-agent-scope` job (line 95–113 post-#988). The fixture harness `tests/scope-guard.sh` (added in #988) covers Rule 1 only — Rule 2 and Rule 3 currently have no automated tests.

---

## 2. Objective

Anchor the `bulk-content` and `governance-update` label greps in `scripts/check-pr-scope.sh` to match the comma-joined `PR_LABELS` format exactly, using a single `has_label()` helper that DRYs all three rule-level bypass checks. Extend `tests/scope-guard.sh` to multi-file fixtures and add two new cases (E, F) pinning the anchored semantics so a future refactor can't silently re-introduce a substring match on either label. Single source of truth for the label check; consistent security posture across all three labels.

---

## 3. Design Decisions (confirmed 2026-05-25)

| Decision | Choice | Rationale |
|---|---|---|
| Refactor approach | **Extract `has_label()` helper, call from Rules 1, 2, 3** | Single source of truth; eliminates the antipattern by construction so a fourth label can't copy the wrong pattern. Code-reviewer in #988 explicitly suggested this. |
| Helper signature | **`has_label <label-name>`** — returns 0 if label is in `PR_LABELS`, 1 otherwise | Plain bash function; reads naturally at call sites (`if has_label 'bulk-content'; then …`). |
| Helper implementation | **`printf '%s\n' "${PR_LABELS:-}" \| tr ',' '\n' \| grep -Fxq "$1"`** | Same anchored pattern #985 introduced for Rule 1. `-F` (fixed string), `-x` (whole-line), `-q` (quiet). |
| Test fixture mechanics | **Extend `run_case` to accept newline-separated multi-file paths** | Cases E (Rule 2, 16+ files) and F (Rule 3, `.github/skills/`) need multi-file or path-prefixed setups. One helper, not two. Case A–D continue to work by passing a single path (existing call sites become `\$'AGENTS.md'`, unchanged). |
| Test cases to add | **Case E (`bulk-content` substring pin), Case F (`governance-update` substring pin)** — no separate pin for `agent:` labels | The `agent:*` checks (lines 148–161) use prefix-match strings (`agent:creative-director` cannot be confused with a different `agent:*` label because each label starts with the full agent name). They are not the same antipattern; skip. |
| Drift guard | **Out of scope** | The user's #987 issue body explicitly lists this as out of scope ("Adding a startup sanity check that asserts `PROTECTED_FILE_UPDATE_BYPASS ⊆ PROTECTED_FILES` … worth a separate issue"). Filed only if appetite arises. |
| Documentation | **No CLAUDE.md change required** | The behavioural contract is unchanged from the user's perspective — both labels were intended to be exact-match all along. The docblock in `scripts/check-pr-scope.sh` will not need new examples either; existing PASS/FAIL examples still hold. |
| `protected-file-update` Rule 1 grep | **Migrate to `has_label()` helper** for consistency | Currently inlined post-#988. Routing through the helper keeps all three labels symmetric. Cases A–D must continue to pass post-refactor (regression-prevent the helper extraction). |

---

## 4. Acceptance Criteria

- [ ] **AC-1** `scripts/check-pr-scope.sh` defines a `has_label()` shell function near the top of the rule section (after `CHANGED_FILES` definition, before Rule 1) that takes one argument (label name) and returns 0 iff that label is present in `PR_LABELS` as a comma-delimited exact-match entry.
- [ ] **AC-2** Rule 1 (`protected-file-update` bypass), Rule 2 (`bulk-content` bypass), and Rule 3 (`governance-update` bypass) all call `has_label '<label>'` — no remaining `grep -q '<label-string>'` patterns in the rule bodies.
- [ ] **AC-3** `tests/scope-guard.sh` `run_case` helper accepts newline-separated multi-file paths in its `<file_to_modify>` parameter. Each path is touched and staged.
- [ ] **AC-4** New fixture cases in `tests/scope-guard.sh`:
  - **Case E:** 21 unique unprotected files modified, `PR_LABELS="not-bulk-content-foo"` → guard fails (exit 1), output contains `VIOLATION [scope-explosion]`.
  - **Case F:** `.github/skills/scope-guard-test/SKILL.md` created, `PR_LABELS="governance-update-experimental"` → guard fails (exit 1), output contains `VIOLATION [governance-surface]`.
- [ ] **AC-5** Existing Cases A, B, C, D continue to pass post-refactor (Rule 1 still works via `has_label`).
- [ ] **AC-6** `bash tests/scope-guard.sh` exits 0 with **6/6 PASS**.
- [ ] **AC-7** Sanity replay against `main` HEAD: `bash scripts/check-pr-scope.sh` from the merged `main` state still PASSES (no protected file on `main`; no regression).
- [ ] **AC-8** `bundle exec jekyll build` exits 0 (no Jekyll content surface touched).
- [ ] **AC-9** Scope-guard boundary on this PR: `git diff --name-only main...HEAD` returns exactly — `scripts/check-pr-scope.sh`, `tests/scope-guard.sh`, plus lifecycle artifacts (`SPEC.md`, `tasks/plan.md`, `tasks/todo.md`), plus the carry-over archived #985 lifecycle artifacts (`tasks/archive/2026-05-24-scope-guard-985/{plan,todo}.md`). Total **≤ 7 files** (using the post-#988 ≤9 budget pattern minus 2 since this PR doesn't touch `CLAUDE.md` or `.github/workflows/test-build.yml`).
- [ ] **AC-10** No regression of `bulk-content` / `governance-update` exact-match behaviour: `PR_LABELS="bulk-content"` against >15 files still passes (Rule 2 bypassed); `PR_LABELS="governance-update"` against `.github/skills/foo` still passes (Rule 3 bypassed). Verified via manual probe or two additional fixture cases — manual probe is acceptable since both labels are well-exercised by real PRs in the repo history.

---

## 5. Commands

```bash
# Local development loop
bundle exec jekyll build                          # AC-8
bash scripts/check-pr-scope.sh                    # baseline (expected: PASS — no protected file in our diff)
bash tests/scope-guard.sh                         # AC-6 — expect 6/6 PASS

# Sanity-check existing labels still work as intended (AC-10)
# Run inside a temp git repo with 16 unprotected files + bulk-content label → expect Rule 2 skipped
# Or inspect the script's stdout for the new "bulk-content label present — skipping rule 2." line.
```

---

## 6. Project Structure (touched files)

```
scripts/check-pr-scope.sh         M   Define has_label(); refactor 3 label checks to use it
tests/scope-guard.sh              M   Multi-file run_case + Cases E & F
SPEC.md                           M   This file
tasks/plan.md                     M   #987 plan
tasks/todo.md                     M   #987 todo
tasks/archive/2026-05-24-scope-guard-985/  A   Carry-over: archived #985 plan + todo
```

**Total scope:** 5 substantive lifecycle files + 2 archive carry-over files = **7 files**. No changes to `.github/workflows/`, `CLAUDE.md`, `AGENTS.md`, `ARCHITECTURE.md`, or any `_posts/`, `_sass/`, `_layouts/`, `_config.yml`.

---

## 7. Code Style

- **Bash function style** — define `has_label()` with `local` for any internal vars; single responsibility; no side effects beyond the grep exit code.
- **Call-site readability** — `if has_label 'bulk-content'; then` reads as plain English; preserves the existing `if … ; then` structure of each rule.
- **No comment churn at call sites** — the helper name documents intent; don't restate "this checks for the X label" at every call. Keep the existing surrounding context comments.
- **Test harness style** — `run_case`'s multi-file parameter remains a single string param (positional-arg compatibility); the helper splits on newlines internally. Existing 4 call sites continue to pass a single path with no quoting change required.
- **No new dependencies** — bash + git only, matching the existing constraint.

---

## 8. Testing Strategy

| Layer | Check |
|---|---|
| Unit/script | `tests/scope-guard.sh` — 6 fixture cases covering Rule 1 (A–D, B+D pin label anchoring), Rule 2 (E pin substring antipattern fix), Rule 3 (F pin substring antipattern fix) |
| Integration | `.github/workflows/test-build.yml` (no edits) — existing `check-agent-scope` job runs the harness; CI verifies 6/6 PASS on every PR |
| Manual | One-shot replay of the original `bulk-content` and `governance-update` exact-match behaviour against fixture state (AC-10) |
| Build | `bundle exec jekyll build` (AC-8) |
| Refactor regression | Cases A–D unchanged in semantics post-helper-extraction (AC-5) |

No Playwright spec — no runtime UI.

---

## 9. Boundaries

**Always:**
- Run `bash tests/scope-guard.sh` locally before pushing — expect 6/6 PASS.
- Route all three rule-level label checks through `has_label()`. Don't leave any inline `grep -q '<label>'` patterns behind.
- Match the existing `printf | tr | grep -Fxq` anchored pattern exactly — same `-Fxq` flags, same comma-split.

**Ask first about:**
- Adding a fourth label-driven bypass (would require a separate issue and a new label-naming decision).
- Touching the `agent:*` label checks at lines 148–161 (they use prefix-match strings, not the same antipattern; out of scope for #987).
- Changing the helper's signature or name from `has_label`.
- Adding the `PROTECTED_FILES ↔ PROTECTED_FILE_UPDATE_BYPASS` drift guard (out-of-scope per #987 issue body).

**Never:**
- Modify `AGENTS.md`, `ARCHITECTURE.md`, `_config.yml`, `Gemfile`, `Gemfile.lock`, `.github/CODEOWNERS`, or `.github/copilot-instructions.md`. [Protected files; the PR carries `governance-update` only, not `protected-file-update`.]
- Change the behaviour of the existing `bulk-content` / `governance-update` exact-match path. The refactor must be semantics-preserving for the canonical label; only the substring confusion path changes.
- Touch `.github/workflows/test-build.yml` (no new CI step needed — existing `tests/scope-guard.sh` invocation already covers Cases E/F).
- Add `bats`, `shellspec`, or any test framework. [Boundary inherited from #985 SPEC §9.]

---

## 10. Risks

| Risk | Mitigation |
|---|---|
| Helper refactor breaks Rule 1 (existing protected-file-update path). | Cases A–D in `tests/scope-guard.sh` will fail loudly if so. AC-5 explicitly guards this. |
| `has_label` mis-implementation accepts an empty label argument and matches an empty `PR_LABELS` line. | Add a defensive `[ -z "$1" ] && return 1` guard at the top of `has_label`. Document in code style. |
| Case E's 16-file fixture creates files that themselves trip another rule (e.g., one happens to match a protected name). | Use clearly-distinct paths: `tests-e-1.txt` through `tests-e-21.txt` under a sandbox dir. None of these match `PROTECTED_FILES` or any `agent:*` forbidden pattern. |
| Case F creating a real `.github/skills/scope-guard-test/SKILL.md` in the fixture leaks state. | Fixture creates files inside the temp git repo, never the production repo. `mktemp -d` + `trap cleanup EXIT` (existing pattern) keeps it hermetic. |
| Migrating Rule 1 to the helper changes the bypass log line. | Keep the log line identical (`"check-pr-scope: protected-file-update label present — bypassing protection for '$protected'."`). Only the label-check expression changes, not the message. Case B's `expected_grep` continues to match. |
| Reviewer asks for the agent-scope checks (lines 148–161) to also use `has_label`. | Those are prefix-match string comparisons, not substring-match antipatterns. They're not in scope for #987. Document the difference in PR description if asked. |

---

## 11. Out of Scope

Per issue #987:

- **Adding the `PROTECTED_FILES ↔ PROTECTED_FILE_UPDATE_BYPASS` drift guard** (config-error sanity check) — worth a separate issue if appetite arises.
- **Anchoring the `agent:*` label checks at lines 148–161** — those use prefix-match strings, not substring-match antipatterns.
- **Refactoring Rule 1's per-file allow-list check** (the second `printf '%s\n' "${PROTECTED_FILE_UPDATE_BYPASS[@]}" | grep -qx "$protected"` line) — that's a separate concern from label matching; keep it inline.
- **Adding test framework dependencies** (`bats`, `shellspec`).
- **CLAUDE.md changes** — no documented behaviour changes from the user's perspective.
- **`AGENTS.md` / `ARCHITECTURE.md` changes** — protected files; not the target of this PR.
- **Cross-repo / A2A protocol integration.**
