import { test, expect } from '@playwright/test';

/**
 * SEO metadata de-duplication regression (GH-1054 / BLOG-003)
 *
 * `_layouts/default.html` used to hand-roll <title>, meta description, and
 * canonical AND also invoke {% seo %} (jekyll-seo-tag), so every page emitted
 * two of each. jekyll-seo-tag is now the single authoritative source. These
 * tests assert each representative page emits exactly one title, one meta
 * description, and one canonical, while Open Graph and Twitter metadata from
 * seo-tag remain present and valid.
 */

const REPRESENTATIVE_PAGES = [
  { path: '/', label: 'Homepage' },
  { path: '/about/', label: 'About' },
  { path: '/blog/', label: 'Blog' },
  { path: '/search/', label: 'Search' },
  { path: '/test-automation/', label: 'Topic page' },
  { path: '/2026/01/02/self-healing-tests-myth-vs-reality/', label: 'Article' },
];

test.describe('@seo SEO metadata is emitted exactly once @REQ-CONTENT-01', () => {
  for (const { path, label } of REPRESENTATIVE_PAGES) {
    test(`${label} (${path}) emits one title/description/canonical and valid OG+Twitter`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.ok(), `${path} should load`).toBe(true);

      // Exactly one of each — no duplication between custom markup and seo-tag.
      await expect(page.locator('head title'), `${path}: one <title>`).toHaveCount(1);
      await expect(
        page.locator('head meta[name="description"]'),
        `${path}: one meta description`,
      ).toHaveCount(1);
      await expect(
        page.locator('head link[rel="canonical"]'),
        `${path}: one canonical`,
      ).toHaveCount(1);

      // Surviving values are non-empty and the canonical is an absolute URL.
      expect((await page.title()).trim().length, `${path}: title not empty`).toBeGreaterThan(0);
      const description = await page.locator('head meta[name="description"]').getAttribute('content');
      expect(description?.trim().length, `${path}: description not empty`).toBeGreaterThan(0);
      const canonical = await page.locator('head link[rel="canonical"]').getAttribute('href');
      expect(canonical, `${path}: canonical is absolute`).toMatch(/^https?:\/\//);

      // Open Graph and Twitter metadata from seo-tag remain present and valid.
      await expect(
        page.locator('head meta[property="og:title"]'),
        `${path}: has og:title`,
      ).toHaveCount(1);
      const ogTitle = await page.locator('head meta[property="og:title"]').getAttribute('content');
      expect(ogTitle?.trim().length, `${path}: og:title not empty`).toBeGreaterThan(0);
      await expect(
        page.locator('head meta[name="twitter:card"]'),
        `${path}: has twitter:card`,
      ).toHaveCount(1);
    });
  }
});
