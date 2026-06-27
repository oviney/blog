import { test, expect } from '@playwright/test';

/**
 * Core-page SEO metadata uniqueness (GH-1055 / BLOG-004)
 *
 * About, Blog, the homepage, and the topic pages previously reused the generic
 * site description. Each indexable core page must now expose a unique,
 * non-generic meta description, and the Search results page must be noindex
 * (it carries no SEO value) rather than competing for the generic description.
 */

// The generic fallback from _config.yml `description:`. No indexable core page
// should still be emitting this.
const GENERIC_SITE_DESCRIPTION =
  'A blog for Software Engineering, Quality Engineering, Test Automation, Performance Engineering and more.';

const INDEXABLE_CORE_PAGES = [
  { path: '/', label: 'Homepage' },
  { path: '/about/', label: 'About' },
  { path: '/blog/', label: 'Blog' },
  { path: '/test-automation/', label: 'Test Automation' },
  { path: '/software-engineering/', label: 'Software Engineering' },
  { path: '/security/', label: 'Security' },
];

async function metaDescription(page): Promise<string> {
  return (
    (await page.locator('head meta[name="description"]').getAttribute('content')) ?? ''
  ).trim();
}

test.describe('@seo Core-page metadata is unique and non-generic @REQ-CONTENT-01', () => {
  test('each indexable core page has a unique, non-generic meta description', async ({ page }) => {
    const seen = new Map<string, string>(); // description -> first page that used it

    for (const { path, label } of INDEXABLE_CORE_PAGES) {
      const response = await page.goto(path);
      expect(response?.ok(), `${path} should load`).toBe(true);

      const description = await metaDescription(page);
      expect(description.length, `${label} (${path}) must set a meta description`).toBeGreaterThan(0);
      expect(
        description,
        `${label} (${path}) must not reuse the generic site description`,
      ).not.toBe(GENERIC_SITE_DESCRIPTION);

      const priorPage = seen.get(description);
      expect(
        priorPage,
        `${label} (${path}) duplicates the description already used by ${priorPage}`,
      ).toBeUndefined();
      seen.set(description, label);
    }
  });

  test('Search results page is marked noindex', async ({ page }) => {
    const response = await page.goto('/search/');
    expect(response?.ok(), '/search/ should load').toBe(true);

    const robots = page.locator('head meta[name="robots"]');
    await expect(robots, '/search/ should declare a robots meta').toHaveCount(1);
    expect((await robots.getAttribute('content'))?.toLowerCase()).toContain('noindex');
  });
});
