import { test, expect } from '@playwright/test';

/**
 * Service Worker Stale-CSS Regression Guard (#1353).
 *
 * sw.js served styles.css cache-first under a hand-maintained CACHE_VERSION
 * that was never bumped after April 2026. HTML was network-first, so once the
 * August homepage redesign shipped, returning visitors got the new h26-* markup
 * against a cached pre-redesign stylesheet with no h26 rules, and the lead
 * image rendered at its intrinsic 1600x900, far wider than the viewport.
 *
 * The fix has three parts, each guarded here:
 *   1. CACHE_VERSION is stamped per build, so every deploy installs a new worker.
 *   2. CSS is network-first, so a poisoned cache entry cannot win while online.
 *   3. The stylesheet URL carries a per-build ?v= stamp, so even a worker from
 *      an older deploy (which looks CSS up cache-first) misses its stale entry
 *      on the very first view after a deploy.
 */

const STALE_CSS = 'body { margin: 0; }';

test('sw.js and the stylesheet URL are stamped per build', async ({ request, page }) => {
  const sw = await (await request.get('/sw.js')).text();
  expect(sw).not.toContain('{{');
  expect(sw).toMatch(/const CACHE_VERSION = 'build-\d+';/);

  await page.goto('/');
  const href = await page.locator('link[rel="stylesheet"][href*="/assets/css/styles.css"]').getAttribute('href');
  // An older worker cached the bare URL; a stamped URL can never match it.
  expect(href).toMatch(/\/assets\/css\/styles\.css\?v=\d+$/);
});

test('homepage lead image survives a stale service-worker CSS cache', async ({ page }, testInfo) => {
  // The layout assertions below are for the desktop homepage; one project is enough.
  test.skip(testInfo.project.name !== 'Desktop Chrome', 'desktop layout check');

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

  // Poison every cache with the exact stylesheet URL this page requests, plus
  // the bare URL an older worker would have cached.
  await page.evaluate(async (css) => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="stylesheet"][href*="/assets/css/styles.css"]');
    const urls = [link!.href, new URL('/assets/css/styles.css', location.origin).href];
    for (const key of await caches.keys()) {
      const cache = await caches.open(key);
      for (const url of urls) {
        await cache.put(url, new Response(css, { headers: { 'Content-Type': 'text/css' } }));
      }
    }
  }, STALE_CSS);

  await page.reload({ waitUntil: 'networkidle' });
  expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  // The facts strip renders unconditionally; under the stale CSS it falls back
  // to display: block, so this holds whatever the latest post looks like.
  await expect(page.locator('.h26-facts')).toHaveCSS('display', 'grid');

  // The lead image only renders when the latest post has an `image:`.
  const leadImage = page.locator('.h26-lead-image img');
  if (await leadImage.count()) {
    await expect(leadImage).toBeVisible();
    const box = await leadImage.boundingBox();
    // home-2026.scss caps the lead image at clamp(180px, 22vw, 280px).
    expect(box!.height).toBeLessThanOrEqual(280);
  }
});
