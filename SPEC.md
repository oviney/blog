# SPEC — Tighten Navigation Tests (Issue #909)

**Status:** Draft  
**Issue:** [#909](https://github.com/oviney/blog/issues/909)  
**Label:** `agent:qa-gatekeeper`  
**Author:** Ouray Viney  
**Date:** 2026-05-02

---

## 1. Objective

Strengthen the Playwright navigation test suite so that broken navigation semantics — mislabeled taxonomy CTAs, wrong related-post recommendations, always-passing assertions — are caught before merge rather than after.

The current `tests/playwright-agents/navigation.spec.ts` contains multiple permanently-passing assertions (`|| true`, `toBeGreaterThanOrEqual(0)`, all-optional guard chains) that make the suite green even when the underlying UX is broken. This spec defines the precise changes needed to make the suite meaningful without introducing new flakiness.

**Target reader of this spec:** the `qa-gatekeeper` agent (and any human reviewer). This is a test-only change; no production code is modified.

---

## 2. Problem Analysis

### 2a. Permissive assertions to remove

| Location | Symptom | Line(s) |
|---|---|---|
| Primary navigation test | `|| true` nuclear option in URL acceptance block | ~46 |
| Keyboard accessibility test | `expect(successfulTabs).toBeGreaterThanOrEqual(0)` — 0 ≥ 0 always passes | ~185 |
| Navigation consistency test | Passes if 1 of 2 pages has any nav at all | ~200 |
| Related posts test | Only asserts `relatedCount > 0` and that a heading exists after navigation | ~120–145 |
| Category navigation test | URL check is `if (isCategoryPage)` — skipped rather than asserted | ~100 |

### 2b. Missing coverage areas

The post layout (`_layouts/post.html`) renders three recommendation/taxonomy sections that have **zero test coverage**:

| Section | Selector | Behaviour to assert |
|---|---|---|
| Section-line (rubric) | `.article-section-line .section-link` | Present, non-empty text, links to `/blog/` |
| Explore more tags | `.explore-more .topic-tag-link` | ≥1 tag present, each links somewhere, label matches a real category or tag |
| Related reading | `section.related-reading` | Rendered only when ≥2 related posts exist; each `.related-item` has a title, excerpt, date, and a category label matching the current post |
| More from section | `section.more-from-section` | Heading text contains the current post's category; articles in grid are not the current post |

---

## 3. Acceptance Criteria

- [ ] **AC-1** Remove `|| true` from the primary navigation URL check; replace with an assertion that the resulting URL contains `/blog` or `/posts`.
- [ ] **AC-2** The keyboard accessibility test must assert `successfulTabs >= 1`, not `>= 0`.
- [ ] **AC-3** Navigation consistency test must assert that **both** essential pages (`/` and `/blog/`) expose visible navigation with at least 3 links.
- [ ] **AC-4** Related posts test must assert that at least one `.related-item` displays a `.related-category` label matching the current post's category, not merely that a heading is visible.
- [ ] **AC-5** Category navigation test must assert the resulting URL, not guard it behind an optional `if`.
- [ ] **AC-6** New test: post-page section-line links to `/blog/` and its text matches a real category name.
- [ ] **AC-7** New test: "Explore more" block has ≥1 `.topic-tag-link` with non-empty text.
- [ ] **AC-8** New test: "Related reading" section (`.related-reading`) — when present — contains articles whose `.related-category` matches the current post's category.
- [ ] **AC-9** New test: "More from" section heading text contains a non-empty category name (not the literal string "Quality Engineering" as a hardcoded fallback — it must be dynamic).
- [ ] **AC-10** All strengthened and new tests pass against the running local dev server before merge.
- [ ] **AC-11** No new test dependencies are introduced (no new npm packages).

---

## 4. Tech Stack & Constraints

- **Test runner:** Playwright (TypeScript) — `npx playwright test`
- **Dev server:** `bundle exec jekyll serve --config _config.yml,_config_dev.yml` at `http://localhost:4000`
- **Test file to modify:** `tests/playwright-agents/navigation.spec.ts` (single file, no new files needed)
- **No production code changes.** If a test reveals a genuine site bug, file a separate issue.
- **No new npm packages.** Use only `@playwright/test` APIs already in use.
- **Preserve existing test IDs and describe-block structure.** Add new tests inside the existing `@navigation` describe block or as a new `@navigation Post-page Taxonomy` describe block.

---

## 5. Implementation Plan

### Phase 1 — Remove permissive assertions (safe, low risk)

1. **Primary navigation test** — delete the `isBlogPage` block with `|| true`; replace with:
   ```ts
   await expect(page).toHaveURL(/\/(blog|posts)/);
   ```
2. **Keyboard accessibility test** — change `toBeGreaterThanOrEqual(0)` to `toBeGreaterThanOrEqual(1)`.
3. **Navigation consistency test** — assert both pages and require ≥3 links each.
4. **Category navigation test** — remove the `if (isCategoryPage)` guard; assert the URL directly after click.
5. **Related posts test** — after navigating to a related post, verify `.related-category` text matches the origin post's category (`Quality Engineering` when starting from `/2025/12/31/testing-times/`).

### Phase 2 — Add taxonomy/recommendation coverage (new tests)

Add a new `describe` block `'@navigation Post-page Taxonomy & Recommendations'` with:

1. **Section-line CTA** — navigate to a known post, assert `.article-section-line .section-link` is visible, has non-empty text, and href ends with `/blog/`.
2. **Explore more tags** — assert `.explore-more .topic-tag-link` count ≥ 1 and each link has non-empty text content.
3. **Related reading semantics** — when `section.related-reading` is present, assert each `.related-category` text matches one of the current post's categories (read from `.article-section-line .section-link` text).
4. **More from section** — assert `section.more-from-section h2` contains non-empty text and does not match the current post's title; assert ≥1 article in `.more-from-grid`.

### Phase 3 — Verify

Run `npx playwright test tests/playwright-agents/navigation.spec.ts` against a live dev server and confirm all tests pass. Record output in PR description.

---

## 6. Code Style

- Follow the existing TypeScript style in the file (no semicolons at block level, `const` over `let`, `page.locator` over deprecated `$`).
- Use `aria-label` and role-based locators where the element has them; fall back to class selectors only for presentational structure (`.related-category`, `.topic-tag-link`).
- Use `test.skip` with a message (not silent returns) when a section is genuinely conditional (e.g. related reading only appears with ≥2 related posts).
- Do not add explanatory comments; name assertions clearly instead.

---

## 7. Boundaries

| Always do | Ask first | Never do |
|---|---|---|
| Modify `navigation.spec.ts` only | Add a second test file if the describe block exceeds ~250 lines | Modify production layouts, SCSS, or config files |
| Keep existing test names/structure intact | Adjust fixture post URL if it no longer exists | Introduce flakiness via `page.waitForTimeout` |
| Use the local dev server as the target | — | Hardcode expected category text as a literal string |
| File a separate issue for any real site bug found | — | Skip tests with `|| true` or equivalent |

---

## 8. Test Fixtures

| Fixture | URL | Why |
|---|---|---|
| Testing Times post | `/2025/12/31/testing-times/` | Category: Quality Engineering; known to have related posts |
| QA/QC post | `/2026/04/12/understanding-qa-qc-and-quality-engineering/` | Already used in suite; has hero image and internal links |
| Blog index | `/blog/` | Category landing; used for navigation consistency |
| Homepage | `/` | Entry point for primary navigation journey |
