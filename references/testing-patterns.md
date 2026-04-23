# Testing Patterns Reference

Quick reference for the verification stack used in oviney/blog. Use alongside `test-driven-development`, `debugging-and-error-recovery`, and `jekyll-qa`.

## The Default Verification Order

```bash
bundle exec jekyll build
npm run test:security
bundle exec jekyll serve --config _config_dev.yml
npm run test:playwright
npm run test:a11y
npm run test:lighthouse
```

Start with the build whenever Markdown, Liquid, layout, or data output changed. Start the local server before browser-based QA, then add only the smallest relevant QA command after that.

## Playwright Patterns

### Use the repo conventions

```ts
import { test, expect } from '@playwright/test';

test.describe('Blog navigation', () => {
  test('opens the blog index from the home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByRole('link', { name: /blog/i }).first().click();
    await expect(page).toHaveURL('/blog/');
  });
});
```

### Prefer accessible selectors

- `getByRole()` for links, buttons, navigation, headings
- `getByLabel()` / `getByRole('textbox')` for form fields
- `.first()` when a locator can match more than one element
- Relative routes in `page.goto()` (`'/'`, `'/blog/'`, not hard-coded localhost URLs)

### Mobile and responsive checks

The repo's core responsive checkpoints are:

- 320 px
- 768 px
- 1024 px
- 1920 px for spot-checking visual density

For touch targets on mobile:

```ts
const link = page.getByRole('link', { name: /menu/i }).first();
const box = await link.boundingBox();
expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
```

## Accessibility and Lighthouse Follow-Through

Use the repo scripts instead of raw tool invocations when you want the standard project configuration:

```bash
bundle exec jekyll serve --config _config_dev.yml
npm run test:a11y
npm run test:lighthouse
```

These are especially important after navigation, layout, image, or content-structure changes.

## Security as Part of Verification

Dependency and supply-chain checks are part of the testing story for this repo:

```bash
npm run test:security
```

## Scope-Safe Verification for Governance Changes

If the branch changes `.github/skills/` or `.github/instructions/`:

```bash
PR_LABELS=governance-update bash scripts/check-pr-scope.sh
```

Otherwise:

```bash
bash scripts/check-pr-scope.sh
```

## Testing Anti-Patterns in This Repo

| Anti-pattern | Why it is weak here | Better approach |
|---|---|---|
| Hard-coding `http://localhost:4000` in specs | base URL already lives in Playwright config | use relative paths |
| CSS-class selectors for nav and content | styles evolve faster than semantics | use roles and labels |
| Running generic build/lint/typecheck commands | those are not the repo defaults | use the existing build and test scripts |
| Huge end-to-end tests that cover many concerns | harder to debug and heal | one clear user journey per test |
| Skipping `bundle exec jekyll build` after Markdown changes | broken front matter shows up late | rebuild first |
