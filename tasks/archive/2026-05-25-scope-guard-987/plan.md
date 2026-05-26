# Plan — Anchor bulk-content / governance-update label greps (#987)

**Spec:** _(archived)_
**Issue:** [#987](https://github.com/oviney/blog/issues/987)
**Date:** 2026-05-25
**Labels:** `agent:qa-gatekeeper`, `governance-update`
**Branch:** `fix/987-anchor-label-greps` (to be created)
**Lifecycle phase:** PLAN

---

## Scope summary

Two substantive file changes:
1. `scripts/check-pr-scope.sh` — define `has_label()` helper; route Rules 1, 2, 3 label checks through it.
2. `tests/scope-guard.sh` — extend `run_case` to accept multi-file fixtures; add Cases E + F to pin the anchored semantics for `bulk-content` and `governance-update`.

Five lifecycle files (SPEC + plan + todo + 2 carry-over archive). Total **≤ 7 files**.

Classical RED→GREEN order: harness refactor (semantics-preserving) → new failing cases (gap exposed) → helper extraction (gap fixed).

---

## Dependency graph

```
Phase 0 (branch + lifecycle)
    │
    ▼
Phase 1 (extend run_case to multi-file)
    │   Cases A–D still 4/4 PASS (semantics-preserving refactor)
    │
    ▼   Checkpoint A: refactor regression-clean
    │
Phase 2 (add Cases E + F — RED)
    │   Cases A–D PASS, E + F FAIL (substring antipattern exposed)
    │
    ▼   Checkpoint B: gap confirmed real
    │
Phase 3 (extract has_label + migrate 3 rules — GREEN)
    │   Cases A–F all 6/6 PASS (helper anchors all three)
    │
    ▼   Checkpoint C: full 10-AC battery
    │
Phase 4 (ship)
```

**Why this order:**
- Harness refactor first: lets Cases E + F be added cleanly in Phase 2 without touching the production script yet.
- Cases E + F before the script change: classic TDD — write the failing test, then make it pass. Branch history clearly records the gap → fix.
- Helper extraction last: lands the fix that turns the failing cases green. Migrating Rule 1 through the same helper at this step preserves the anchored behaviour #988 already established and prevents future drift.

---

## Vertical slices

### Phase 0 — Branch setup

| Task | Action |
|---|---|
| 0.1 | `git fetch origin main`; checkout main; pull (current main at `a7f5021b`, the #988 merge) |
| 0.2 | `git switch -c fix/987-anchor-label-greps` |
| 0.3 | Stash #987 lifecycle work (SPEC + plan + todo) before the switch if not already; pop after |
| 0.4 | Archive #985 lifecycle artifacts to `tasks/archive/2026-05-25-scope-guard-985/` |
| 0.5 | Commit lifecycle: `docs(#987): lifecycle artifacts (SPEC + plan + todo) for label-grep anchoring` |

---

### Phase 1 — Extend `run_case` to multi-file fixtures
*One atomic commit. Semantics-preserving refactor; Cases A–D continue passing.*

| Task | Action |
|---|---|
| 1.1 | In `tests/scope-guard.sh`, modify `run_case` so `$3` (`file_to_modify`) is treated as a newline-separated list of paths. Iterate over each, `mkdir -p $(dirname)` if needed, `printf 'modified\n' >> "$f"`, `git add .` once after the loop. |
| 1.2 | No change required at the four existing call sites (A, B, C, D each pass a single path which is a 1-element list under the new contract). |
| 1.3 | Add a comment above `run_case` documenting the multi-file contract: "If `$3` contains newlines, each path is touched in turn." |

**Phase 1 ACs covered:** AC-3 (multi-file `run_case` contract).

**Phase 1 verification:**
```bash
bash tests/scope-guard.sh
# Expected: 4/4 PASS, exit 0 (Cases A–D semantics-preserved)
```

**Commit:** `test(#987): extend run_case to accept newline-separated multi-file fixtures`

---

### Checkpoint A — Refactor regression-clean

- [ ] Cases A, B, C, D all PASS post-refactor
- [ ] No new dependencies (still bash + git only)
- [ ] Trap cleanup unchanged

---

### Phase 2 — Cases E and F (RED)
*One atomic commit. Adds failing tests that expose the substring antipattern.*

| Task | Action |
|---|---|
| 2.1 | Add Case E to `tests/scope-guard.sh`: 21 unique unprotected paths (`tests-e-1.txt` through `tests-e-21.txt`), `PR_LABELS="not-bulk-content-foo"`, expected exit=1, expected grep=`VIOLATION [scope-explosion]`. |
| 2.2 | Add Case F: single path `.github/skills/scope-guard-test/SKILL.md` (multi-segment path that triggers Rule 3), `PR_LABELS="governance-update-experimental"`, expected exit=1, expected grep=`VIOLATION [governance-surface]`. |
| 2.3 | Verify Case E's 21-path string uses `printf '%s\n'` correctly so each line becomes a fixture file. |

**Phase 2 ACs covered:** AC-4 (Cases E and F defined).

**Phase 2 verification (expected RED):**
```bash
bash tests/scope-guard.sh
# Expected: 4 PASS (A–D), 2 FAIL (E, F) — overall exit 1
# Case E fails: `grep -q 'bulk-content'` matches "not-bulk-content-foo" → Rule 2 wrongly skipped → guard returns exit 0
# Case F fails: `grep -q 'governance-update'` matches "governance-update-experimental" → Rule 3 wrongly skipped → guard returns exit 0
```

**Commit:** `test(#987): add Cases E and F (RED — substring antipatterns on bulk-content/governance-update)`

---

### Checkpoint B — Gap confirmed real

- [ ] Cases A–D: PASS
- [ ] Case E: FAIL (substring antipattern wrongly bypasses Rule 2)
- [ ] Case F: FAIL (substring antipattern wrongly bypasses Rule 3)
- [ ] Exit code 1 overall

If A–D fail, the multi-file refactor regressed something — debug before Phase 3.
If E/F pass, the antipattern doesn't behave as expected — recheck the issue premise.

---

### Phase 3 — `has_label()` helper + 3-rule migration (GREEN)
*One atomic commit. Closes the antipattern globally.*

| Task | Action |
|---|---|
| 3.1 | In `scripts/check-pr-scope.sh`, define `has_label()` near the top of the rule section (after `CHANGED_FILES` line ~62, before Rule 1 line ~75). Signature: `has_label() { [ -z "${1:-}" ] && return 1; printf '%s\n' "${PR_LABELS:-}" \| tr ',' '\n' \| grep -Fxq "$1"; }`. |
| 3.2 | Migrate Rule 1's anchored grep (current line ~96, the `protected-file-update` check) to `if has_label 'protected-file-update' && …; then`. Preserve the existing `&& …` per-file allow-list and the existing bypass log line. |
| 3.3 | Replace Rule 2's `if echo "${PR_LABELS:-}" \| grep -q 'bulk-content'; then` (line ~110) with `if has_label 'bulk-content'; then`. Existing log/skip body unchanged. |
| 3.4 | Replace Rule 3's `if echo "${PR_LABELS:-}" \| grep -q 'governance-update'; then` (line ~124) with `if has_label 'governance-update'; then`. Existing log/skip body unchanged. |
| 3.5 | Confirm no remaining inline `grep -q '<label-string>'` patterns in the rule bodies for the three label-driven bypasses. |
| 3.6 | Leave the `agent:*` checks (lines ~148–161) untouched — they're prefix-string matches, not substring antipatterns. Out of scope per SPEC §11. |

**Phase 3 ACs covered:** AC-1 (helper defined), AC-2 (three rules route through it), AC-5 (Cases A–D regression-clean), AC-6 (6/6 PASS).

**Phase 3 verification (expected GREEN):**
```bash
bash tests/scope-guard.sh
# Expected: 6/6 PASS, exit 0
# Case A still passes (no-label fail unchanged)
# Case B still passes (protected-file-update bypass via helper)
# Case C still passes (Gemfile + label still trips — per-file allow-list intact)
# Case D still passes (substring label "not-protected-file-update-foo" anchored away — same as before, just via helper)
# Case E now passes (bulk-content substring no longer bypasses → Rule 2 trips → exit 1)
# Case F now passes (governance-update substring no longer bypasses → Rule 3 trips → exit 1)
```

**Commit:** `fix(#987): extract has_label() helper; anchor bulk-content and governance-update label checks`

---

### Checkpoint C — Full 10-AC battery

| AC | Check |
|----|---|
| AC-1 | `grep -c "^has_label()" scripts/check-pr-scope.sh` → 1 |
| AC-2 | `grep -cE "has_label '" scripts/check-pr-scope.sh` → 3 (Rules 1, 2, 3); no remaining inline `grep -q 'bulk-content\|governance-update\|protected-file-update'` patterns in rule bodies |
| AC-3 | `run_case` accepts multi-file input (verified by Case E's 21-path fixture working) |
| AC-4 | Cases E + F present in `tests/scope-guard.sh` |
| AC-5 | Cases A–D still PASS post-refactor |
| AC-6 | `bash tests/scope-guard.sh` exits 0 with 6/6 PASS |
| AC-7 | `bash scripts/check-pr-scope.sh` against current branch (no protected file in diff) returns PASS |
| AC-8 | `bundle exec jekyll build` exits 0 |
| AC-9 | `git diff --name-only main...HEAD \| wc -l` ≤ 7 |
| AC-10 | Manual sanity (or via fixture probe): `PR_LABELS="bulk-content"` + 16 files → Rule 2 bypassed; `PR_LABELS="governance-update"` + `.github/skills/foo` → Rule 3 bypassed. No regression of canonical labels. |

**Pass criteria:** all 10 ACs green.

---

### Phase 4 — Ship

*Standard `/ship` flow.*

| Task | Action |
|---|---|
| 4.1 | Push branch `fix/987-anchor-label-greps` |
| 4.2 | Open PR with `Closes #987`; apply `agent:qa-gatekeeper` + `governance-update` labels |
| 4.3 | CI green expected (no protected files in this PR's diff; new fixture cases pass after the helper extraction) |
| 4.4 | Admin-merge if blocked by 1-reviewer rule (per #953/#984/#988 precedent) |
| 4.5 | Confirm Deploy Jekyll site to Pages + Production Smoke Tests pass on merge SHA |
| 4.6 | Comment on #987 with production verification notes |
| 4.7 | Update [[reference-scope-guard]] memory: all three label-driven bypasses now anchored; antipattern fully closed |

---

## Risks (from SPEC §10, re-evaluated)

| Risk | Realised? | Plan response |
|---|---|---|
| Helper refactor breaks Rule 1 | Mitigated by Cases A–D regression-pinning | Checkpoints A and B verify before Phase 3 lands |
| `has_label` accepts empty label arg | Mitigated by `[ -z "${1:-}" ] && return 1` defensive guard | Task 3.1 includes this |
| Case E's 21 files trip an unrelated rule | Mitigated by deliberately non-protected paths (`tests-e-*.txt`) | Task 2.1 specifies the naming |
| Case F's `.github/skills/...` path leaks into production | `tmp` fixture isolation + `trap cleanup` per existing pattern | None additional |
| Migrating Rule 1 changes the bypass log line | The log line is per-file (`bypassing protection for '$protected'`) and lives outside the `has_label` call | Case B's expected_grep continues to match |
| Reviewer asks for `agent:*` label anchoring | Those are prefix-strings, not substring antipatterns | SPEC §11 documents the rationale; cite if asked |
| Phantom `build` + 1-reviewer block on PR | Yes — recurring | Admin-merge per precedent |

---

## Out of scope (locked, per SPEC §11)

- `PROTECTED_FILES ↔ PROTECTED_FILE_UPDATE_BYPASS` drift guard
- `agent:*` label check anchoring (lines 148–161)
- Refactoring Rule 1's per-file allow-list check (`PROTECTED_FILE_UPDATE_BYPASS` grep)
- Test framework dependencies (bats, shellspec)
- CLAUDE.md changes (no user-visible behaviour change)
- `AGENTS.md` / `ARCHITECTURE.md` changes (protected; not this PR's target)
- Cross-repo / A2A protocol integration
