import { test, expect, request as playwrightRequest } from '@playwright/test';

/**
 * Page-chrome invariant — @REQ-PAGE-CHROME
 *
 * A NON-screenshot companion to the pixel gate (visual-snapshot.spec.ts) that
 * closes the structural half of Gap B in docs/agents/visual-audit-findings.md:
 * "Whole page types are never loaded by any gate."
 *
 * Where the pixel gate baselines a fixed, enumerated list of URLs, this test
 * walks EVERY published page — every <loc> in the built sitemap.xml — and
 * asserts each one is a real, fully-chromed document: a doctype, an <html>
 * root, the site navigation, and the site footer. One test therefore catches
 * any future layout-less stray page (the exact defect behind the retired,
 * un-chromed /agents/* prompt pages, which shipped "published and in
 * sitemap.xml" as raw black-on-white fragments) without anyone having to
 * remember to add it to a screenshot list.
 *
 * Why sitemap.xml as the source of truth: it is precisely the set of pages the
 * site publishes to readers and crawlers. Deliberately un-chromed internal
 * tools (the noindex Playwright healing dashboard at /dashboard/) and utility
 * routes excluded from the sitemap (e.g. /search/, which sets sitemap:false)
 * are intentionally out of scope here — those are covered, where it matters, by
 * the pixel gate instead. If a stray page ever becomes reader-facing it will
 * enter the sitemap and this invariant will immediately require it to carry the
 * full site chrome.
 *
 * This test is markup-only (HTTP + string assertions), so unlike the pixel gate
 * it runs on every platform, not just Linux.
 */

// Utility routes that legitimately carry no site chrome and must be skipped.
// Google Search Console verification files (/google<hex>.html) are required by
// Google to contain ONLY the verification token — adding chrome would break
// verification. They land in the sitemap as a build quirk but are not pages.
const CHROME_EXEMPT: RegExp[] = [/^\/google[0-9a-f]+\.html$/i];

// Stable chrome markers emitted by _layouts/default.html for every real page.
const CHROME_CHECKS: { label: string; pattern: RegExp }[] = [
  { label: 'doctype', pattern: /<!doctype html>/i },
  { label: '<html> root', pattern: /<html[\s>]/i },
  { label: 'site navigation (#site-navigation)', pattern: /id=["']site-navigation["']/i },
  { label: 'site footer (.site-footer)', pattern: /class=["'][^"']*\bsite-footer\b/i },
];

test.describe('@chrome Page chrome invariant @REQ-PAGE-CHROME', () => {
  test('every published page (sitemap.xml) renders full site chrome', async ({ baseURL }) => {
    const api = await playwrightRequest.newContext({ baseURL });

    // Pull the freshly built sitemap over HTTP so this test needs no knowledge
    // of the _site/ path layout and works identically in CI and locally.
    const sitemapRes = await api.get('/sitemap.xml');
    expect(sitemapRes.ok(), 'sitemap.xml should be served').toBeTruthy();
    const sitemapXml = await sitemapRes.text();

    // Convert each absolute <loc> to a server-relative path.
    const locs = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((m) => m[1].trim());
    const paths = locs
      .map((loc) => {
        try {
          return new URL(loc).pathname;
        } catch {
          return loc;
        }
      })
      .filter((path) => !CHROME_EXEMPT.some((re) => re.test(path)));

    expect(paths.length, 'sitemap.xml should list at least one page').toBeGreaterThan(0);

    const failures: string[] = [];

    for (const path of paths) {
      const res = await api.get(path);
      if (!res.ok()) {
        failures.push(`${path} — HTTP ${res.status()} (page not served)`);
        continue;
      }
      const html = await res.text();
      const missing = CHROME_CHECKS.filter(({ pattern }) => !pattern.test(html)).map(
        ({ label }) => label,
      );
      if (missing.length > 0) {
        failures.push(`${path} — missing: ${missing.join(', ')}`);
      }
    }

    await api.dispose();

    expect(
      failures,
      `The following published pages are missing required site chrome ` +
        `(doctype / <html> / #site-navigation / .site-footer):\n  ${failures.join('\n  ')}`,
    ).toEqual([]);
  });
});
