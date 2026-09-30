import { test, expect } from '@playwright/test';

/**
 * Service Worker Stale-CSS Regression Guard.
 *
 * sw.js served styles.css cache-first under a hand-maintained CACHE_VERSION
 * that was never bumped after April 2026. HTML was network-first, so once the
 * August homepage redesign shipped, returning visitors got the new h26-* markup
 * against a cached pre-redesign stylesheet with no h26 rules, and the lead
 * image rendered at its intrinsic 1600x900, far wider than the viewport.
 *
 * This spec lets the real worker take control, poisons its caches with a
 * stylesheet that lacks the homepage rules (what a returning visitor's cache
 * held), reloads, and asserts the lead image still honours the current CSS.
 */

const STALE_CSS = 'body { margin: 0; }';

test('homepage lead image survives a stale service-worker CSS cache', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise(resolve =>
        navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }),
      );
    }
  });

  await page.evaluate(async (css) => {
    const url = new URL('/assets/css/styles.css', location.origin).href;
    for (const key of await caches.keys()) {
      const cache = await caches.open(key);
      await cache.put(url, new Response(css, { headers: { 'Content-Type': 'text/css' } }));
    }
  }, STALE_CSS);

  await page.reload({ waitUntil: 'networkidle' });
  expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  const box = await page.locator('.h26-lead-image img').boundingBox();
  expect(box, 'lead image should render').not.toBeNull();
  // home-2026.scss caps the lead image at clamp(180px, 22vw, 280px).
  expect(box!.height).toBeLessThanOrEqual(280);
  expect(box!.width).toBeLessThanOrEqual(1440);
});
