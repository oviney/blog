import { test, expect } from '@playwright/test';

test.use({ baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4000' });

/**
 * Gap D — content/markup-quality assertions on built HTML.
 *
 * See docs/agents/visual-audit-findings.md §3 "Gap D". The blocking specs
 * historically checked structure/role/byline but never the *content* of the
 * built markup: teaser text, the newsletter allowlist,
 * or raw-PNG usage where a WebP sibling exists. These describe blocks
 * guard the already-fixed defects (#4/#5, #3-metadata, #16, #8) so they cannot
 * silently regress.
 */

// Listing surfaces that render post-teaser cards, with the excerpt selector
// each surface uses. Home mixes a hero excerpt with topic cards.
const LISTING_SURFACES: { name: string; path: string; excerptSelector: string }[] = [
  // The 2026 redesign replaced the homepage hero + `.topic-grid` with a lead
  // story and a rail; its teaser excerpts are now `.h26-lead-excerpt` and
  // `.h26-rail-excerpt`.
  { name: 'homepage', path: '/', excerptSelector: '.h26-lead-excerpt, .h26-rail-excerpt' },
  // #1123 extracted the canonical post-card include, so /blog/ renders
  // .topic-card-excerpt like every other listing surface. The old
  // .econ-card-excerpt selector matched nothing, and the test failed on its own
  // "expected at least one teaser card" guard rather than on teaser content.
  { name: 'blog index', path: '/blog/', excerptSelector: '.topic-card-excerpt' },
  { name: 'security topic', path: '/security/', excerptSelector: '.topic-card-excerpt' },
  { name: 'software-engineering topic', path: '/software-engineering/', excerptSelector: '.topic-card-excerpt' },
  { name: 'test-automation topic', path: '/test-automation/', excerptSelector: '.topic-card-excerpt' },
];

// ---------------------------------------------------------------------------
// (a) No teaser lede reads "Source:" (defect #4/#5 — chart "Source:" caption
//     leaking into the auto-excerpt). Teasers must prefer the human-written
//     front-matter `description`.
// ---------------------------------------------------------------------------
test.describe('@content Teaser ledes never start with "Source:" @REQ-CONTENT-03', () => {
  for (const { name, path, excerptSelector } of LISTING_SURFACES) {
    test(`${name} (${path}) has no "Source:" teaser lede`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');

      const cards = page.locator(excerptSelector);
      const count = await cards.count();
      expect(count, `expected at least one teaser card on ${path}`).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        const text = ((await cards.nth(i).textContent()) || '').trim();
        expect(text, `teaser #${i} on ${path} leads with "Source:"`).not.toMatch(/^\s*source:/i);
      }
    });
  }
});

// Head-tag uniqueness is covered by seo-metadata-dedupe.spec.ts.

// ---------------------------------------------------------------------------
// (c) Newsletter signup allowlist (defect #16). The `aside.newsletter-signup`
//     CTA must appear on content-consumption surfaces and must be absent on the
//     utility pages (/search/ and /404/) where it has no place.
//
//     The shared default layout already implements this allowlist. Every
//     case is active so a missing include or duplicate CTA is a failure.
// ---------------------------------------------------------------------------
const NEWSLETTER = 'aside.newsletter-signup';

const NEWSLETTER_PRESENT: { label: string; path: string }[] = [
  { label: 'Homepage', path: '/' },
  { label: 'Article', path: '/2026/01/02/self-healing-tests-myth-vs-reality/' },
  { label: 'Blog index', path: '/blog/' },
  { label: 'Security category', path: '/security/' },
  { label: 'Software Engineering category', path: '/software-engineering/' },
  { label: 'Test Automation category', path: '/test-automation/' },
  { label: 'About', path: '/about/' },
];

const NEWSLETTER_ABSENT: { label: string; path: string }[] = [
  { label: 'Search', path: '/search/' },
  { label: '404', path: '/404/' },
];

test.describe('@content Newsletter signup follows the page-type allowlist @REQ-CONTENT-04', () => {
  for (const { label, path } of NEWSLETTER_PRESENT) {
    test(`${label} (${path}) renders the newsletter CTA`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status(), `${path} should return 200`).toBe(200);
      const newsletter = page.locator(NEWSLETTER);
      await expect(newsletter, `${path} should render exactly one ${NEWSLETTER}`).toHaveCount(1);
      await expect(newsletter, `${path} should expose the CTA to readers`).toBeVisible();
    });
  }

  for (const { label, path } of NEWSLETTER_ABSENT) {
    test(`${label} (${path}) does not render the newsletter CTA`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator(NEWSLETTER), `${path} must not render ${NEWSLETTER}`).toHaveCount(0);
    });
  }
});

// ---------------------------------------------------------------------------
// (d) No card/listing thumbnail is a raw <img> PNG when a WebP sibling exists
//     (defect #8 — category cards bypassing the responsive-image WebP include).
//     A PNG <img> nested inside a <picture> that offers a WebP <source> is the
//     correct fallback and is allowed; only *raw* PNGs outside any <picture>
//     that have a same-name .webp on disk are a regression.
// ---------------------------------------------------------------------------
const CARD_SURFACES = ['/', '/blog/', '/security/', '/software-engineering/', '/test-automation/'];

test.describe('@content Listing thumbnails prefer WebP over raw PNG @REQ-CONTENT-02', () => {
  for (const path of CARD_SURFACES) {
    test(`${path} has no raw PNG <img> with a WebP sibling`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');

      // Collect PNG <img> sources that are NOT inside a <picture> element.
      const rawPngSrcs = await page.$$eval('img', (imgs) =>
        imgs
          .filter((img) => !img.closest('picture'))
          .map((img) => img.getAttribute('src') || '')
          .filter((src) => /\.png(?:$|\?)/i.test(src)),
      );

      const withWebpSibling: string[] = [];
      for (const src of rawPngSrcs) {
        const webp = src.replace(/\.png(\?.*)?$/i, '.webp');
        const res = await page.request.head(webp);
        if (res.ok()) withWebpSibling.push(src);
      }

      expect(
        withWebpSibling,
        `${path}: these raw PNG <img> have a WebP sibling and must be routed through <picture>: ${withWebpSibling.join(', ')}`,
      ).toEqual([]);
    });
  }
});
