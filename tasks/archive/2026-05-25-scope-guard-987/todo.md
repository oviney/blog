# TODO — Anchor bulk-content / governance-update label greps (#987)

**Spec:** _(archived)_ · **Plan:** [plan.md](plan.md)
**Branch:** `fix/987-anchor-label-greps` (to create)

---

## Phase 0 — Setup

- [ ] 0.1 Fetch origin/main; confirm at `a7f5021b` (#988 merge)
- [ ] 0.2 Stash #987 lifecycle (SPEC + plan + todo)
- [ ] 0.3 Switch to `main`; `git pull --ff-only origin main`
- [ ] 0.4 `git switch -c fix/987-anchor-label-greps`
- [ ] 0.5 Pop stash; archive #985 lifecycle to `tasks/archive/2026-05-25-scope-guard-985/`
- [ ] 0.6 Commit: `docs(#987): lifecycle artifacts (SPEC + plan + todo) for label-grep anchoring`

## Phase 1 — Extend `run_case` for multi-file (one commit)

- [ ] 1.1 Modify `run_case` in `tests/scope-guard.sh`: treat `$3` as newline-separated paths; loop to touch each; single `git add .`
- [ ] 1.2 Confirm Cases A–D unchanged at call sites (single path is still valid input)
- [ ] 1.3 Add inline contract comment above `run_case`
- [ ] Verify: `bash tests/scope-guard.sh` → 4/4 PASS, exit 0 (no semantics change)
- [ ] Commit: `test(#987): extend run_case to accept newline-separated multi-file fixtures`

## Checkpoint A — Refactor regression-clean

- [ ] Cases A, B, C, D PASS
- [ ] No new deps
- [ ] Trap cleanup intact

## Phase 2 — Cases E and F (RED) — one commit

- [ ] 2.1 Add Case E: 21 paths `tests-e-1.txt`…`tests-e-21.txt`, `PR_LABELS="not-bulk-content-foo"`, expect exit=1 + `VIOLATION [scope-explosion]`
- [ ] 2.2 Add Case F: path `.github/skills/scope-guard-test/SKILL.md`, `PR_LABELS="governance-update-experimental"`, expect exit=1 + `VIOLATION [governance-surface]`
- [ ] Verify (RED): `bash tests/scope-guard.sh` → 4 PASS (A–D), 2 FAIL (E, F), exit 1
- [ ] Commit: `test(#987): add Cases E and F (RED — substring antipatterns on bulk-content/governance-update)`

## Checkpoint B — Gap confirmed real

- [ ] Cases A–D PASS
- [ ] Case E FAIL (substring antipattern bypasses Rule 2)
- [ ] Case F FAIL (substring antipattern bypasses Rule 3)

## Phase 3 — `has_label()` helper + 3-rule migration (GREEN) — one commit

- [ ] 3.1 Define `has_label()` in `scripts/check-pr-scope.sh` between `CHANGED_FILES` (line ~62) and Rule 1 (line ~75). Body: `[ -z "${1:-}" ] && return 1; printf '%s\n' "${PR_LABELS:-}" | tr ',' '\n' | grep -Fxq "$1"`
- [ ] 3.2 Migrate Rule 1's `protected-file-update` check to `if has_label 'protected-file-update' && …`
- [ ] 3.3 Migrate Rule 2's check to `if has_label 'bulk-content'`
- [ ] 3.4 Migrate Rule 3's check to `if has_label 'governance-update'`
- [ ] 3.5 Confirm no remaining `grep -q '<label>'` patterns in rule bodies (only inside `has_label`)
- [ ] 3.6 Leave `agent:*` checks (lines ~148–161) untouched
- [ ] Verify (GREEN): `bash tests/scope-guard.sh` → 6/6 PASS, exit 0
- [ ] Verify baseline: `bash scripts/check-pr-scope.sh` on current branch → PASS
- [ ] Commit: `fix(#987): extract has_label() helper; anchor bulk-content and governance-update label checks`

## Checkpoint C — Full 10-AC battery

- [ ] AC-1: `grep -c "^has_label()" scripts/check-pr-scope.sh` → 1
- [ ] AC-2: `grep -cE "has_label '" scripts/check-pr-scope.sh` → 3 (Rules 1, 2, 3)
- [ ] AC-3: `run_case` multi-file works (Case E proves)
- [ ] AC-4: Cases E + F in `tests/scope-guard.sh`
- [ ] AC-5: Cases A–D PASS
- [ ] AC-6: `bash tests/scope-guard.sh` → 6/6 PASS, exit 0
- [ ] AC-7: `bash scripts/check-pr-scope.sh` against branch → PASS
- [ ] AC-8: `bundle exec jekyll build` exit 0
- [ ] AC-9: `git diff --name-only main...HEAD | wc -l` ≤ 7
- [ ] AC-10: Manual sanity — canonical `bulk-content` + 16 files still bypasses Rule 2; canonical `governance-update` + `.github/skills/foo` still bypasses Rule 3

## Phase 4 — Ship (`/ship` flow)

- [ ] Push branch
- [ ] Open PR with `Closes #987`; apply `agent:qa-gatekeeper` + `governance-update` labels
- [ ] CI green (or admin-merge per #953/#984/#988 precedent)
- [ ] Merge `--squash --delete-branch`
- [ ] Confirm Deploy Jekyll site to Pages + Production Smoke Tests pass on merge SHA
- [ ] Comment on #987 with production verification
- [ ] Update [[reference-scope-guard]] memory: all three label-driven bypasses now anchored
