# TODO — Issues #904 / #905: Internal Link Validator Quality

## Phase 1 — Design
- [x] **T1** Verify registry algorithm: Python prototype confirms 24/25 posts found; `--` → `-` normalization required for `2026-04-04-the-real-cost-of-test-automation--balancing-speed-and-sustai.md`

## Phase 2 — Implementation
- [ ] **T2** Update `scripts/content-review.js`:
  - Add `buildPostRegistry()` (\_site/ primary, front-matter fallback)
  - Replace `countInternalLinks()` with `classifyInternalLinks(body, registry)` returning `{canonical, broken, brokenUrls}`
  - Update section 7 scoring: canonical links earn credit; broken links generate an issue
  - Pass registry to `scorePost()` as 4th param
  - Update return object: `internalLinks → canonical count`, add `brokenInternalLinks`
  - Update header comment
- [ ] **T3** Update `scripts/validate-posts.sh`:
  - Build POST_REGISTRY once before the per-post loop (Python one-liner)
  - Add check 2c in per-post loop: ERROR if any `/20xx/` body link not in registry
  - Update header comment
- [ ] **CHECKPOINT A** `validate-posts.sh --all` PASSED · `content-review.js` 24/24 at 100/100 · `jekyll build` clean

## Phase 3 — Docs + close
- [ ] **T4** Update `.github/skills/jekyll-qa/SKILL.md`; close #904 (verified clean) and #905 (fixed)
