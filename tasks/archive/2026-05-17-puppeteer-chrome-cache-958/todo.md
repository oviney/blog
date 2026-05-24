# TODO — Puppeteer Chrome-Download Flake Mitigation (#958)

**Spec:** [../SPEC.md](../SPEC.md) · **Plan:** [plan.md](plan.md)
**Plan SHA:** `b965ddb` · 3 files (2 new + 1 modified) · 7 jobs to migrate

---

## Phase 1 — Composite action
- [x] **T1** Created `.github/actions/setup-node-with-puppeteer-cache/action.yml` + `_retry-test.sh`. YAML parses; bash syntax-checks clean.
- [x] **T2** RED retry test passed: `_retry-test.sh fail-fail-fail` → exit 1, 2 `::warning::` + 1 `::error::` lines.
- [x] **T3** GREEN retry test passed: `_retry-test.sh fail-fail-succeed` → exit 0, 2 `::warning::` + success-on-attempt-3 line.

## Phase 2 — Migrate call-sites
- [x] **T4** Replaced 7 call-sites in `test-quality.yml`. Grep counts verified (0 `setup-node@v6`, 7 composite-action references). YAML still parses.

## Phase 3 — Local verification
- [x] **T5** AC-8 boundary clean (3 files total: 2 new under `.github/actions/`, 1 modified workflow). Retry harness re-runs green post-migration.

## CHECKPOINT-A — Local gate before /review
- [x] All T1–T5 ACs satisfied. Commits A (`5924993`) + B (`901c95b`) on branch.

## Phase 4 — /review pass
- [x] **T6** Code-reviewer agent verdict: **Approve**, no blockers. 2 Majors + 2 minor revisions identified.
- [x] **T7** Applied all 4 revisions in Commit C (`5c72a7a`): M2 cache-key salts on Node version; M1 tightened sync-comment in both files (retry SHAPE not byte-identical); m1 set-uo-pipefail rationale comment; n1 RETRY-TEST PASS/FAIL banner prefix. Harness still green post-revision.

## Phase 5 — Ship
- [ ] **T8** Push branch; `gh pr create` with retry-test outputs + 7-job list + AC-8 diff stat; label `agent:qa-gatekeeper`.
- [ ] **T9** CI passes — tolerate one Chrome-flake rerun during transition (cache priming on first run).
- [ ] **T10** `gh pr merge --admin --squash --delete-branch` once green; sync local main.

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
