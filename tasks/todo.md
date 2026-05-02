# TODO — Issue #909: Tighten Navigation Tests

> All changes are in `tests/playwright-agents/navigation.spec.ts` only.

## Phase 1 — Remove permissive assertions

- [x] **T1** Primary navigation: replace `isBlogPage || true` block with `expect(page).toHaveURL(/\/(blog|posts)/)` (AC-1)
- [x] **T2** Keyboard accessibility: change `toBeGreaterThanOrEqual(0)` → `toBeGreaterThanOrEqual(1)`; tighten Enter-key URL assert (AC-2)
- [x] **T3** Navigation consistency: assert both pages expose nav with ≥3 links; remove try/catch swallowing failures (AC-3)
- [x] **T4** Related posts: assert `.related-category` text contains origin post's category (dynamic, not hardcoded) (AC-4)
- [x] **T5** Category navigation: replace silent `console.log` skip with `test.skip()`; hard-assert URL after click (AC-5)

### Checkpoint A
- [x] Run `npx playwright test tests/playwright-agents/navigation.spec.ts` — 80/80 pass (Chrome + Firefox, all viewports)

## Phase 2 — New taxonomy/recommendation tests

- [x] **T6** New test: section-line `.section-link` visible, non-empty, href ends with `/blog/` (AC-6)
- [x] **T7** New test: `.explore-more .topic-tag-link` count ≥1, each has non-empty text and href (AC-7)
- [x] **T8** New test: `section.related-reading` — when present — each `.related-category` matches the current post's category (AC-8)
- [x] **T9** New test: `section.more-from-section h2` contains non-empty category text; `.more-from-grid article` count ≥1 (AC-9)

### Checkpoint B
- [x] Run `npx playwright test tests/playwright-agents/navigation.spec.ts` — 80/80 pass (all viewports)

## Phase 3 — Final verification

- [x] **T10** `grep` confirms no `|| true`, no `toBeGreaterThanOrEqual(0)`, no silent skips remain (AC-10)
- [x] **T10** `package.json` and `package-lock.json` unchanged (AC-11)
- [ ] Record pass/fail counts in PR description
