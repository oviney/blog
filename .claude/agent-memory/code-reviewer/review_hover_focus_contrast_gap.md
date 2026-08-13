---
name: review-hover-focus-contrast-gap
description: pa11y-ci is a static-state gate — colour-inversion PRs must have their :hover/:focus-visible contrast computed by hand, because a green pa11y run proves nothing about them
metadata:
  type: feedback
---

A green `npx pa11y-ci` run is **not** evidence that a colour change clears WCAG AA. Compute `:hover` and `:focus-visible` contrast manually for every re-pointed colour.

**Why:** `.pa11yci.json` runs htmlcs + axe against the page in its resting state on `/` and `/blog/` only. Neither runner drives hover, and neither is a PR gate anyway (`test-quality.yml` runs pa11y nightly). So a PR that inverts a band from dark to light can clear pa11y while its hover state fails 1.4.3 — WCAG has no exemption for transient states. The repo has already been bitten by the static version of this ($h26-faint at 3.71:1 failing on 14 elements), so authors tend to cite the pa11y pass as if it covered everything.

**How to apply:**
- Brand red `#E3120B` is the recurring trap: **4.82:1 on `#ffffff` (passes) but 4.20:1 on `$h26-band` `#f2efea` (fails)**. Any red text moved onto a tinted ground needs re-checking.
- Idiomatic fix already used in the theme (`.newsletter-button:hover`): `color.adjust($economist-red, $lightness: -10%)` → `#B20E09`, 6.19:1 on the band, 7.10:1 on white. Requires `@use 'sass:color'` in the consuming file.
- Compute ratios yourself rather than trusting the PR description; a one-off python WCAG relative-luminance snippet is faster than arguing.

Related: [[review-scoped-link-reset]]
