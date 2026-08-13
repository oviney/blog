---
name: pattern-main-content-has-escape
description: `.main-content:has(.wrapper)` width escapes also strip the layout's newsletter include, a sibling of the page wrapper — always check sibling alignment when a new escape is added
metadata:
  type: feedback
---

When a PR adds a new `.main-content:has(.some-wrapper) { max-width: 100%; padding: 0 }` escape, check what **else** lives inside `.main-content` on that page.

**Why:** `_layouts/default.html:104-107` puts `{{ content }}` *and* `{% include newsletter.html %}` inside `.main-content`. `.newsletter-signup` (`economist-theme.scss:1424`) declares no `max-width` and no auto margins — it inherits its width entirely from `.main-content`. So an escape written to widen the page wrapper also un-caps the newsletter, which then runs edge-to-edge while the wrapper stays centred at 1040px. The mismatch is easy to miss because the author measures the wrapper (`x`/`w` of the new component) and stops there.

**How to apply:**
- Measure the *sibling*, not just the wrapper: `getBoundingClientRect()` on `.main-content`, the page wrapper, and `.newsletter-signup` at desktop and mobile. Aligned means the newsletter's 32px padding box starts where the wrapper's content box starts.
- Note the state of play when judging severity: `/blog/` and post pages already render the newsletter full-bleed (their escapes predate the check), while `/about/` keeps it capped. So a new escape is a *page-level* regression even when the author can truthfully say "other pages already look like this."
- Extra tell: if the newly-escaped page also gains a `border-top: 3px solid $economist-red`, it will stack a second red rule ~100px above the newsletter's own identical red rule, at a different width. Two misaligned red rules is the visible symptom.
- Fix shape: scope the newsletter inside the escape — `> .newsletter-signup { max-width: 1040px; margin-left: auto; margin-right: auto; }`.
- Also verify the escape's `padding: 0` clobbering `@media (max-width: $bottom-nav-breakpoint) .main-content { padding-bottom: ... }` (specificity 0,2,0 beats 0,1,0). Measured result: harmless, because the site footer sits below `.main-content` and the fixed bottom nav overlaps the footer identically on pages that keep the padding.

Related: [[review-dead-css-deletion]]
