import { test, expect } from '@playwright/test';

/**
 * Analytics Integration Tests
 *
 * Validates that analytics scripts and meta tags are correctly injected
 * into the page <head> for:
 *  - Google Analytics 4 (GA4)
 *  - Plausible Analytics (privacy-friendly, cookie-free)
 *  - Google Search Console verification meta tag (when configured)
 *
 * @requirements REQ-CONTENT-01
 * @group content
 */

test.describe('@content Analytics Integration', () => {

  test('Google Analytics 4 script is present in <head>', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Locate the GA4 async loader script by its src attribute
    const gaScript = page.locator('script[src*="googletagmanager.com/gtag/js"]');
    await expect(gaScript).toHaveCount(1);

    const src = await gaScript.getAttribute('src');
    expect(src).toContain('G-');       // measurement ID must be embedded

    // async is a boolean attribute on the element, not part of the URL
    const asyncAttr = await gaScript.getAttribute('async');
    expect(asyncAttr).not.toBeNull();
  });

  test('Google Analytics 4 gtag initialisation is present', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify the inline gtag config script exists
    const gtagInit = await page.evaluate(() => {
      return typeof (window as any).gtag === 'function';
    });
    expect(gtagInit).toBe(true);
  });

  test('Plausible Analytics script is present in <head>', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Locate the Plausible script by its src attribute
    const plausibleScript = page.locator('script[src*="plausible.io/js/script.js"]');
    await expect(plausibleScript).toHaveCount(1);

    // Plausible must have a data-domain attribute set to the site domain
    const dataDomain = await plausibleScript.getAttribute('data-domain');
    expect(dataDomain).toBeTruthy();
    expect(dataDomain!.length).toBeGreaterThan(0);
  });

  test('Plausible script uses defer attribute for non-blocking load', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const plausibleScript = page.locator('script[src*="plausible.io/js/script.js"]');
    const deferAttr = await plausibleScript.getAttribute('defer');
    // Playwright returns '' (empty string) when attribute is present with no value
    expect(deferAttr).not.toBeNull();
  });

  test('Analytics scripts are present on blog listing page', async ({ page }) => {
    await page.goto('/blog/');
    await page.waitForLoadState('networkidle');

    const gaScript = page.locator('script[src*="googletagmanager.com/gtag/js"]');
    await expect(gaScript).toHaveCount(1);

    const plausibleScript = page.locator('script[src*="plausible.io/js/script.js"]');
    await expect(plausibleScript).toHaveCount(1);
  });

  test('Analytics scripts are present on individual post pages', async ({ page }) => {
    // Navigate to any post — try the first link from the blog listing
    await page.goto('/blog/');
    await page.waitForLoadState('networkidle');

    const firstPostLink = page.locator('article a, .article-card a, .post-link').first();
    const count = await firstPostLink.count();
    if (count === 0) {
      console.log('No post links found on /blog/ — skipping post-page analytics check');
      return;
    }

    await firstPostLink.click();
    await page.waitForLoadState('networkidle');

    const gaScript = page.locator('script[src*="googletagmanager.com/gtag/js"]');
    await expect(gaScript).toHaveCount(1);

    const plausibleScript = page.locator('script[src*="plausible.io/js/script.js"]');
    await expect(plausibleScript).toHaveCount(1);
  });

  test('Google Search Console meta tag is absent when not configured', async ({ page }) => {
    // The _data/analytics.yml has an empty google_search_console_verification value,
    // so the meta tag should not be rendered.
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const gscMeta = page.locator('meta[name="google-site-verification"]');
    // The verification token in _data/analytics.yml is empty, so the tag must not be rendered.
    await expect(gscMeta).toHaveCount(0);
  });

});
