# TODO — Puppeteer Chrome-Download Flake Mitigation (#958)

**Spec:** [../SPEC.md](../SPEC.md) · **Plan:** [plan.md](plan.md)
**Plan SHA:** `b965ddb` · 3 files (2 new + 1 modified) · 7 jobs to migrate

---

## Phase 1 — Composite action
- [ ] **T1** Create `.github/actions/setup-node-with-puppeteer-cache/action.yml` (per SPEC §6) + `_retry-test.sh` harness (duplicates retry loop; header notes action.yml as source of truth)
- [ ] **T2** RED retry test: `_retry-test.sh fail-fail-fail` → exit 1, 3 failure log lines, `::error::` terminal line
- [ ] **T3** GREEN retry test: `_retry-test.sh fail-fail-succeed` → exit 0, 2 retry-warning lines, success line on attempt 3

## Phase 2 — Migrate call-sites
- [ ] **T4** Replace `setup-node@v6 + npm ci` pair with composite-action call in all 7 jobs of `.github/workflows/test-quality.yml`: `quality-checks`, `security`, `playwright-partial`, `playwright-shard1`, `playwright-shard2`, `playwright-shard3`, `quality-report`. Verify grep counts (0 of old, 7 of new).

## Phase 3 — Local verification
- [ ] **T5** AC-8 boundary: `git diff --stat` shows exactly 3 files (2 new in `.github/actions/`, 1 modified `.github/workflows/test-quality.yml`); YAML parses for action and workflow; retry harness re-runs green.

## CHECKPOINT-A — Local gate before /review
- [ ] All T1–T5 ACs satisfied (composite exists, retry RED+GREEN, 7 sites migrated, AC-8 clean)

## Phase 4 — /review pass
- [ ] **T6** Code-reviewer agent reviews the branch — cache-key correctness, step ordering (cache before npm ci), retry exit-handling, AC-3 substitution fidelity
- [ ] **T7** Apply any /review revisions; commit as Commit C if needed

## Phase 5 — Ship
- [ ] **T8** Push `chore/958-puppeteer-cache-and-retry`; `gh pr create` with retry-test outputs + 7-job list + AC-8 diff stat; label `agent:qa-gatekeeper` (QA scope is valid here); no `governance-update` (no `.github/skills/` or `.github/instructions/` touches)
- [ ] **T9** CI passes — tolerate one Chrome-flake rerun during transition (cache priming on first run)
- [ ] **T10** `gh pr merge --admin --squash --delete-branch` once green; sync local main

## Phase 6 — Post-merge verification
- [ ] **T11** Open a trivial follow-up PR (any small change) to trigger fresh CI; inspect logs for `Cache restored from key:` on at least one of the 7 affected jobs (AC-5 verification — only observable in real CI)

---

## Acceptance criteria checklist (mirrors SPEC §3)

- [ ] **AC-1** Composite action exists with documented `node-version` (default `'20'`) and `npm-cache` (default `'npm'`) inputs
- [ ] **AC-2** Steps order: setup-node, cache puppeteer dir, retry-wrapped npm ci
- [ ] **AC-3** 7 jobs in `test-quality.yml` use composite action; no `setup-node@v6 + npm ci` pair remains outside it
- [ ] **AC-4** First post-merge run logs cache miss + cache save (verified via CI logs at T11)
- [ ] **AC-5** Subsequent run logs cache restored from key, ≥ 20s install-step time savings vs cold (T11)
- [ ] **AC-6** `_retry-test.sh` passes both RED (3-fail) and GREEN (2-fail-succeed) cases
- [ ] **AC-7** All 11 other test-quality.yml jobs continue passing
- [ ] **AC-8** `git diff --stat .github/workflows/` shows only `test-quality.yml` modified
- [ ] **AC-9** `action.yml` parses as valid composite-action YAML
