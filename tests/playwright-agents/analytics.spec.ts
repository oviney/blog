import { test, expect } from '@playwright/test';

// Script configuration does not change with viewport size. Check the complete
// contract during one visit per page template rather than reloading for each tag.
test.describe('@content Analytics Integration @REQ-SEC-01', () => {
  for (const path of ['/', '/blog/', '/2026/01/02/self-healing-tests-myth-vs-reality/']) {
    test(`${path} emits valid analytics configuration`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.ok(), `${path} should load`).toBe(true);

      const ga = page.locator('head script[src*="googletagmanager.com/gtag/js"]');
      await expect(ga).toHaveCount(1);
      await expect(ga).toHaveAttribute('src', /G-/);
      expect(await ga.getAttribute('async')).not.toBeNull();
      expect(await page.evaluate(() => typeof (window as any).gtag)).toBe('function');

      const plausible = page.locator('head script[src*="plausible.io/js/script.js"]');
      await expect(plausible).toHaveCount(1);
      expect((await plausible.getAttribute('data-domain'))?.trim().length).toBeGreaterThan(0);
      expect(await plausible.getAttribute('defer')).not.toBeNull();
    });
  }

  test('Search Console meta is absent when its verification value is empty', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('meta[name="google-site-verification"]')).toHaveCount(0);
  });
});
