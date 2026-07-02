import { test, expect } from '@playwright/test';

/**
 * Search result rendering must escape user-facing fields (GH-1107).
 * The client builds result cards via innerHTML; post.title/content/url/etc.
 * must be HTML-escaped so a title containing markup renders as literal text
 * and cannot inject elements or run script.
 */
test.describe('@content @REQ-SEARCH-01 Search rendering escapes user fields', () => {
  test('post fields with HTML metacharacters render as literal text, not markup', async ({ page }) => {
    const malicious = [{
      title: 'XSS <img src=x onerror="window.__pwned=1"> & "quoted"',
      url: '/2026/01/01/escaping-test/',
      content: 'Body with <b>bold</b> & <script>window.__pwned=1<\/script> about security',
      categories: ['<em>Security</em>'],
      date: 'Jan 1, 2026',
    }];

    // Mock the search index before the page requests it.
    await page.route('**/search.json', (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify(malicious) })
    );

    await page.goto('/search/');
    await page.waitForLoadState('networkidle');

    // Query matches the injected post's content ("security").
    await page.fill('#search-input', 'security');

    const title = page.locator('.search-result-title');
    await expect(title).toBeVisible();

    // No injected elements may exist anywhere in the results.
    await expect(page.locator('#search-results img')).toHaveCount(0);
    await expect(page.locator('#search-results script')).toHaveCount(0);
    await expect(page.locator('.search-result-excerpt b')).toHaveCount(0);
    await expect(page.locator('.search-result-category em')).toHaveCount(0);

    // The raw markup must be visible as literal text.
    await expect(title).toContainText('<img src=x');
    await expect(page.locator('.search-result-excerpt')).toContainText('<script>');

    // The injection flag must never have been set.
    const pwned = await page.evaluate(() => (window as Window & { __pwned?: number }).__pwned);
    expect(pwned).toBeFalsy();
  });
});
