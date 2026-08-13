# TODO — Stop the blocking visual gate depending on third-party hosts

**Spec:** [SPEC.md](SPEC.md) · **Plan:** [plan.md](plan.md) · **Issue:** [#1258](https://github.com/oviney/blog/issues/1258)
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

## Phase 2 — Implement ✅

- [x] **T1** Add the third-party route block to `visual-snapshot.spec.ts`
- [x] **T2** Document the fonts exemption with the measured 348px reflow

## Phase 3 — Verify before seeding ✅

- [x] **Checkpoint A** — ran the visual spec locally and got exactly the predicted
      shape: **6 failed / 24 passed**, the 6 being the 2 posts × 3 viewports,
      each failing on height (`Expected 1920×6810, received 1920×6650`).
      That shape is the evidence D3 holds — had the analytics block moved a
      single pixel on any other page, a 25th case would have failed

## Phase 4 — Re-seed and audit ✅

- [x] Dispatched `test-quality.yml` with `update_snapshots=true` (run 31657295617);
      the seed job succeeded and committed `44c5123`
- [x] **Checkpoint B** — the seed touched **exactly the 6 expected files** and
      nothing else. Verified twice: `git show --name-only` lists 6, and an md5
      comparison of all 30 baselines before/after reports 6 changed, 24 identical.
      **No collateral damage this time** — unlike both prior dispatches (#1262)
- [x] New dimensions carry the predicted −160px on every viewport:
      Desktop 6872→6712 / 6810→6650, Tablet 6705→6546 / 6613→6455,
      Mobile 11816→11658 / 11717→11558
- [x] Re-ran the visual spec against the seeded baselines — **30/30 passed**

## Phase 5 — Full suite, review, ship ✅

- [x] Whole Playwright suite excluding the visual gate — **432 passed, 9 skipped,
      0 failed**. `analytics.spec.ts` green, which was the one plausible casualty
      since the change blocks the hosts it asserts about (it reads script tags in
      the DOM, and `route.abort()` does not remove them)
- [x] `bash scripts/check-pr-scope.sh` — **PASSED**, no label needed
- [x] Reviewed the diff across correctness / maintainability / security / coverage
- [x] Opened the PR, unmerged

## Blocker hit mid-flight — handled in its own PR

- [x] The seed run surfaced a **new high advisory** that gates every PR:
      GHSA-jmr9-qjv8-65gv (`extract-zip` unvalidated symlink path traversal).
      Not caused by this branch — it reds #1268 and the whole queue too
- [x] Confirmed there is no upgrade to take: the advisory covers `extract-zip`
      at range `*`, 2.0.1 is the latest published version, and both `@lhci/cli`
      and `pa11y-ci` are already at their latest — `@lhci/cli@0.15.1` hard-pins
      `lighthouse` to exactly `12.6.1`. npm's `fixAvailable` is a multi-major
      *downgrade* that would break the perf and a11y gates
- [x] Filed the dated exception per the tooling's own design — PR
      [#1269](https://github.com/oviney/blog/pull/1269), `reviewBy: 2026-11-30`.
      Upstream already fixed it (`@puppeteer/browsers@3.2.0` swapped `extract-zip`
      for `modern-tar`), so the entry expires rather than lingering
- [ ] **#1269 must land before this PR can go green** — its Security Audit
      failure is inherited, not caused, here

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
