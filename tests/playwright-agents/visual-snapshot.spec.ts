import { test, expect } from '@playwright/test';

/**
 * Visual-regression snapshot gate — @REQ-VISUAL-SNAP
 *
 * This is the BLOCKING pixel gate that replaces the old, advisory BackstopJS
 * job (which ran `continue-on-error: true`). A pixel diff on any covered page
 * type reds a required CI check so the regression cannot merge.
 *
 * Coverage is parity with the retired BackstopJS scenarios (home, blog index,
 * two posts, about) across the three Chromium viewports declared in
 * playwright.config.ts. Additional page types (category, /agents/, /search/,
 * /404/) are deliberately out of scope here and tracked as the Gap-B follow-up.
 *
 * Baselines are committed as `-linux` Chromium PNGs generated in the CI
 * environment. They must NOT be regenerated on macOS/Windows: cross-platform
 * anti-aliasing differences would make the gate permanently flaky — the exact
 * failure mode that led to BackstopJS being made non-blocking in the first
 * place.
 *
 * To refresh baselines, dispatch `test-quality.yml` on the branch with
 * update_snapshots=true; the job renders and commits them back to that branch,
 * so the pixels and the markup that produced them stay in lockstep.
 *
 * Run locally against a Linux baseline:
 *   npm run test:visual:snap            # compare
 */

// Container holding the article cards on every listing surface — the canonical
// post-card partial extracted in #1123 (home, blog index, category pages).
const LISTING_GRID = '.topic-grid';

// Cross-links a post page builds from whatever else is published (_layouts/post.html
// renders `related_posts limit: 3` and `more_from_posts offset: 1 limit: 5`).
// The slot count is fixed but the entries are not, so a longer headline wraps to
// an extra line and moves everything below it — enough to change the full-page
// height and fail the gate on a size mismatch.
const POST_CROSS_LINKS = ['.related-list', '.more-from-section'];

// `listing: true` marks a page whose body is a post grid. Those pages re-render
// on every published article, so they are captured differently — see the
// `toHaveScreenshot` call below.
const PAGES: { name: string; path: string; listing?: boolean }[] = [
  { name: 'homepage', path: '/', listing: true },
  { name: 'blog-index', path: '/blog/', listing: true },
  { name: 'post-testing-times', path: '/2025/12/31/testing-times/' },
  // Permalink is /2026/01/02/ — the post is dated 2026-01-02. This pointed at
  // /2026/01/01/ from #1119 until #1160, so the scenario silently baselined the
  // 404 page (a telltale 1920x1080 capture) instead of the article.
  { name: 'post-self-healing-tests', path: '/2026/01/02/self-healing-tests-myth-vs-reality/' },
  { name: 'about', path: '/about/' },
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

  for (const { name, path, listing } of PAGES) {
    test(`${name} matches its committed baseline`, async ({ page }) => {
      const response = await page.goto(path);

      // A mistyped permalink still renders something, so without this the gate
      // happily baselines the 404 page and reports green forever. That is not
      // hypothetical: post-self-healing-tests pointed at the wrong date from
      // #1119 until #1160 and was screenshotting 404 the whole time.
      expect(response?.status(), `${path} should be served, not 404`).toBe(200);

      // Settle web fonts and lazy imagery before capturing so the baseline is
      // deterministic across runs.
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => document.fonts.ready);

      // Drop the post-to-post cross-links before measuring. They sit below the
      // article, so removing them keeps everything this gate exists to check —
      // masthead, hero, body typography, share controls, newsletter CTA, footer
      // — while making the page height depend only on the article itself. A
      // mask would not do: it paints after layout, so the height would still
      // move. Their links are exercised by content-edge-cases.spec.ts, though
      // only permissively (the assertions are conditional on the section being
      // present), so this does thin their coverage rather than duplicate it.
      if (!listing) {
        await page.addStyleTag({
          content: `${POST_CROSS_LINKS.join(', ')} { display: none !important; }`,
        });
      }

      await expect(page).toHaveScreenshot(`${name}.png`, {
        // Listing pages are captured at viewport height with the post grid
        // masked; every other page is captured whole.
        //
        // Articles are published to `main` automatically, and each one re-flows
        // the grid on home, blog index and the category pages. Left unhandled
        // that reds this blocking gate on every publish, with nobody in the
        // loop to re-seed — which is how the gate sat broken from #1119 until
        // #1160. Masking alone is not enough: a mask is painted after layout,
        // so a taller grid still changes the full-page height and fails on a
        // size mismatch before the mask is ever consulted. Pinning the capture
        // to the viewport is what actually makes the dimensions stable.
        //
        // What this still catches on listing pages: the masthead, navigation,
        // page header, topic links, and the grid's position and width at each
        // breakpoint. What it gives up: pixel-diffing card interiors, and the
        // below-the-fold footer and newsletter CTA. Neither is uncovered —
        // `about` and both post pages capture the footer and CTA in full, and
        // card rendering is asserted by byline-regression, category-webp,
        // content-quality, excerpt-source-regression, viewport-overflow and
        // responsive.
        fullPage: !listing,
        mask: listing ? [page.locator(LISTING_GRID)] : [],
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
