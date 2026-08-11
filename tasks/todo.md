# TODO — Dependabot exemption for the scope guard

**Spec:** [../SPEC.md](../SPEC.md) · **Plan:** [plan.md](plan.md) · **Issue:** #1253
**Branch:** `chore/1253-dependabot-scope-exemption` · **Date:** 2026-08-11

## Phase 0 — Groundwork

- [x] Confirm the healing-monitor retirement is holding (0 runs in ~15 h, 4 missed slots)
- [x] Confirm the guard runs under `pull_request`, not `pull_request_target` (`test-build.yml:3-13`)
- [x] Owner approves the author + path-scoped design (D-1)
- [x] Write SPEC / plan / todo
- [ ] Branch off `main`

## Phase 1 — Tests first

- [ ] `run_case` gains optional 6th arg `pr_author`; export `PR_AUTHOR`
- [ ] Run suite — **A–K must still pass** before touching the production script
- [ ] Add cases **L–P**
- [ ] Run suite — L, M must **fail** now (exit 1 where spec wants 0); N, O, P should already pass

### Checkpoint A — the new tests fail for the right reason

- [ ] L and M fail on `VIOLATION [protected-file]`, not on a harness error

## Phase 2 — Implement

- [ ] `DEPENDABOT_ALLOWED_FILES` + `is_dependabot_bump()` in `check-pr-scope.sh`
- [ ] Evaluate once into `DEPENDABOT_BUMP` before the Rule 1 loop
- [ ] Hook into Rule 1 alongside the existing `protected-file-update` bypass
- [ ] Record the `pull_request`-trigger constraint in the header (AC-7)
- [ ] Pass `PR_AUTHOR` in `test-build.yml` (AC-6)

### Checkpoint B — full suite (AC-1…AC-5)

- [ ] `bash tests/scope-guard.sh` → **A–P all pass**
- [ ] `bash -n` clean on `check-pr-scope.sh` and `tests/scope-guard.sh`
- [ ] Guard run against this branch with **no label** → exit 0

## Phase 3 — Docs + ship

- [ ] `README.md` scope-guard section documents the exemption (AC-8)
- [ ] `docs/BACKLOG.md` — move the P2 row to **Recently shipped**
- [ ] Open PR, `Closes #1253`, **no label needed** — verify that claim on the PR itself
- [ ] Merge when green

## Phase 4 — Real-world proof (AC-9)

- [ ] Rebase **#1242**
- [ ] Confirm `check-agent-scope` passes **without `--admin`** — the whole point
- [ ] Report #1242's merge decision back to the owner (still their call)

## Phase 5 — Close out

- [ ] Archive SPEC/plan/todo to `tasks/archive/2026-08-11-dependabot-scope-exemption/`
- [ ] Refresh `docs/BACKLOG.md` "Where to pick up"

## Deferred

- **#1252** — remove the orphaned healing machinery (next P3; read `healing-monitor.js` before deleting)
- **#1242** merge decision — owner; `remote_theme:` is commented out at `_config.yml:37`
- Publish decision on the two `_review/` drafts, incl. the new
  `hallucination-debt-ai-test-generation-d22a6c85.md` landed on `main` 2026-08-11
