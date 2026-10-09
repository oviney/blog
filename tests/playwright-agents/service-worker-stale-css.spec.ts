import { test, expect, type Page } from '@playwright/test';

/**
 * Service Worker Stale-CSS Regression Guard (#1353, #1356).
 *
 * sw.js served styles.css cache-first under a hand-maintained CACHE_VERSION
 * that was never bumped after April 2026. HTML was network-first, so once the
 * August homepage redesign shipped, returning visitors got the new h26-* markup
 * against a cached pre-redesign stylesheet with no h26 rules, and the lead
 * image rendered at its intrinsic 1600x900, far wider than the viewport.
 *
 * The fix, each part guarded here:
 *   1. CACHE_VERSION is stamped per build, so every deploy installs a new worker
 *      and purges the previous deploy's caches.
 *   2. The stylesheet URL carries the same per-build ?v= stamp, so even a worker
 *      from an older deploy misses its stale entry on the first view after a deploy.
 *   3. Only CSS/JS carrying this worker's own stamp is cache-first (its content
 *      cannot change under that URL, #1356); unstamped or old-stamped CSS/JS is
 *      network-first, so a stale cache entry cannot win while online.
 */

const STALE_CSS = 'body { margin: 0; }';
const STYLESHEET = 'link[rel="stylesheet"][href*="/assets/css/styles.css"]';

async function controlledHome(page: Page) {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise(resolve =>
        navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }),
      );
    }
  });
}

test('sw.js and the stylesheet URL are stamped per build', async ({ request, page }) => {
  const sw = await (await request.get('/sw.js')).text();
  expect(sw).not.toContain('{{');
  const build = /const BUILD = '(\d+)';/.exec(sw)?.[1];
  expect(build).toBeTruthy();
  expect(sw).toContain("const CACHE_VERSION = 'build-' + BUILD;");

  await page.goto('/');
  const href = await page.locator(STYLESHEET).getAttribute('href');
  // An older worker cached the bare URL; a stamped URL can never match it.
  expect(href).toMatch(new RegExp(`/assets/css/styles\\.css\\?v=${build}$`));
});

test('the current build\'s stylesheet is served from the worker cache (#1356)', async ({ page }) => {
  await controlledHome(page);
  const body = await page.evaluate(async () => {
    const href = document.querySelector<HTMLLinkElement>('link[rel="stylesheet"][href*="/assets/css/styles.css"]')!.href;
    const real = await (await fetch(href, { cache: 'no-store' })).text();
    for (const key of await caches.keys()) {
      await (await caches.open(key)).put(href, new Response(`${real}\n/* sw-cache-hit */`, { headers: { 'Content-Type': 'text/css' } }));
    }
    return (await fetch(href)).text();
  });
  expect(body).toContain('/* sw-cache-hit */');
});

test('unstamped and old-stamped CSS stay network-first (#1356)', async ({ page }) => {
  await controlledHome(page);
  const bodies = await page.evaluate(async (css) => {
    const urls = ['/assets/css/styles.css', '/assets/css/styles.css?v=1'].map(u => new URL(u, location.origin).href);
    for (const key of await caches.keys()) {
      const cache = await caches.open(key);
      for (const url of urls) await cache.put(url, new Response(css, { headers: { 'Content-Type': 'text/css' } }));
    }
    return Promise.all(urls.map(async url => (await fetch(url)).text()));
  }, STALE_CSS);
  for (const body of bodies) expect(body).not.toBe(STALE_CSS);
});

test('homepage lead image survives a stale service-worker CSS cache', async ({ page }, testInfo) => {
  // The layout assertions below are for the desktop homepage; one project is enough.
  test.skip(testInfo.project.name !== 'Desktop Chrome', 'desktop layout check');

  await page.setViewportSize({ width: 1440, height: 900 });
  await controlledHome(page);

  // Poison every cache with what returning visitors' caches really hold: the
  // bare URL (the v2 worker) and a stylesheet stamped by an older build.
  await page.evaluate(async (css) => {
    const urls = ['/assets/css/styles.css', '/assets/css/styles.css?v=1'].map(u => new URL(u, location.origin).href);
    for (const key of await caches.keys()) {
      const cache = await caches.open(key);
      for (const url of urls) await cache.put(url, new Response(css, { headers: { 'Content-Type': 'text/css' } }));
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
