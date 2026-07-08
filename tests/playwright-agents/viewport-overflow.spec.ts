import { test, expect } from '@playwright/test';

/**
 * Viewport Overflow Regression Guard — closes Gap C of
 * docs/agents/visual-audit-findings.md ("No viewport-overflow assertion
 * anywhere").
 *
 * No existing spec compares document.documentElement.scrollWidth to
 * clientWidth, so any page that gains horizontal scroll on a phone (defects
 * #2, #6, and the live /dashboard/agents.html overflow, P3 #13) ships
 * undetected. This spec loads every page type at a 320x568 Mobile-Chrome
 * viewport and asserts the document never scrolls sideways, plus a 390px pass
 * over the chart-bearing posts named in the catalog.
 *
 * On failure it reports the first element whose getBoundingClientRect().right
 * exceeds the viewport clientWidth so the offending node is named directly.
 */

const MOBILE = { width: 320, height: 568 };
const CHART_WIDE = { width: 390, height: 844 };

// One representative URL per page type on viney.ca.
const PAGE_TYPES: { name: string; url: string }[] = [
  { name: 'home', url: '/' },
  { name: 'blog index', url: '/blog/' },
  { name: 'category (security)', url: '/security/' },
  { name: 'article', url: '/2026/01/19/the-surprising-economics-of-test-automation-roi/' },
  { name: 'about', url: '/about/' },
  { name: 'dashboard', url: '/dashboard/agents.html' },
  { name: 'search', url: '/search/' },
  { name: '404', url: '/404.html' },
];

// Chart-bearing posts from the catalog's P2 overflow row — re-checked at 390px.
const CHART_POSTS: { name: string; url: string }[] = [
  { name: 'test-automation-roi', url: '/2026/01/19/the-surprising-economics-of-test-automation-roi/' },
  { name: 'platform-engineering-adoption-crisis', url: '/2026/04/12/platform-engineering-adoption-crisis/' },
  { name: 'hidden-economics-of-security-debt', url: '/2026/04/12/the-hidden-economics-of-security-debt/' },
];

/**
 * Measures horizontal overflow against the document element and, when it
 * overflows, describes the first element whose right edge crosses clientWidth.
 */
async function measureOverflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const clientWidth = doc.clientWidth;
    const scrollWidth = doc.scrollWidth;

    let offender: string | null = null;
    if (scrollWidth > clientWidth + 1) {
      const all = Array.from(document.body.querySelectorAll('*')) as HTMLElement[];
      for (const el of all) {
        const rect = el.getBoundingClientRect();
        // Ignore zero-area / hidden nodes; flag the first painted node that
        // extends past the right edge of the viewport.
        if (rect.width > 0 && rect.height > 0 && rect.right > clientWidth + 1) {
          const id = el.id ? `#${el.id}` : '';
          const cls = el.className && typeof el.className === 'string'
            ? `.${el.className.trim().split(/\s+/).join('.')}`
            : '';
          offender = `${el.tagName.toLowerCase()}${id}${cls} (right=${Math.round(rect.right)}px)`;
          break;
        }
      }
    }
    return { scrollWidth, clientWidth, offender };
  });
}

test.describe('@visual Viewport Overflow @REQ-VISUAL-01', () => {

  for (const { name, url } of PAGE_TYPES) {
    test(`${name} does not scroll horizontally at 320px`, async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      const { scrollWidth, clientWidth, offender } = await measureOverflow(page);

      expect(
        scrollWidth,
        `${name} (${url}) overflows at ${MOBILE.width}px: scrollWidth=${scrollWidth} > clientWidth=${clientWidth}` +
          (offender ? `; first offending element: ${offender}` : ''),
      ).toBeLessThanOrEqual(clientWidth + 1);
    });
  }

});

test.describe('@visual Chart Post Viewport Overflow @REQ-VISUAL-01', () => {

  for (const { name, url } of CHART_POSTS) {
    test(`${name} does not scroll horizontally at 390px`, async ({ page }) => {
      await page.setViewportSize(CHART_WIDE);
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      const { scrollWidth, clientWidth, offender } = await measureOverflow(page);

      expect(
        scrollWidth,
        `${name} (${url}) overflows at ${CHART_WIDE.width}px: scrollWidth=${scrollWidth} > clientWidth=${clientWidth}` +
          (offender ? `; first offending element: ${offender}` : ''),
      ).toBeLessThanOrEqual(clientWidth + 1);
    });
  }

});
