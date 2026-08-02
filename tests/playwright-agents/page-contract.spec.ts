import { test, expect } from '@playwright/test';

/**
 * Page contract — the blocking PR gate.
 *
 * Every test here answers one question: would a reader hit this? It covers the
 * failures that are cheap to detect and expensive to ship — a page that 404s, a
 * page with no heading, a JavaScript error on load, a layout that scrolls
 * sideways on a phone, navigation that will not open.
 *
 * It is deliberately small. The full 138-test suite runs nightly; this runs on
 * every PR, so it is held to a wall-clock budget rather than a coverage target.
 * Adding a test here should be a considered decision — if it does not describe a
 * contract every page must honour, it belongs in the nightly suite instead.
 *
 * Tagged @contract so the workflow can select it without a path filter.
 */

const PAGES = [
  { path: '/', name: 'homepage' },
  { path: '/blog/', name: 'blog index' },
  { path: '/security/', name: 'category: security' },
  { path: '/software-engineering/', name: 'category: software engineering' },
  { path: '/about/', name: 'about' },
  { path: '/2025/12/31/testing-times/', name: 'post' },
];

const MOBILE = { width: 320, height: 568 };

test.describe('@contract Page contract @REQ-CONTENT-02 @REQ-NAV-01', () => {

  for (const { path, name } of PAGES) {
    test(`${name} (${path}) returns 200 and renders a heading`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response, `no response for ${path}`).not.toBeNull();
      expect(response!.status(), `${path} did not return 200`).toBe(200);

      await page.waitForLoadState('networkidle');

      // Exactly one h1 per page: zero breaks the document outline, more than one
      // breaks it differently and is a recurring regression on listing pages.
      await expect(page.locator('h1'), `${path} must have exactly one h1`).toHaveCount(1);
      await expect(page.locator('h1')).toBeVisible();
    });
  }

  for (const { path, name } of PAGES) {
    test(`${name} (${path}) does not scroll horizontally at 320px`, async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      // This is the class of the only real product regression the Playwright
      // suite has ever caught (72c1666 — a Chart.js canvas measuring 344px
      // against a 320px viewport), which is why it gates every PR.
      const { scrollWidth, clientWidth, offender } = await page.evaluate(() => {
        const doc = document.documentElement;
        let worst = '';
        let worstRight = doc.clientWidth;
        for (const el of Array.from(document.body.querySelectorAll('*'))) {
          const right = el.getBoundingClientRect().right;
          if (right > worstRight) {
            worstRight = right;
            const cls =
              typeof el.className === 'string' && el.className.trim()
                ? '.' + el.className.trim().split(/\s+/).join('.')
                : '';
            worst = `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls} (right=${Math.round(right)}px)`;
          }
        }
        return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, offender: worst };
      });

      expect(scrollWidth, `widest offender: ${offender || 'none identified'}`)
        .toBeLessThanOrEqual(clientWidth + 1);
    });
  }

  // Third-party embeds (analytics, giscus comments) fail routinely in CI and on
  // a local server: no outbound egress, expired certs, upstream rate limits.
  // Their health is not this repo's contract, so they are excluded by origin.
  // This narrows the subject of the assertion; it does not soften it — a
  // first-party error still fails, and an uncaught exception fails wherever it
  // comes from.
  const THIRD_PARTY = [
    'googletagmanager.com',
    'google-analytics.com',
    'doubleclick.net',
    'giscus.app',
    'github.com',
  ];
  const isThirdParty = (url: string) => THIRD_PARTY.some((host) => url.includes(host));

  test('no page logs a first-party console error or failed request', async ({ page }) => {
    const problems: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      // "Failed to load resource" messages carry the failing URL as their
      // location, which is how a third-party asset is told from one of ours.
      const source = msg.location()?.url || '';
      if (isThirdParty(source) || isThirdParty(msg.text())) return;
      problems.push(`[console] ${page.url()} — ${msg.text()}`);
    });

    // An uncaught exception is always ours to answer for, wherever it originates.
    page.on('pageerror', (err) => {
      problems.push(`[pageerror] ${page.url()} — ${err.message}`);
    });

    page.on('requestfailed', (req) => {
      const failure = req.failure()?.errorText || '';
      // ERR_ABORTED is triggered by Playwright's own navigation.
      if (failure.includes('ERR_ABORTED') || isThirdParty(req.url())) return;
      problems.push(`[request] ${req.url()} — ${failure}`);
    });

    page.on('response', (res) => {
      if (res.status() >= 400 && !isThirdParty(res.url())) {
        problems.push(`[response] ${res.url()} — ${res.status()}`);
      }
    });

    for (const { path } of PAGES) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
    }

    expect(problems, `first-party console/network problems:\n${problems.join('\n')}`).toHaveLength(0);
  });

  test('mobile navigation opens and closes', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const toggle = page.locator('.nav-toggle');
    const nav = page.locator('#site-navigation');

    await expect(toggle).toBeVisible();

    await toggle.click();
    await expect(nav).toBeVisible();
    // The menu must contain real destinations, not just open.
    expect(await nav.getByRole('link').count()).toBeGreaterThanOrEqual(3);

    await toggle.click();
    await expect(nav).toBeHidden();
  });

  test('primary navigation destinations all resolve', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const toggle = page.locator('.nav-toggle');
    const nav = page.locator('#site-navigation');
    if (!(await nav.isVisible()) && (await toggle.isVisible())) {
      await toggle.click();
      await expect(nav).toBeVisible();
    }

    const hrefs = await nav.getByRole('link').evaluateAll((links) =>
      links.map((l) => (l as HTMLAnchorElement).getAttribute('href')).filter(Boolean) as string[]
    );
    expect(hrefs.length, 'primary nav has no links').toBeGreaterThanOrEqual(3);

    const broken: string[] = [];
    for (const href of hrefs) {
      // Skip off-site and non-navigational hrefs; those are covered elsewhere.
      if (/^(https?:|mailto:|#)/.test(href)) continue;
      const res = await page.request.get(href);
      if (res.status() !== 200) broken.push(`${href} → ${res.status()}`);
    }

    expect(broken, `broken nav destinations: ${broken.join(', ')}`).toHaveLength(0);
  });

});
