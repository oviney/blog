# SPEC — Anchor the masthead to a single site grid

**Stream:** homepage 2026 · **Priority:** P2 · **Scope:** S (1 PR) · **Dependencies:** none
**Date:** 2026-08-15 · **Labels:** `agent:creative-director` · **Issue:** none — reported directly by the owner
**Status:** implemented; awaiting CI baseline refresh

---

## 1. Objective

The masthead (`.site-title`) and primary nav (`.site-nav ul`) carry their own
hardcoded `max-width: 900px`. Every content wrapper on the site sets its width
independently. The two have never been connected, so the masthead lines up with
the content column on exactly one page type — `/about/` — and is off by between
−83px and +94px everywhere else.

PR #1260 made this visible on `/`. It widened the home page's content column to
1040px via a `.main-content:has(.home-2026)` escape, but `_sass/economist-theme.scss`
was declared out of scope by that cycle's SPEC §4, so the masthead could not
follow. The result is three stacked widths down the page — masthead 900,
content 1040, footer 1200.

Give the masthead a single grid to sit on, and make the 1040px wrappers agree
with each other so that grid is actually one grid.

**Success criteria** (measured at 1440×1000 unless noted)

| | Now | Target |
|---|---|---|
| Masthead text left edge, all page types | 294 | 232 |
| Nav first-item text left edge, all page types | 318 | 232 |
| `/blog/` content text left edge | 200 | 232 |
| `/`, `/security/`, `/search/` content text left edge | 232 | 232 (unchanged) |
| Page types where masthead is flush with the content column | 1 of 6 | 4 of 6 (see D2) |
| Hardcoded `1040px` literals in SCSS | 3 | 0 — one `$grid-max-width` token |
| Guard asserting masthead shares the content axis | none | `responsive.spec.ts` |
| pa11y WCAG2AA errors | 0 | 0 (unchanged) |
| `homepage.spec.ts`, `responsive.spec.ts` | green | green |

---

## 2. Evidence

Measured against a local `jekyll serve` build of `main` (dd91413) at 1440×1000,
comparing the left edge of the red logo block against the left edge of the
content text on each page type:

| Page | Content wrapper | Content text left | Masthead left | Delta |
|---|---|---|---|---|
| `/about/` | `.main-content` 900px | 294 | 294 | **0** |
| `/` | `.home-2026` 1040px | 232 | 294 | +62 |
| `/security/` | `.topic-page` 1040px | 232 | 294 | +62 |
| `/search/` | `.topic-page` 1040px | 232 | 294 | +62 |
| `/blog/` | `.econ-topic-page` 1040px | 200 | 294 | +94 |
| post | `.economist-article` 750px | 377 | 294 | −83 |

Confirmed in source:

| Fact | Location |
|---|---|
| Masthead width is hardcoded and unrelated to any content wrapper | `_sass/economist-theme.scss:91` — `.site-title { max-width: 900px }` |
| Same for the nav | `_sass/economist-theme.scss:125` — `.site-nav ul { max-width: 900px }` |
| `/blog/` uses zero side padding | `_sass/economist-theme.scss:1718` — `.econ-topic-page { padding: $spacing-xl 0 }` |
| Every other 1040px listing uses 32px | `_sass/economist-theme.scss:1793` — `.topic-page { padding: $spacing-xl $spacing-lg }` |
| Posts are 750px, not 900 | `_sass/economist-theme.scss:327` — `.economist-article { max-width: $content-max-width }` (`$content-max-width: 750px`) |
| No token for 1040 exists | `_sass/economist-theme.scss:28–29` — only `$content-max-width: 750px` and `$wide-max-width: 1200px` |

**Why no gate caught it.** `responsive.spec.ts` "Gap E" asserts the content
wrapper is ≈1040px wide; nothing asserts the masthead shares an axis with it.
pa11y measures contrast and semantics, not alignment. And #1260 re-seeded the
visual baselines, which recorded the misalignment as the expected state — a
pixel gate cannot flag a regression it was taught to expect.

---

## 3. Decisions

**D1 — One grid, not per-page tracking.** The masthead anchors to a single
1040px grid on every page rather than tracking each page's own wrapper width.
Tracking would be flush everywhere, but the logo would visibly jump between
x=200 (`/blog/`), x=232 (listings), x=294 (`/about/`) and x=377 (posts) as the
reader navigates. A masthead belongs to the site, not the article; anchoring it
to the page grid is standard practice and is what the surrounding footer
(1200px, constant) already does.

**D2 — Narrow reading measures stay inset, and that is not a defect.**
`/about/` (900px) and posts (750px) keep their reading measures centred inside
the grid, so the masthead sits outboard of their text by 62px and 145px. This
is deliberate: those measures are chosen for line length, not for alignment.
The success criterion is therefore "4 of 6 flush", not 6 of 6.

**D3 — Normalize `.econ-topic-page` to a 32px gutter.** `/blog/` and
`/security/` are both 1040px listings whose text starts 32px apart. Without
this, the grid the masthead anchors to would not exist as a single axis and the
guard would need a per-page exception. Owner-approved as part of this change
rather than deferred, because the guard depends on it.

This turned out to be smaller than it looked. A `@media (max-width: 1024px)`
block already set `.econ-topic-page` to `$spacing-xl $spacing-lg`, so `/blog/`
had a 32px gutter on tablet and none at all above 1024px — a discontinuity
nothing intended. Moving that value to the base declaration makes the page
consistent with itself, and leaves the tablet override restating the base
verbatim, so it is removed.

**D4 — Introduce `$grid-max-width: 1040px` and single-source it.** 1040 is
currently written out in three places (`.topic-page`, `.econ-topic-page`,
`$h26-max` in `home-2026.scss`). The repo convention is variables-only. A
single token is what makes "one grid" enforceable rather than a coincidence
that four selectors currently share a number.

**D5 — Preserve small-screen rendering exactly.** The new gutter applies at
`min-width: 768px`, mirroring the idiom `.economist-article` already uses.
In practice the mobile header rules (which zero the gutter and are declared
later in the file) still win at exactly 768px, so the masthead switches to the
grid at 769px — the same boundary `.home-2026`'s own `max-width: 48em` rule
uses. Verified by pixels rather than by reading the cascade: every Mobile and
Tablet visual baseline passes unchanged, and only the 10 Desktop baselines
move.

**D6 — `_layouts/default.html` stays untouched.** The fix is entirely a width
and gutter question; no markup change is required. #1260's out-of-scope call on
the layout still stands.

---

## 4. Scope

**In scope**

- `_sass/economist-theme.scss` — `$grid-max-width` token; `.site-title` and
  `.site-nav ul` widths and gutters; `.topic-page` and `.econ-topic-page`
  max-width via the token; `.econ-topic-page` gutter.
- `_sass/home-2026.scss` — point `$h26-max` at the token.
- `tests/playwright-agents/responsive.spec.ts` — the missing axis guard.
- Visual baselines — refreshed **in CI**, never locally.

**Out of scope**

- `_layouts/default.html` (D6)
- `.main-content`'s own 24px gutter. Between 768px and ~948px viewport widths
  this leaves `/about/` 8px inboard of the masthead. Known, cosmetic, and
  fixing it would move `/about/` — the one page that is correct today — for no
  gain at the widths that matter.
- Any protected file.
- The `/decisions/` URL, which renders a repo document with no layout and no
  masthead at all. Pre-existing and unrelated.

---

## 5. Verification

| # | Check | Result |
|---|---|---|
| 1 | `bundle exec jekyll build` | clean |
| 2 | Guard fails **before** the fix — written first, run against the unmodified build | 12/12 failed, every one reporting the 62px delta from §2 |
| 3 | Guard passes after | 18/18 at 1024 / 1440 / 1920 |
| 4 | Measured geometry at 1440 | masthead 232, nav 232, `/blog/` content 232; 4 of 6 page types flush, `/about/` and posts inset per D2 |
| 5 | Full Playwright suite (excl. pixel baselines) | 594 passed, 9 skipped, 0 failed |
| 6 | `pa11y-ci` WCAG2AA | 0 errors |
| 7 | Horizontal overflow at 320 / 390 | none |
| 8 | Mobile + Tablet visual baselines | all pass unchanged (D5) |
| 9 | Desktop visual baselines | 10 move — the intended blast radius |
| 10 | `grep 1040` in `_sass/` | comments only; one token |

**Note on step 2.** The guard was written and failed first on purpose. #1260
re-seeded the visual baselines in the same PR that introduced the
misalignment, which recorded the defect as the expected state — so "the pixel
gate is green" carried no information. A geometric assertion proven to fail
before the fix is the only evidence that the guard can detect this class of
regression at all.

**Outstanding:** visual baselines refreshed in CI via the `test-quality.yml`
seed dispatch and **inspected** — that path has clobbered unrelated baselines
on 2 of 2 prior dispatches (#1262), so the refresh commit gets read, not
rubber-stamped.
