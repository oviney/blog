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
 * The gate must stay green across a publish, or it reds on every article and
 * gets ignored — which is how it sat broken from #1119 until #1160. Two
 * mechanisms keep it decoupled from publication: `listing` pins grid pages to
 * the viewport and masks the grid, and `volatile` hides the per-page blocks
 * that a publish rewrites. The homepage needs both — its hero renders outside
 * the grid, so the mask does not reach it.
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

// Volatile content — blocks a page composes from whatever happens to be
// published, so publishing an article rewrites them and moves the pixels below.
// Every page names its own in `volatile` below, and they are `display: none`-ed
// before capture. `display: none`, never `mask`: a mask paints after layout, so
// a taller or shorter block still shifts everything beneath it and fails on a
// size mismatch before the mask is ever consulted.

// Cross-links a post page builds from whatever else is published (_layouts/post.html
// renders `related_posts limit: 3` and `more_from_posts offset: 1 limit: 5`).
// The slot count is fixed but the entries are not, so a longer headline wraps to
// an extra line and moves everything below it — enough to change the full-page
// height and fail the gate on a size mismatch.
const POST_CROSS_LINKS = ['.related-list', '.more-from-section'];

// The homepage hero (index.md:22) renders the newest — or `featured: true` —
// post's image, category, title, subtitle, 40-word excerpt, date and read time
// OUTSIDE `.topic-grid`, so the `listing` mask below does not reach it. Every
// publish that takes over the hero rewrites that block, which is why the
// homepage stayed coupled to publication after #1186 decoupled the category
// pages: measured at 17,118px / ratio 0.03 against the 0.02 threshold on
// [Tablet Chrome].
//
// Hiding it trades away pixel coverage of the hero's type scale, spacing, image
// aspect and colour — a deliberate, accepted trade (SPEC.md §2). The structure
// is still covered: homepage.spec.ts:21-37 asserts the hero is visible, its
// title links, its excerpt renders and its CTA works, re-asserted at :174-180.
const HOMEPAGE_HERO = ['.hero-post'];

// `listing: true` marks a page whose body is a `.topic-grid` of post cards.
// Those pages re-render on every published article, so they are captured
// differently — see the `toHaveScreenshot` call below.
//
// It must be set on EVERY grid page, not just the obvious two. The three
// category pages were added full-page in #1138 and re-baselined on every
// publish into their category, which is exactly the coupling the flag exists
// to break — the gate billed a baseline re-seed as the price of shipping an
// article.
//
// `listing: true` is necessary but not sufficient on the homepage: it is the
// only listing page that renders volatile content OUTSIDE the grid, so it also
// names `.hero-post` in `volatile`. The other listing pages have nothing above
// the grid that a publish can move.
const PAGES: { name: string; path: string; listing?: boolean; volatile?: string[] }[] = [
  { name: 'homepage', path: '/', listing: true, volatile: HOMEPAGE_HERO },
  { name: 'blog-index', path: '/blog/', listing: true },
  { name: 'post-testing-times', path: '/2025/12/31/testing-times/', volatile: POST_CROSS_LINKS },
  // Permalink is /2026/01/02/ — the post is dated 2026-01-02. This pointed at
  // /2026/01/01/ from #1119 until #1160, so the scenario silently baselined the
  // 404 page (a telltale 1920x1080 capture) instead of the article.
  {
    name: 'post-self-healing-tests',
    path: '/2026/01/02/self-healing-tests-myth-vs-reality/',
    volatile: POST_CROSS_LINKS,
  },
  { name: 'about', path: '/about/' },
  // Gap-B page types — category landing pages, search, and the 404 page. The
  // 404 page is built to /404/index.html (pretty permalinks), so it is served
  // at /404/, not /404.html (which correctly returns a real 404).
  //
  // The category pages render `.topic-grid` from `site.posts` filtered by
  // category, so they are listing pages in exactly the same sense as home and
  // /blog/ — one publish into a category re-flows its grid.
  { name: 'category-security', path: '/security/', listing: true },
  { name: 'category-software-engineering', path: '/software-engineering/', listing: true },
  { name: 'category-test-automation', path: '/test-automation/', listing: true },
  // /search/ has no `.topic-grid`: results are rendered client-side into a
  // separate container and the unqueried page is static, so it stays full-page.
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

  for (const { name, path, listing, volatile } of PAGES) {
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

      // Drop this page's volatile blocks before measuring, so what remains
      // depends only on the page itself and not on what happens to be published.
      //
      // On post pages that is the cross-links, which sit below the article — so
      // removing them keeps everything this gate exists to check (masthead,
      // hero, body typography, share controls, newsletter CTA, footer) while
      // making the page height depend only on the article. Their links are
      // exercised by content-edge-cases.spec.ts, though only permissively (the
      // assertions are conditional on the section being present), so this does
      // thin their coverage rather than duplicate it.
      //
      // On the homepage it is the hero, which sits ABOVE the masked grid and so
      // shifts it — see HOMEPAGE_HERO for the trade and what still covers it.
      if (volatile?.length) {
        await page.addStyleTag({
          content: `${volatile.join(', ')} { display: none !important; }`,
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
