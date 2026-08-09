---
name: visual-gate-blind-spots
description: What the 30-capture Playwright visual-snapshot gate does NOT cover — pages, viewport bands, hidden selectors — measured 2026-08-02 against PR #1203
metadata:
  type: reference
---

The blocking pixel gate (`tests/playwright-agents/visual-snapshot.spec.ts`) is
10 pages x 3 viewports = 30 captures. "🖼️ Visual Regression 30/30" is a much
weaker signal than it reads as. Measured blind spots:

**Viewport bands.** The three projects are Mobile 320x568, Tablet 768x1024,
Desktop 1920x1080. So:
- `≤600px` rules ARE exercised (Mobile is 320).
- `769–1024px` rules are exercised by **nothing** — 768 falls below 769 and the
  next project is 1920. Any `min-width: 769px` / `max-width: 1024px` band rule
  has zero pixel coverage. (`bottom-nav.spec.ts` and `responsive.spec.ts` do use
  1024x768, but as assertions, not snapshots.)
- `1025–1919px` likewise has no pixel coverage.

**Viewport-pinned pages.** 4 of the 10 pages carry `listing: true`
(`blog-index`, and the three category pages), so they capture at viewport
height, not full page — 12 of the 30 captures. Measured share of the page
falling outside the capture: 45%–95%. Worst case `/test-automation/` at
320x568 (12,429px tall, 95% uncovered); still 78% uncovered at 1920x1080.
Footer, newsletter CTA and pagination controls on those four pages are never
pixel-diffed.

**Hidden-before-capture content.** `volatile` selectors are `display: none`-ed
before the shot. On the homepage `.h26-news` removes 29–31% of the page at every
viewport — the whole lead story and rail. Post pages hide `.related-list` and
`.more-from-section`. Listing pages mask `.topic-grid`, so card interiors are
never diffed.

**Pages with zero pixel coverage at all** (they exist in the build and are
served): `/blog/page2/`–`/blog/page5/` (which do carry live theme markup),
`/dashboard/index.html`, `/dashboard/agents.html`, the two `/review/*` preview
pages, and 23 of the 25 posts.

**States with no coverage:** every `:hover`/`:focus`/`:active` rule (screenshots
capture none), `/search/` with an actual query (results render client-side into
a separate container; only the empty page is baselined), and the mobile nav in
its open state. Print media is the exception — it *is* covered, by
`interactive-elements.spec.ts` via `page.emulateMedia({ media: 'print' })`.

**How to apply:** when asked whether CI green is enough for a CSS/layout change,
check whether the change lands in one of these holes before answering. A theme
change confined to a `769–1024px` band, a hover state, a listing page's
below-the-fold region, or `.h26-news` can go green on all 30 captures while
being visibly broken. See [[local-visual-verification-trap]] for how to render
locally without fooling yourself.
