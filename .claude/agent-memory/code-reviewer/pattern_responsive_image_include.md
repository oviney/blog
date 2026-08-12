---
name: responsive-image-include
description: New page/layout templates often emit raw <img src> instead of the responsive-image.html include, shipping multi-MB PNGs instead of WebP
metadata:
  type: feedback
---

When reviewing new or copied page templates / layouts that render post or hero images, check they route through `{% include responsive-image.html src=... alt=... %}` rather than a bare `<img src="{{ ... }}">`. The bare form bypasses the WebP `<source>` and the intrinsic width/height (CLS) handling, shipping multi-MB raw PNGs.

**Why:** The include is the established precedent (used by `index.md`, `blog/index.html`, `_layouts/post.html`). Page templates authored independently (category/topic pages) drift back to raw `<img>` and silently regress page weight.

**How to apply:** grep the diff for `<img src` in `.md`/`.html` page bodies; confirm a `.webp` sibling exists under `assets/images/` so the WebP `<source>` resolves; confirm the container CSS sizes the descendant `img` (e.g. `width:100%; object-fit:cover`) so the include's added intrinsic width/height attrs don't overflow. Related: [[verify-defect-exists]].
