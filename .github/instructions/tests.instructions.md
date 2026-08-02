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

### Every test must be able to fail

This is the one rule that outranks the rest of this file. A test that cannot
report a failure is worse than no test: it consumes maintenance and buys false
confidence. Before opening a PR, ask of each test — *what change to the site
would turn this red?* If you cannot name one, the test is not finished.

**Forbidden.** These are not style preferences; they are defects:

```ts
// A count is never negative — this passes on any rendering whatsoever.
expect(items.length).toBeGreaterThanOrEqual(0);

// A range so wide that no real regression falls outside it.
expect(fontSize).toBeGreaterThanOrEqual(8);
expect(fontSize).toBeLessThanOrEqual(50);

// A `catch` that converts a genuine failure into a pass.
try {
  await expect(banner).toBeVisible();
} catch {
  validCount++;              // counts the error as a success
}

// A fallback that asserts something trivially true instead of the contract.
} catch {
  await expect(page.locator('body')).toBeVisible();
}
```

**Bounds must be tight enough to catch a real regression.** Assert against the
design token or the viewport, not against a range that any rendering satisfies:

```ts
// Good — fails if the element escapes the viewport.
expect(box.width).toBeLessThanOrEqual(viewport.width + 1);

// Good — fails if the 1040px listing token drifts.
expect(Math.abs(wrapper.width - 1040)).toBeLessThanOrEqual(50);
```

**Never weaken an assertion to make a test pass.** If a test fails, either the
product regressed (fix the product) or the test asserts something deliberately
changed (retarget the test at the new contract). Widening the bound until the
run goes green destroys the test's reason to exist.

## Network & Load State

Wait for full page load before asserting:

```ts
await page.waitForLoadState('networkidle');
```

## Touch Targets (Mobile)

Navigation links must have a touch target of at least 44 × 44 px:

```ts
const box = await link.boundingBox();
expect(box, 'nav link has no layout box').not.toBeNull();
expect(Math.max(box!.width, box!.height)).toBeGreaterThanOrEqual(44);
```

Assert the box exists rather than wrapping the check in `if (box)`. A link that
fails to lay out returns `null` here, and the `if` form silently passes on
exactly the breakage the test is meant to catch.

## External Links

External links (`href` starting with `http` or `mailto`) that open in a new tab must include `rel="noopener"` or `rel="noreferrer"`:

```ts
if (target === '_blank') {
  expect(rel).toMatch(/(noopener|noreferrer)/);
}
```

## Handling optional elements

This section previously read "use `try/catch` around interactions that may fail"
and "log skipped steps with `console.log` rather than throwing". That guidance
produced a suite in which nine tests could not fail and eight more reported green
when the element under test had vanished. It is replaced by the following.

**First decide whether the element is genuinely optional.** Most are not. The
primary nav, its Blog and category links, the related-reading section and the
more-from rail all exist on every build of this site. Assert them:

```ts
const blogLink = nav.getByRole('link', { name: 'Blog' });
await expect(blogLink).toBeVisible();
```

**Never make a test's own subject conditional.** This is the anti-pattern:

```ts
// WRONG — if navigation breaks, this reports success.
if (await blogLink.count() === 0) {
  test.skip(true, 'Blog link not found');
  return;
}
```

`test.skip()` is legitimate only for a condition external to the thing under
test — a viewport that does not render the feature, or a documented pending
defect with an issue reference. It is never legitimate as a response to the
element under test being absent.

**For genuinely optional content**, iterate over what is present and assert the
contract on each, so an empty set is visible in the test name rather than hidden
inside a passing test:

```ts
for (const { path, name } of pages) {
  test(`${name} does not scroll horizontally at 320px`, async ({ page }) => {
    // one test per case — a missing case is a missing test, not a silent skip
  });
}
```

**`try/catch` may never convert a failure into a pass.** If you need cleanup, use
`finally`. If an interaction is genuinely best-effort, it does not belong in a
gating test.

**Prefer `page.goBack()`** over hardcoded back-navigation URLs where possible.

## Making failures actionable

A failing assertion should say what broke, not just that something did. Pass a
message, and where a check scans many elements, name the offender:

```ts
expect(scrollWidth, `widest offender: ${offender}`).toBeLessThanOrEqual(clientWidth + 1);
expect(undersized, `undersized nav touch targets: ${undersized.join(', ')}`).toHaveLength(0);
```

## Running Tests

```bash
# All tests
npx playwright test

# Single file
npx playwright test tests/playwright-agents/navigation.spec.ts

# Specific project (viewport)
npx playwright test --project="Mobile Chrome"
```
