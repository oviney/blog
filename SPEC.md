# SPEC — BLOG-017: Intrinsic image dimensions + responsive sizing

**Stream:** GROWTH_DESIGN_BACKLOG · **Priority:** P1 · **Scope:** M · **Dependencies:** None
**Date:** 2026-06-14 · **Label:** `agent:creative-director`

---

## 1. Objective

Eliminate layout shift (CLS) caused by images that render with no reserved
space. Today `_includes/responsive-image.html` emits `<img>` markup with **no
intrinsic `width`/`height`**, so the browser cannot reserve a correctly-sized
layout box before the image loads. Every featured/card/hero image on the
homepage, topic pages, and articles is affected (the 2026-06-13 audit found all
18 inspected images lacked intrinsic dimensions).

Target users: all viney.ca readers (desktop + mobile). Success metric: improved
Core Web Vitals — CLS approaching 0 on image-bearing pages, no LCP regression.

## 2. Approach

Jekyll cannot read pixel dimensions natively, and `Gemfile`/`_config.yml` are
protected (no new plugin). Post images have **inconsistent** intrinsic sizes
(1792×1024, 1024×1024, 1200×675, 1455×943, 2460×1667, …), so dimensions must be
derived per-image rather than hardcoded.

1. `scripts/generate-image-dimensions.sh` uses `sips` to scan `assets/images/`
   and write a committed `_data/image_dimensions.yml` mapping each image path
   (the value used in front matter, e.g. `/assets/images/foo.png`) to its
   intrinsic `width` and `height`.
2. `_includes/responsive-image.html` looks up `site.data.image_dimensions` by
   `src` and emits `width="…" height="…"` when known. Unknown images degrade
   gracefully to current behaviour (no attributes).
3. The eager hero (`page.image`, rendered without `loading="lazy"`) also emits
   `fetchpriority="high"` for LCP. Card/featured images keep `loading="lazy"`.
4. CSS guarantees `height: auto` on these images so responsive scaling keeps the
   intrinsic aspect ratio (prevents distortion while the attributes reserve
   correctly-proportioned space).

## 3. Acceptance criteria

- [ ] **AC-1** Generated `<img>` markup includes intrinsic `width` and `height`
      for every image present in `_data/image_dimensions.yml`.
- [ ] **AC-2** Below-the-fold card/featured images remain `loading="lazy"`.
- [ ] **AC-3** The article hero image emits `fetchpriority="high"` and is not
      lazy-loaded.
- [ ] **AC-4** CSS `height: auto` is retained on these images so aspect ratios
      do not cause layout shift or distortion.
- [ ] **AC-5** WebP `<source>` + PNG fallback `<picture>` behaviour preserved.
- [ ] **AC-6** `bundle exec jekyll build` exits 0.
- [ ] **AC-7** No protected file touched (`_config.yml`, `Gemfile`,
      `Gemfile.lock`, `.github/CODEOWNERS`, `.github/copilot-instructions.md`).

## 4. Commands

```bash
bash scripts/generate-image-dimensions.sh   # regenerate the dimensions map
bundle exec jekyll build                     # AC-6
```

## 5. Project structure

```
scripts/generate-image-dimensions.sh   A  — sips-based generator
_data/image_dimensions.yml             A  — committed generated map
_includes/responsive-image.html        M  — emit width/height/fetchpriority
_sass/economist-theme.scss (or img CSS) M  — ensure height:auto (if not present)
```

## 6. Out of scope (this slice)

- Multi-width `srcset`/`sizes` responsive variants — needs N resized renditions
  of 28 source images; deferred to a follow-up so this slice stays atomic. AC
  wording is "where beneficial"; intrinsic dimensions are the CLS fix.
- Raster asset re-compression — that is BLOG-018.
- **Markdown-authored in-content charts** (`![](/assets/charts/*)`, 22 images):
  Kramdown renders these directly, bypassing the include, so they receive no
  dimensions from this fix. They are below-the-fold and their sizes are already
  in `_data/image_dimensions.yml`. Covering them needs a `_plugins/` render hook
  or per-post content edits — tracked as **BLOG-017b follow-up** to keep this
  slice atomic. Result: 146/168 built images (87%) now carry intrinsic
  dimensions, including every above-the-fold hero/card/LCP image.

## 7. Boundaries

- **Always:** keep the WebP/PNG fallback; commit the generated YAML (GitHub
  Pages CI does not run `sips`).
- **Never:** modify protected files; alter existing image URLs or front matter.
- **Ask first:** any change that would require regenerating or renaming image
  assets.
