---
name: review-scoped-link-reset
description: When a PR resets the theme's global `a { border-bottom }` inside a scoped component, enumerate every anchor in that component's markup and confirm each keeps a non-colour affordance
metadata:
  type: feedback
---

Any PR that adds `border-bottom: none` (or `text-decoration: none`) to a scoped `a` reset must be reviewed by **enumerating every `<a>` in the component's markup**, not by eyeballing the SCSS.

**Why:** `economist-theme.scss:297` gives every anchor `border-bottom: 1px solid $economist-red`. That border is frequently the *only* affordance a link has, because the component's own rules set `text-decoration: none`. Killing it globally inside a component silently converts some links into plain text. The failure is invisible in the SCSS diff — the removed declaration is in a different file from the link that depended on it — and invisible to `pa11y-ci`, which flags contrast, not affordance.

**How to apply:**
- List each anchor in the template, then for each one check whether a *later, higher-specificity* rule re-applies a border, underline, block-card border, or heading context.
- The dangerous case is a link whose computed style equals the surrounding body copy. Prove it: `getComputedStyle` the link and the neighbouring `<p>` and compare `color` + `borderBottomWidth` + `textDecorationLine`. Identical values = WCAG 1.4.1 failure (colour-only, and here not even colour).
- Colour + a glyph (`→`) is a weak but usually acceptable pass; colour alone is not.
- Underlines re-applied "per component where they are wanted" is the intent statement, not the evidence. Check the list is complete.

Related: [[review-legacy-class-retention]], [[review-hover-focus-contrast-gap]]
