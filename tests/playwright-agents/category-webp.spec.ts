import { test, expect } from '@playwright/test';

/**
 * Guard test for the category-page WebP regression (P2).
 *
 * Category pages (/security/, /software-engineering/, /test-automation/)
 * previously emitted raw <img src="...png"> thumbnails, bypassing the
 * responsive-image include (and its WebP <source>) used by /blog/. That
 * served multi-MB PNGs instead of the ~0.6MB WebP variants.
 *
 * This test asserts the card thumbnails are now wrapped in <picture> with a
 * WebP <source>, and that no raw PNG <img> with an available WebP sibling
 * remains on the category pages.
 */

const categoryPages = ['/security/', '/software-engineering/', '/test-automation/'];

test.describe('Category page WebP thumbnails', () => {
  for (const url of categoryPages) {
    test(`${url} serves card thumbnails via <picture>/WebP`, async ({ page }) => {
      await page.goto(url);

      const cardImages = page.locator('.topic-card-image');
      const cardCount = await cardImages.count();

      // The fix only applies to cards that have a post image. If a category has
      // image-bearing posts, at least one <picture> with a WebP source must exist.
      const pictures = page.locator('.topic-card-image picture');
      const webpSources = page.locator('.topic-card-image picture source[type="image/webp"]');

      if (cardCount > 0 && (await pictures.count()) > 0) {
        expect(await webpSources.count()).toBeGreaterThan(0);
      }

      // No raw PNG <img> should remain directly under a card image link.
      // (PNG-backed thumbnails must be routed through <picture> with WebP.)
      const rawPngImgCount = await page
        .locator('.topic-card-image > img[src$=".png"]')
        .count();
      expect(rawPngImgCount).toBe(0);
    });
  }
});
