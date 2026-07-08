import { test, expect } from '@playwright/test';

/**
 * Visual-regression snapshot gate — @REQ-VISUAL-SNAP
 *
 * This is the BLOCKING pixel gate that replaces the old, advisory BackstopJS
 * job (which ran `continue-on-error: true`). A pixel diff on any covered page
 * type reds a required CI check so the regression cannot merge.
 *
 * Coverage started at parity with the retired BackstopJS scenarios (home, blog
 * index, two posts, about) across the three Chromium viewports declared in
 * playwright.config.ts, and now closes Gap B from
 * docs/agents/visual-audit-findings.md by adding the previously-unbaselined page
 * types: the three category pages (/security/, /software-engineering/,
 * /test-automation/), /search/, and the 404 page (served at /404/). The
 * published:false /agents/* pages are intentionally excluded — they are not
 * built and therefore have no rendered URL to baseline.
 *
 * Baselines are committed as `-linux` Chromium PNGs generated in the CI
 * environment (`npm run test:visual:snap:update` on ubuntu-latest). They must
 * NOT be regenerated on macOS/Windows: cross-platform anti-aliasing differences
 * would make the gate permanently flaky — the exact failure mode that led to
 * BackstopJS being made non-blocking in the first place.
 *
 * Run locally against a Linux baseline:
 *   npm run test:visual:snap            # compare
 *   npm run test:visual:snap:update     # (CI/Docker only) refresh baselines
 */

const PAGES: { name: string; path: string }[] = [
  { name: 'homepage', path: '/' },
  { name: 'blog-index', path: '/blog/' },
  { name: 'post-testing-times', path: '/2025/12/31/testing-times/' },
  { name: 'post-self-healing-tests', path: '/2026/01/01/self-healing-tests-myth-vs-reality/' },
  { name: 'about', path: '/about/' },
  // Gap-B page types — category landing pages, search, and the 404 page. The
  // 404 page is built to /404/index.html (pretty permalinks), so it is served
  // at /404/, not /404.html (which correctly returns a real 404).
  { name: 'category-security', path: '/security/' },
  { name: 'category-software-engineering', path: '/software-engineering/' },
  { name: 'category-test-automation', path: '/test-automation/' },
  { name: 'search', path: '/search/' },
  { name: 'not-found', path: '/404/' },
];

test.describe('@visual Visual regression snapshots @REQ-VISUAL-SNAP', () => {
  // Baselines are committed as `-linux` PNGs. Comparing them on macOS/Windows
  // would fail on anti-aliasing noise, not real regressions — so this gate only
  // runs on Linux (every CI runner here is ubuntu-latest). Off-Linux it skips
  // rather than reporting false failures on a developer's laptop.
  test.skip(
    process.platform !== 'linux',
    'visual baselines are -linux only; run in CI (ubuntu) or via test:visual:snap:update',
  );

  for (const { name, path } of PAGES) {
    test(`${name} matches its committed baseline`, async ({ page }) => {
      await page.goto(path);
      // Settle web fonts and lazy imagery before capturing so the baseline is
      // deterministic across runs.
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => document.fonts.ready);

      await expect(page).toHaveScreenshot(`${name}.png`, {
        fullPage: true,
        // Tolerate sub-pixel anti-aliasing noise between otherwise-identical
        // renders; a real layout/spacing/colour regression moves far more than
        // this. Keep tight enough to catch the defect classes in the catalog.
        maxDiffPixelRatio: 0.02,
        animations: 'disabled',
        scale: 'css',
      });
    });
  }
});
