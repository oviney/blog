# SPEC — Post-page Taxonomy & Recommendation UX Fix (Issue #906)

**Status:** Draft  
**Issue:** [#906](https://github.com/oviney/blog/issues/906)  
**Label:** `agent:creative-director`  
**Date:** 2026-05-03

---

## 1. Objective

Fix three routing/filtering bugs in `_layouts/post.html` so that post-page taxonomy CTAs and recommendation blocks behave correctly:

1. Category CTAs (section-line link, Explore-more category tags) route to topic landing pages where they exist.
2. "More from [Category]" block is filtered to the current post's category, not any 6 posts.

**No new pages, no new CSS, no new dependencies.** This is a Liquid template fix only.

---

## 2. Bug Map

| Element | Current | Correct |
|---|---|---|
| `.section-link` (section-line) | always `/blog/` | topic landing page if it exists, else `/blog/` |
| `.topic-tag-link` for categories | always `/blog/` | topic landing page if it exists, else `/blog/` |
| `.topic-tag-link` for post tags | `/blog/` | `/blog/` (no tag archives — acceptable) |
| `more-from-section` grid query | any 6 posts ≠ current | same-category posts ≠ current, up to 6 |
| `more-from-section` h2 label | `More from [category] →` | unchanged (label is now accurate once filtering is fixed) |

---

## 3. Category → URL mapping

Resolved at template render time via `site.pages | where: "title", cat | first`. Self-maintaining: adding a new category page automatically picks it up.

| Category | Landing page | URL |
|---|---|---|
| Software Engineering | `software-engineering.md` | `/software-engineering/` |
| Test Automation | `test-automation.md` | `/test-automation/` |
| Security | `security.md` | `/security/` |
| Quality Engineering | none | fallback `/blog/` |

---

## 4. Acceptance Criteria

- [ ] **AC-1** `.section-link` on a Software Engineering post links to `/software-engineering/`
- [ ] **AC-2** `.section-link` on a Quality Engineering post links to `/blog/` (no landing page)
- [ ] **AC-3** `.topic-tag-link` for a category in Explore-more links to the topic landing page
- [ ] **AC-4** `section.more-from-section` grid contains only posts sharing the current post's primary category
- [ ] **AC-5** `bundle exec jekyll build` succeeds
- [ ] **AC-6** `bash scripts/validate-posts.sh --all` exits 0
- [ ] **AC-7** Navigation tests cover the category CTA routing and more-from filtering

---

## 5. File under change

`_layouts/post.html` — one file, Liquid template changes only. No CSS, no JavaScript, no config.

---

## 6. Boundaries

| Always | Never |
|---|---|
| Preserve all existing CSS classes | Change class names used by Playwright tests |
| Preserve `related-reading` section (separate from more-from) | Modify `_config.yml`, `Gemfile`, SCSS |
| Use `site.pages | where: "title"` for URL lookup | Hardcode category → URL mappings |
| Fall back to `/blog/` when no landing page exists | Remove the Explore-more section |
