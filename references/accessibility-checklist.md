# Accessibility Checklist

Quick reference for accessibility review on oviney/blog. Use alongside `jekyll-qa`, `economist-theme`, and `code-review-and-quality`.

## Core Checks

- [ ] One clear `<h1>` per page and sensible heading order
- [ ] Landmarks exist for navigation, main content, and footer where appropriate
- [ ] Images have useful `alt` text or `alt=""` when decorative
- [ ] Links and buttons have descriptive accessible names
- [ ] Keyboard focus is visible and logical
- [ ] Touch targets are at least 44 × 44 px on mobile
- [ ] Color is not the only cue for state or meaning
- [ ] Contrast meets WCAG AA expectations

## Forms and Search

- [ ] Inputs have visible labels or accurate `aria-label` values
- [ ] Required fields and errors are conveyed in text, not color alone
- [ ] Search and filter controls remain usable by keyboard and screen reader
- [ ] Validation or empty-state messaging is announced clearly

## Content Structure

- [ ] Article cards and post pages read sensibly in source order
- [ ] Metadata remains understandable when styles are removed
- [ ] Link text still makes sense out of context
- [ ] Embedded media has an accessible fallback or description

## Verification Path

```bash
bundle exec jekyll build
bundle exec jekyll serve --config _config.yml,_config_dev.yml
npm run test:a11y
npm run test:playwright
```

Build first if the page structure changed, then start the local server before running browser-based checks. Use Playwright role-based assertions for targeted regressions and the accessibility script for the repo-wide baseline.

## Common Anti-Patterns

| Anti-pattern | Why it hurts | Better move |
|---|---|---|
| Icon-only control without label | invisible to screen readers | add accessible name |
| Clickable `div` | weak keyboard semantics | use button or link |
| Color-only emphasis | excludes some users | add text, icon, or structure |
| Removed focus outline | keyboard users lose location | style focus, do not remove it |
| Dense nav on mobile | hard to tap and scan | preserve spacing and target size |
