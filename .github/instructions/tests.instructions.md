---
description: 'Playwright test conventions including selectors, viewports, assertions, and defensive patterns.'
applyTo: "tests/**/*.spec.ts,tests/**/*.test.ts,specs/**/*.spec.ts"
---

# Playwright Test Conventions

## File Location & Structure

- All spec files live under `tests/playwright-agents/`
- Import from `@playwright/test`: `import { test, expect } from '@playwright/test';`
- Group related tests with `test.describe('Description', () => { ... })`

## Base URL

The base URL is `http://localhost:4000` (set in `playwright.config.ts`).  
Use relative paths in `page.goto()`:

```ts
await page.goto('/');
await page.goto('/blog/');
await page.goto('/2025/12/31/post-slug/');
```

## Viewport Testing

Tests run across three viewport projects defined in `playwright.config.ts`:

| Project       | Width | Height |
|---------------|-------|--------|
| Mobile Chrome | 320   | 568    |
| Tablet Chrome | 768   | 1024   |
| Desktop Chrome| 1920  | 1080   |

Override viewport inline for viewport-specific tests:

```ts
test.use({ viewport: { width: 320, height: 568 } });
```

Or set dynamically within a test:

```ts
await page.setViewportSize({ width: 768, height: 1024 });
```

## Selectors

Prefer accessible, role-based selectors over CSS classes:

```ts
// Good — role-based
page.getByRole('link', { name: /blog/i })
page.getByRole('heading', { level: 1 })
page.getByRole('navigation')
page.getByRole('searchbox')

// Acceptable — semantic element + ARIA fallbacks
page.locator('nav, .site-nav, .main-nav, [role="navigation"]')
page.locator('footer, .footer, .site-footer')
page.locator('article h1, .article-title, main h1')

// Avoid — fragile, layout-dependent
page.locator('.css-class-that-may-change')
```

Always use `.first()` when a locator may match multiple elements to avoid strict-mode errors.

## Assertions

```ts
// Visibility
await expect(element).toBeVisible();

// URL
await expect(page).toHaveURL('/expected-path/');

// Text content
await expect(element).toContainText('expected text');

// Counts
expect(count).toBeGreaterThan(0);
expect(count).toBeGreaterThanOrEqual(1);
```

Set assertion timeout via `playwright.config.ts` (`expect.timeout: 5000`); do not override per-assertion unless required.

## Network & Load State

Wait for full page load before asserting:

```ts
await page.waitForLoadState('networkidle');
```

## Touch Targets (Mobile)

Navigation links must have a touch target of at least 44 × 44 px:

```ts
const box = await link.boundingBox();
if (box) {
  expect(Math.max(box.width, box.height)).toBeGreaterThanOrEqual(44);
}
```

## External Links

External links (`href` starting with `http` or `mailto`) that open in a new tab must include `rel="noopener"` or `rel="noreferrer"`:

```ts
if (target === '_blank') {
  expect(rel).toMatch(/(noopener|noreferrer)/);
}
```

## Defensive Patterns

- Check `.count()` before interacting with optional elements
- Use `try/catch` around interactions that may fail on certain pages
- Log skipped steps with `console.log('reason for skip')` rather than throwing
- Prefer `page.goBack()` over hardcoded back-navigation URLs when possible

## Running Tests

```bash
# All tests
npx playwright test

# Single file
npx playwright test tests/playwright-agents/navigation.spec.ts

# Specific project (viewport)
npx playwright test --project="Mobile Chrome"
```
