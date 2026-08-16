# PLAN — Anchor the masthead to a single site grid

Spec: [`SPEC.md`](../SPEC.md) · Branch: `fix/masthead-grid-alignment`

Six slices. Each is independently verifiable; slices 1–2 are the whole
behavioural change and slices 3–6 are proof and cleanup.

---

## Slice 1 — Write the guard first, prove it fails

Add the axis assertion to `tests/playwright-agents/responsive.spec.ts` before
touching any SCSS, and run it against the current build.

The expected grid edge is computed, not hardcoded: `(viewport − 1040) / 2 + 32`,
clamped so it degrades to the plain gutter below the breakpoint. Asserting a
literal `232` would pass for the wrong reason at any other viewport.

**Verify (slice 1):** the guard fails on all six page types, at both viewports, on the
masthead assertion — by 62px each time, which is the SPEC §2 delta. `/about/`
fails too: its *content* is aligned with the masthead today, but both sit at
294 rather than on the 1040 grid at 232, and D1 anchors the masthead to the
grid rather than to any page's measure. A failure with a delta other than 62px
means the guard is wrong, not the theme.

**Result:** 12/12 failed, all reporting 62px. ✅

## Slice 2 — Token + masthead + nav

1. Add `$grid-max-width: 1040px` beside the existing width tokens.
2. `.site-title` — `max-width: $grid-max-width`; keep `padding-left: $spacing-md`,
   add `@media (min-width: 768px) { padding-left: $spacing-lg }`.
3. `.site-nav ul` — `max-width: $grid-max-width`; keep `padding: 0 $spacing-md`,
   add `@media (min-width: 768px) { padding: 0 $spacing-xs }`.

The nav's `$spacing-xs` is not arbitrary: each nav link carries its own
`padding-left: $spacing-md`, so the list needs `$spacing-lg − $spacing-md` =
`$spacing-xs` for the *link text* to land on the grid rather than the list box.

**Verify:** guard passes on every page except `/blog/`, which slice 3 fixes.

**Result:** as predicted. ✅

## Slice 3 — Normalize the `/blog/` gutter

`.econ-topic-page` — `padding: $spacing-xl 0` → `$spacing-xl $spacing-lg`, and
`max-width: 1040px` → `$grid-max-width`.

**Verify:** guard fully green. `/blog/` content text at 232. Gap E still passes
(the wrapper's border-box stays 1040px; only its content box narrows).

**Result:** 18/18 green. Cards land at 293px, above the 280px floor. A
`max-width: 1024px` override that already set this exact padding turned out to
be the tell for the original bug — /blog/ had a 32px gutter on tablet and none
above 1024px. Removed as redundant. ✅

## Slice 4 — Retire the remaining 1040 literals

`.topic-page` and `home-2026.scss`'s `$h26-max` point at `theme.$grid-max-width`.
Pure substitution — zero rendered change.

**Verify:** `grep -n '1040px' _sass/` returns only the token definition. Rebuild
and re-measure: every number identical to slice 3.

**Result:** only the token and explanatory comments remain. ✅

## Slice 5 — Full gate run

Build, `homepage.spec.ts`, `responsive.spec.ts`, `pa11y-ci`, 390px overflow
check, and a mobile geometry diff against `main` to prove D5 held.

**Result:** build clean; 594 passed / 9 skipped / 0 failed across the whole
suite excluding pixel baselines; pa11y 0 errors; no overflow at 320 or 390.
D5 came out stronger than a geometry diff — every Mobile and Tablet visual
baseline passes untouched, so small-screen rendering is identical at the pixel
level, not merely at the box level. ✅

One false alarm worth recording: the first full run also failed `about` on
Tablet. It reproduced neither with the change stashed nor with it re-applied,
and the page's box geometry at 768px is byte-identical either way — a flake
under parallel load while `jekyll serve` was mid-rebuild, not a regression.
Re-run clean.

## Slice 6 — Baselines and ship

Visual baselines move on 10 Desktop pages — homepage, blog index, two posts,
about, three categories, search, 404. Tablet and Mobile do not move at all.
Refresh **in CI** by dispatching `test-quality.yml` with `update_snapshots=true`
on this branch, inspect the diff rather than accepting it wholesale, then open
the PR.

---

## Risks

| Risk | Mitigation |
|---|---|
| Baseline seed clobbers unrelated snapshots — happened on 2 of 2 prior dispatches (#1262) | Inspect every changed PNG in the refresh commit; reject and re-dispatch rather than accept a mixed diff |
| Nav wraps or overflows once its gutter shrinks to 8px above 768px | The list is `flex-wrap: wrap` and the change *widens* available room; verified at 768/1024/1440/1920 |
| `/blog/` cards narrow by 64px and drop below the 280px Gap E floor | 3-column grid at 976px content → ~300px cards; asserted, not assumed |
| Guard passes for the wrong reason at one viewport | Grid edge computed from viewport width, checked at more than one width |
| Scope creep into `.main-content`'s gutter | Explicitly out of scope in SPEC §4 with the reason recorded |
