# SPEC — GH-1071: Eliminate mobile-nav reflow CLS on article pages

**Stream:** Core Web Vitals / perf · **Priority:** P1 (POOR CLS on mobile) · **Scope:** XS
**Date:** 2026-06-25 · **Label:** `agent:qa-gatekeeper`, `performance` · **Issue:** #1071

---

## 1. Objective

Article pages shifted **CLS 0.252 (POOR)** on mobile (390px), 0.143 on tablet,
0.011 on desktop. A single layout shift fires ~200ms into load: `main-content`
moves up ~245px. The fix must bring mobile article CLS to **GOOD (≤ 0.1)** with
no loss of navigation function and no desktop regression.

## 2. Root cause

`_layouts/default.html` renders `<nav class="site-nav">` desktop-first
(`display:flex`, full height on every viewport). The mobile collapse rule
`.js-nav-enabled .site-nav { display:none }` only activates once an inline script
at the **bottom of `<body>`** adds `js-nav-enabled`. That runs *after* first
paint, so on mobile the nav paints at ~245px and then collapses, reflowing
`main` upward — the entire CLS. (Confirmed not image-related: BLOG-017/017b hero
+ chart dims are correct.)

## 3. Approach

Set the JS-active marker **before first paint** so the mobile nav is collapsed
from the very first layout — no render-then-collapse window:

1. Add `<script>document.documentElement.classList.add('js-nav-enabled')</script>`
   in `<head>` (runs before `<body>` is parsed/painted).
2. Move the open/close toggle from `document.body` to `document.documentElement`
   so the existing `.js-nav-enabled.nav-open .site-nav` selector keeps matching
   (all nav selectors are element-agnostic; `<html>` is an ancestor of nav/toggle).
3. Remove the now-redundant body-tail `classList.add('js-nav-enabled')`.

Progressive enhancement preserved: without JS, no `js-nav-enabled` class is set,
so the nav stays visible and reachable.

## 4. Acceptance criteria

- [x] **AC-1** Mobile (390px) article CLS ≤ 0.1. Measured **0.2521 → 0.0000**
      (POOR → GOOD) on the same real-browser harness that reproduces the baseline
      (`isMobile:false`, width 390, `layout-shift` PerformanceObserver).
- [x] **AC-2** No desktop regression: desktop CLS 0.0112 (unchanged, GOOD).
- [x] **AC-3** Hamburger still works: nav hidden initially, opens on click
      (`aria-expanded=true`), closes on toggle/link — verified in real browser.
- [x] **AC-4** `bundle exec jekyll build` exits 0; head script present in output,
      body no longer adds the class.
- [x] **AC-5** No protected file touched (`_config.yml`, `Gemfile`,
      `Gemfile.lock`, `.github/CODEOWNERS`, `.github/copilot-instructions.md`).

## 5. Commands

```bash
bundle exec jekyll build                                   # AC-4
# Real-browser before/after (reproducing harness): isMobile:false, 390px,
# PerformanceObserver{type:'layout-shift',buffered:true}, sum !hadRecentInput
#   BEFORE: Mobile-390 CLS=0.2521 POOR   AFTER: Mobile-390 CLS=0.0000 GOOD
```
