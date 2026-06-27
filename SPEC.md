# SPEC — BLOG-019: Replace render-blocking Google Fonts CSS `@import`

**Stream:** GROWTH_DESIGN_BACKLOG · **Priority:** P2 · **Scope:** S · **Dependencies:** None
**Date:** 2026-06-26 · **Label:** `agent:creative-director` · **Issue:** #1084

---

## 1. Objective

`assets/css/styles.scss` discovers the web fonts (Merriweather + Inter) via a CSS
`@import`, so the browser cannot fetch them until `styles.css` has downloaded and
parsed — font discovery is serialised behind the stylesheet, delaying text
rendering. Move discovery to the document level with no typography change.

## 2. Approach

1. Remove the `@import url('…fonts.googleapis.com/css2?…')` from
   `assets/css/styles.scss`.
2. In `_layouts/default.html` `<head>`, before `styles.css`, add:
   - `<link rel="preconnect" href="https://fonts.googleapis.com">`
   - `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`
   - `<link rel="stylesheet" href="…css2?family=Merriweather:…&family=Inter:…&display=swap">`
3. Same families/weights as before → no typography change (BLOG-015 not a
   dependency). `$font-serif`/`$font-sans` fallback stacks are unchanged.
4. Individual font files are intentionally not preloaded (Google rotates its
   versioned gstatic URLs; preconnect is the safe warm-up). Full self-hosting is
   noted as a future privacy enhancement.

## 3. Acceptance criteria

- [x] **AC-1** Font `@import` removed from the compiled stylesheet
      (`_site/assets/css/styles.css` has no `@import`/`fonts.googleapis`).
- [x] **AC-2** Fonts loaded via optimised document-level links (preconnect +
      `<link>` in `<head>`, ahead of `styles.css`).
- [x] **AC-3** `font-display: swap` retained (readable text during load).
- [x] **AC-4** No over-preloading: preconnect only; no brittle per-file preload.
- [x] **AC-5** Fallback stacks retained ($font-serif / $font-sans unchanged);
      computed fonts still resolve to the Merriweather/Inter stacks; all six
      weights load; CLS = 0 (no swap regression).
- [x] **AC-6** No protected file touched; `bundle exec jekyll build` exits 0.

## 4. Commands

```bash
bundle exec jekyll build
grep -c 'fonts.googleapis\|@import' _site/assets/css/styles.css   # expect 0
# Real-browser: document.fonts shows Inter 400/600/700 + Merriweather 400/400i/700
# loaded; computed font-family = Merriweather stack; CLS = 0.
```
