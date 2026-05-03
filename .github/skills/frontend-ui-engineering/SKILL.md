---
name: frontend-ui-engineering
description: Builds polished, accessible UI for the viney.ca Jekyll site. Use when changing layouts, includes, SCSS, responsive behavior, or browser-side interactions.
version: 1.0.1
triggers:
  - Changing layouts, SCSS, or browser-side interactions
  - Implementing responsive UI adjustments
  - Fixing presentation or interaction issues on the site
---

# Frontend UI Engineering

## Overview

Build UI that feels deliberate, accessible, and unmistakably aligned with the site's Economist-inspired design system. In this repo, production-quality frontend work means matching existing Jekyll and SCSS patterns, using the shared design tokens, and verifying the rendered result at real breakpoints.

## When to Use

- Building or revising pages, layouts, includes, or interactive browser behavior
- Implementing responsive adjustments across mobile, tablet, and desktop
- Fixing spacing, typography, navigation, search, or content presentation issues
- Improving UX, semantics, or accessibility in user-facing surfaces

## Build on Local Patterns

Before editing UI, read:

- `_sass/economist-theme.scss` for tokens and established selectors
- the nearest `_layouts/` or `_includes/` example already solving a similar problem
- `CLAUDE.md` and any relevant instructions for scope and validation

## UI Rules for This Repo

### Design System First

- use variables and shared patterns from `_sass/economist-theme.scss`
- keep serif content and sans-serif UI hierarchy intact
- use Economist red sparingly as an accent, not a blanket theme color
- avoid introducing a new aesthetic, framework, or component pattern unless the issue requires it

### Structure First

Prefer semantic HTML, predictable Liquid structure, and shallow selector depth. If a layout can be solved with cleaner markup instead of more CSS complexity, do that first.

### Responsive by Default

Check mobile first, then 768 px, 1024 px, and desktop-wide states. Navigation, cards, metadata, and long headlines are common breakpoints where regressions appear.

### Accessibility Is Part of the UI

Keyboard flow, landmark structure, heading order, focus visibility, touch targets, and contrast are implementation requirements, not optional polish.

## Verification Workflow

Use the repo's real commands:

```bash
bundle exec jekyll build
bundle exec jekyll serve --config _config.yml,_config_dev.yml
npm run test:playwright
npm run test:a11y
npm run test:lighthouse
```

Run the smallest complete set that matches the change, but never skip the build.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "I can hardcode this one value" | The design system only stays coherent if values come from shared tokens. |
| "It looks fine on desktop" | This repo explicitly cares about mobile and tablet breakpoints. |
| "Accessibility can wait for QA" | Missing semantics and focus behavior are frontend bugs, not post-processing. |
| "A little extra JS is easier than fixing the markup" | Extra browser logic increases maintenance and often hides the real layout problem. |

## Red Flags

- Hardcoded colours, spacing, or typography where tokens already exist
- Deeply nested selectors or layout-specific class hacks
- Responsive work checked at only one viewport
- UI changes shipped without live browser inspection
- Visual fixes that weaken semantics or keyboard usability

## Verification

After frontend work:

- [ ] `bundle exec jekyll build` passed
- [ ] The affected page or component was checked in the browser
- [ ] Breakpoints were reviewed at the required widths
- [ ] Relevant existing QA commands were rerun
- [ ] The change still matches the local design system and accessibility expectations

## Related Files

- [`../../../_sass/economist-theme.scss`](../../../_sass/economist-theme.scss) — design tokens and core patterns
- [`../browser-testing-with-devtools/SKILL.md`](../browser-testing-with-devtools/SKILL.md) — live browser verification workflow
- [`../economist-theme/SKILL.md`](../economist-theme/SKILL.md) — repo-specific visual language guidance
- [`../../../CLAUDE.md`](../../../CLAUDE.md) — repo guardrails and commands
