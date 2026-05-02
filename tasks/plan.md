# Plan — Issue #909: Tighten Navigation Tests

**Spec:** [SPEC.md](../SPEC.md)  
**File under change:** `tests/playwright-agents/navigation.spec.ts`  
**Date:** 2026-05-02

---

## Dependency Graph

```
T1 ──┐
T2 ──┤
T3 ──┼──► CHECKPOINT-A ──► T6 ──┐
T4 ──┤                    T7 ──┤
T5 ──┘                    T8 ──┤
                          T9 ──┴──► CHECKPOINT-B ──► T10
```

- **T1–T5** are independent of each other (each targets a different test function).
- **T6–T9** are independent of each other and of T1–T5 (all are new tests in a new describe block).
- **T10** (full suite run) depends on everything preceding it.
- No task requires another to be merged first; all can be implemented sequentially in one PR.

---

## Phase 1 — Remove permissive assertions

Each task in this phase targets a single test function. Run only that test after each change to verify.

### T1 — Primary navigation: remove `|| true`

**File:** `tests/playwright-agents/navigation.spec.ts`  
**Test:** `Primary navigation journey: Homepage → Blog → Article → Back` (line 13)  
**What:** Delete the entire `isBlogPage` const and `expect(isBlogPage).toBeTruthy()` block (~lines 40–52). Replace with `await expect(page).toHaveURL(/\/(blog|posts)/);` immediately after `await page.waitForLoadState('networkidle')`.

**AC:** AC-1  
**Verify:** `npx playwright test navigation.spec.ts --grep "Primary navigation journey"` passes.

---

### T2 — Keyboard accessibility: require ≥1 successful tab

**File:** `tests/playwright-agents/navigation.spec.ts`  
**Test:** `Main navigation accessibility and keyboard support` (line 265)  
**What:** Change `expect(successfulTabs).toBeGreaterThanOrEqual(0)` to `expect(successfulTabs).toBeGreaterThanOrEqual(1)`. Also change `expect(currentUrl.length).toBeGreaterThan(10)` (the Enter-key check) to `await expect(page).toHaveURL(/localhost/)` — verifies a real navigation happened, not just that any URL string exists.

**AC:** AC-2  
**Verify:** `npx playwright test navigation.spec.ts --grep "keyboard support"` passes.

---

### T3 — Navigation consistency: assert both pages + ≥3 links

**File:** `tests/playwright-agents/navigation.spec.ts`  
**Test:** `Navigation consistency across pages` (line 321)  
**What:** Remove the `successfulPages >= 1` pass condition. Rewrite the loop body so that for each of the two essential pages (`/` and `/blog/`), the test hard-asserts `await expect(navigation.first()).toBeVisible()` and `expect(linkCount).toBeGreaterThanOrEqual(3)`. Remove the surrounding `try/catch` that swallows failures.

**AC:** AC-3  
**Verify:** `npx playwright test navigation.spec.ts --grep "Navigation consistency"` passes.

---

### T4 — Related posts: assert category label matches origin post

**File:** `tests/playwright-agents/navigation.spec.ts`  
**Test:** `Related posts navigation` (line 173)  
**What:** The test navigates to `/2025/12/31/testing-times/` (category: `Quality Engineering`). After clicking a related link and landing on a new post page, add:
```ts
const relatedCategory = page.locator('.related-category').first();
await expect(relatedCategory).toBeVisible();
await expect(relatedCategory).toContainText('Quality Engineering');
```
Remove the multi-level try/catch "nuclear healing" fallback chain; replace with a single `try/catch` that calls `test.fail()` with a descriptive message if navigation fails.

**AC:** AC-4  
**Verify:** `npx playwright test navigation.spec.ts --grep "Related posts navigation"` passes.

---

### T5 — Category navigation: hard-assert URL after click

**File:** `tests/playwright-agents/navigation.spec.ts`  
**Test:** `Category navigation flow` (line 111)  
**What:** Remove the `if (isCategoryPage && await heading.count() > 0)` guard. After `await page.waitForLoadState('networkidle')`, assert:
```ts
await expect(page).toHaveURL(/\/(blog|tag|category|software-engineering|test-automation|security|quality-engineering)/i);
await expect(page.locator('h1, .page-title').first()).toBeVisible();
```
If no category link is found on the homepage, use `test.skip()` with a descriptive message (not a silent `console.log`).

**AC:** AC-5  
**Verify:** `npx playwright test navigation.spec.ts --grep "Category navigation"` passes.

---

### CHECKPOINT A

After T1–T5 are implemented:
- Run full navigation suite: `npx playwright test tests/playwright-agents/navigation.spec.ts`
- All existing tests (desktop + mobile) must still pass.
- If any fail, diagnose and fix before proceeding to Phase 2.

---

## Phase 2 — New taxonomy/recommendation coverage

Add a new describe block immediately after the main `@navigation` block and before the `@navigation Mobile` block:

```ts
test.describe('@navigation Post-page Taxonomy & Recommendations', () => { ... })
```

All four tests use `/2025/12/31/testing-times/` as the fixture post (category: `Quality Engineering`, known to have ≥2 related posts).

### T6 — Section-line CTA links to /blog/ with category text

**What:** Navigate to fixture post. Assert `.article-section-line .section-link`:
- Is visible
- Has non-empty text content
- `href` attribute ends with `/blog/`

**AC:** AC-6  
**Verify:** `npx playwright test navigation.spec.ts --grep "section-line"` passes.

---

### T7 — Explore more tags: ≥1 link with non-empty text

**What:** Navigate to fixture post. Assert `.explore-more .topic-tag-link`:
- Count ≥ 1
- Each link's `textContent` is non-empty (`.trim().length > 0`)
- Each link's `href` is non-empty

**Note:** Per `post.html`, these links currently all point to `/blog/`. The test asserts presence and labeling, not filtering behavior (that is a separate issue from #906).

**AC:** AC-7  
**Verify:** `npx playwright test navigation.spec.ts --grep "Explore more"` passes.

---

### T8 — Related reading: category label matches current post

**What:** Navigate to fixture post. Read the category from `.article-section-line .section-link` (dynamic, not hardcoded). Check if `section.related-reading` is present:
- If **not present**: `test.skip('related-reading section not rendered — fewer than 2 related posts found')`.
- If **present**: assert each `.related-item .related-category` contains text matching the category read above. Assert each `.related-item` has a visible `.related-title` link and a non-empty `.related-excerpt`.

**AC:** AC-8  
**Verify:** `npx playwright test navigation.spec.ts --grep "Related reading semantics"` passes.

---

### T9 — More from section: heading contains dynamic category name

**What:** Navigate to fixture post. Assert `section.more-from-section`:
- Is visible
- `h2` text content is non-empty
- `h2` text does not equal the current post's title (guards against the `default: "Quality Engineering"` fallback becoming a hardcoded label)
- `.more-from-grid article` count ≥ 1

**AC:** AC-9  
**Verify:** `npx playwright test navigation.spec.ts --grep "More from section"` passes.

---

### CHECKPOINT B

After T6–T9 are added:
- Run full navigation suite: `npx playwright test tests/playwright-agents/navigation.spec.ts`
- All 20+ tests (desktop + mobile + new taxonomy block) must pass.
- Confirm no `|| true`, no always-passing numeric comparisons remain.

---

## Phase 3 — Final verification

### T10 — Full suite green, no permissive patterns remain

**What:**
1. `grep -n "|| true\|toBeGreaterThanOrEqual(0)\|console.log.*skipping\|console.log.*skipped"` against the final file — must return no results.
2. Run `npx playwright test tests/playwright-agents/navigation.spec.ts --reporter=line`.
3. Record pass/fail counts in PR description.

**AC:** AC-10, AC-11  
**Verify:** All tests green; `package.json` and `package-lock.json` unchanged (no new deps).

---

## Risk Register

| Risk | Likelihood | Mitigation |
|---|---|---|
| `/2025/12/31/testing-times/` URL changes | Low | Use `_config.yml` permalink pattern; if URL changes, update fixture comment in test |
| `section.related-reading` absent on fixture post | Low | Fixture has `Quality Engineering` category shared by many posts; if absent use `test.skip` |
| Category navigation test has no category links on homepage | Low | Use `test.skip` with message; do not fail silently |
| T3 fails because `/blog/` nav has <3 links | Low | Desktop nav has 7 items per ARIA snapshot in mobile test |

---

## Out of Scope

- Fixing the underlying UX bugs (#906, #907) that the tightened tests may now expose
- Modifying `_layouts/post.html` or any production code
- Adding new npm packages
