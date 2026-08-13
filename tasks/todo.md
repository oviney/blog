# TODO — Stop the blocking visual gate depending on third-party hosts

**Spec:** [../SPEC.md](../SPEC.md) · **Plan:** [plan.md](plan.md) · **Issue:** [#1258](https://github.com/oviney/blog/issues/1258)
**Date:** 2026-08-12

## Phase 0 — Ground truth ✅

- [x] Confirm `site.giscus` is configured (`_config.yml:134`) so post pages really do load it
- [x] Confirm the giscus `<script>` reaches the built HTML (`_site/2025/12/31/testing-times/index.html:594`)
- [x] Build + serve locally and enumerate every external host the suite touches
- [x] Prove the local render matches CI: full-page height **6872** / **6810** at 1920px,
      exactly the committed Desktop baseline dimensions

## Phase 1 — Isolate per-host cost ✅

- [x] Blocking **fonts** reflows the page by **348px** — must stay allowed (SPEC D2)
- [x] Blocking **analytics** is **byte-identical** on all 10 suite pages — free (SPEC D3)
- [x] Blocking **giscus** costs exactly **160px** on post pages only
      (`.post-comments` 222px → 62px) — 6 baselines to re-seed (SPEC D4)
- [x] Load time improves ~1.2s → ~0.8s per page; posts ~2.0s → ~0.9s

## Phase 2 — Implement

- [ ] **T1** Add the third-party route block to `visual-snapshot.spec.ts`
- [ ] **T2** Document the fonts exemption with the measured 348px reflow

## Phase 3 — Verify before seeding

- [ ] **Checkpoint A** — run the visual spec locally; expect exactly the 6 post
      cases to fail on a height mismatch and all 24 non-post cases to pass
- [ ] Confirm no request leaves localhost except to the two font hosts

## Phase 4 — Re-seed and audit

- [ ] Dispatch `test-quality.yml` with `update_snapshots=true`
- [ ] **Checkpoint B** — diff the seeded baselines; confirm exactly 6 files changed
- [ ] Restore any baseline outside the expected 6 and note it on #1262

## Phase 5 — Full suite, review, ship

- [ ] Run the whole Playwright suite, especially `analytics.spec.ts`
- [ ] `bash scripts/check-pr-scope.sh`
- [ ] Review the diff across correctness / maintainability / security / coverage
- [ ] Open the PR; leave unmerged for review

## Out of scope

- The other three items in #1262
- Self-hosting web fonts (SPEC §7) — file separately
- Moving the route block into `playwright.config.ts` (SPEC D6)

## Housekeeping done alongside (2026-08-12)

- [x] Closed #1267 as stale — it was the alt-text error fixed by #1264, filed
      against `674ce1b` 45 minutes before the fix merged
- [x] Bulk-closed 20 unworked auto-generated report issues dating to 2026-06-01;
      backlog went 30 → 9, all actionable
- [x] Committed the four `.claude/agent-memory/` files from the #1260 fan-out —
      PR [#1268](https://github.com/oviney/blog/pull/1268), same treatment as #1246
