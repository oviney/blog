import { test, expect } from '@playwright/test';

/**
 * Sitemap exclusion regression tests (GH-1053 / BLOG-002)
 *
 * Internal utility surfaces — the observability dashboards and the internal
 * agent-persona pages — must not appear in the generated XML sitemap, and any
 * utility page that stays publicly reachable must be non-indexable. Editorial
 * content (posts, topic pages, core pages, pagination) must remain present.
 */

const EXCLUDED_SITEMAP_PATHS = [
  '/dashboard/',
  '/dashboard/agents.html',
  '/agents/code-reviewer/',
  '/agents/security-auditor/',
  '/agents/test-engineer/',
];

// Internal agent-persona definitions live in the repo-root `agents/` dir and
// carry `published: false`. They must never build into reachable site pages —
// a 200 here means the front-matter guard was removed and the internal agent
// prompts leaked back into the published site (GH-1053 root cause).
const INTERNAL_AGENT_PATHS = [
  '/agents/code-reviewer/',
  '/agents/security-auditor/',
  '/agents/test-engineer/',
];

const RETAINED_SITEMAP_PATHS = [
  '/',
  '/about/',
  '/blog/',
  '/blog/page2/',
  '/test-automation/',
  '/2026/01/02/self-healing-tests-myth-vs-reality/',
];

test.describe('@seo @links Sitemap utility-page exclusions @REQ-CONTENT-01', () => {
  test('excluded utility URLs are absent from the sitemap', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.ok()).toBe(true);

    const sitemap = await response.text();
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

    for (const path of EXCLUDED_SITEMAP_PATHS) {
      const leaked = locs.filter((loc) => new URL(loc).pathname === path);
      expect(leaked, `sitemap should not advertise ${path}`).toHaveLength(0);
    }
  });

  test('editorial and core URLs remain present in the sitemap', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.ok()).toBe(true);

    const sitemap = await response.text();
    const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);

    for (const path of RETAINED_SITEMAP_PATHS) {
      expect(paths, `sitemap should still advertise ${path}`).toContain(path);
    }
  });

  test('internal agent-persona pages are not served as built site pages', async ({ page }) => {
    for (const path of INTERNAL_AGENT_PATHS) {
      const response = await page.goto(path);
      // published:false means Jekyll never builds these — the route must not
      // resolve to a 200/styled page. A 200 here is the leak regression.
      expect(response?.ok(), `${path} must not be served as a built page`).toBe(false);
    }
  });

  test('dashboard pages that stay reachable are non-indexable', async ({ page }) => {
    for (const path of ['/dashboard/', '/dashboard/agents.html']) {
      const response = await page.goto(path);
      expect(response?.ok(), `${path} should still be reachable`).toBe(true);

      const robots = page.locator('head meta[name="robots"]');
      await expect(robots, `${path} should declare a robots meta`).toHaveCount(1);
      expect((await robots.getAttribute('content'))?.toLowerCase()).toContain('noindex');
    }
  });
});
