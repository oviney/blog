# SPEC — Stop the blocking visual gate depending on third-party hosts

**Stream:** CI reliability · **Priority:** P1 · **Scope:** S (1 PR) · **Dependencies:** none
**Date:** 2026-08-12 · **Labels:** `agent:qa-gatekeeper` · **Issue:** [#1258](https://github.com/oviney/blog/issues/1258)
**Status:** implemented — PR open, blocked on #1269

---

## 1. Objective

`🖼️ Visual Regression` is a **required, blocking** status check. Today it can
fail because a third-party host is slow or unreachable from the GitHub runner,
which has nothing to do with the change under test. Make the gate depend only on
the local Jekyll server.

## 2. Problem

Observed on PR #1257, run
[31518679335](https://github.com/oviney/blog/actions/runs/31518679335):
**6 failed / 24 passed**, and the 6 were exactly the **2 post pages × 3
viewports** — every non-post page passed. The failure was not a pixel diff:

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:4000/2025/12/31/testing-times/", waiting until "load"
```

The job took **10.3 minutes** instead of ~2, because each failure burns
30 s × 3 attempts. A plain re-run passed.

### Mechanism

`visual-snapshot.spec.ts:134` calls `page.goto(path)` with Playwright's default
`waitUntil: 'load'`, which does not resolve until every subresource has settled.
`:145` then adds `waitForLoadState('networkidle')` on top. Post pages are the
only pages that load `https://giscus.app/client.js` (`_layouts/post.html:248`,
gated on `site.giscus`, which **is** configured in `_config.yml:134`). If giscus
is slow, `load` never fires inside the timeout.

Post pages are the worst case but not the only exposure. Measured on a local
build, the suite's pages request these external hosts:

```
giscus.app, github.githubassets.com          ← posts only
www.googletagmanager.com, plausible.io,
analytics.google.com, stats.g.doubleclick.net,
www.google.ca                                 ← every page
fonts.googleapis.com, fonts.gstatic.com       ← every page, RENDER-AFFECTING
```

## 3. Decisions

**D1 — Block third-party requests at the route layer, not by relaxing the wait.**
Switching `waitUntil` to `domcontentloaded` would not fix it: the following
`waitForLoadState('networkidle')` would still stall on the same host. Only
removing the dependency makes the gate deterministic.

**D2 — Block giscus and analytics. Do NOT block fonts.**
`_layouts/default.html:37` loads Merriweather/Inter from `fonts.googleapis.com`
as a render-blocking stylesheet. Blocking it changes glyph metrics and reflows
every page. Measured on `/2025/12/31/testing-times/` with `.post-comments`
hidden: **6602px with fonts → 6254px without**, a 348px reflow. Fonts stay.

This leaves the gate dependent on Google Fonts. That is a real, accepted
residual risk (§7), not an oversight — removing it means self-hosting the fonts,
which is a separate change with its own baseline churn.

**D3 — Analytics blocking is pixel-neutral and needs no re-baseline.**
Measured across **all 10 pages** in the suite, full-page screenshots with
analytics blocked are **byte-identical** to allow-all. Load time improves from
~1.2 s to ~0.8 s per page.

**D4 — Blocking giscus costs exactly 160px on post pages, and that is the
correct trade.** The `.post-comments` section measures 222px with the giscus
iframe and 62px without (just its `<h3>Discussion</h3>`). So **6 baselines must
be re-seeded** — 2 posts × 3 viewports. Worth it: the iframe's height is
third-party content that changes whenever anyone comments on GitHub
Discussions, so it was already an uncontrolled volatility source inside a
blocking gate.

**D5 — Keep `.post-comments` visible rather than hiding it as `volatile`.**
With giscus blocked the section is a stable 62px heading, which is our own
markup and worth covering. Hiding it would give up that coverage for no gain.

**D6 — Scope the route to `visual-snapshot.spec.ts`; do not put it in
`playwright.config.ts`.** 12 specs navigate to post pages and share the
exposure, but `analytics.spec.ts` asserts on analytics script tags. Those
assertions read the DOM rather than the network so they would survive a global
`route.abort()`, but a config-level block changes every spec's environment for a
gain this issue does not ask for. Follow-up, not this PR.

## 4. Acceptance criteria

1. No request leaves `localhost:4000` during a visual-snapshot run except to
   `fonts.googleapis.com` / `fonts.gstatic.com`.
2. The 24 non-post baselines are unchanged — no re-seed.
3. The 6 post baselines are re-seeded, and the diff contains **only** those 6.
4. Post-page navigation no longer waits on giscus: `goto` drops from ~2.0 s to
   ~0.9 s locally.
5. `npx playwright test visual-snapshot.spec.ts` passes on Linux.
6. The whole suite still passes — in particular `analytics.spec.ts`.

## 5. Out of scope

- The other three items in #1262 (`not-found` boundary, `search` and
  `category-security` flakes) — separate issue, separate PR.
- Self-hosting web fonts (§7).
- Applying the route globally in `playwright.config.ts` (D6).

## 6. Files

| File | Change |
|---|---|
| `tests/playwright-agents/visual-snapshot.spec.ts` | Add a third-party route block + document why fonts are exempt |
| `tests/playwright-agents/visual-snapshot.spec.ts-snapshots/post-*.png` | Re-seed 6 baselines (CI-generated) |

## 7. Residual risk

The gate still depends on Google Fonts being reachable. If `fonts.googleapis.com`
stalls, every page fails rather than just the two post pages — a louder,
easier-to-diagnose failure than today's, but still an outage. Self-hosting the
fonts would close it and is worth filing separately.

Re-seeding is itself a known-unreliable path: per #1262 a seed dispatch has
**twice** committed a wrong baseline for a page the branch never touched
(`not-found`, then `about`). The plan verifies the post-seed diff file-by-file
and restores anything outside the expected 6.
