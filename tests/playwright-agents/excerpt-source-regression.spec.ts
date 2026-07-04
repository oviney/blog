import { test, expect } from '@playwright/test';

test.use({ baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4000' });

// Guard against regression where a post body opens with a chart image + an
// italic "*Source: …*" caption, causing Jekyll's AUTO excerpt to start with
// "Source:". Teaser cards must prefer the human-written front-matter
// `description` so no card lede reads "Source: …".
const surfaces: { name: string; path: string; selector: string }[] = [
  { name: 'homepage', path: '/', selector: '.hero-post-excerpt, .topic-card-excerpt' },
  { name: 'blog index', path: '/blog/', selector: '.topic-card-excerpt' },
  { name: 'security topic', path: '/security/', selector: '.topic-card-excerpt' },
];

test.describe('@content Teaser excerpts never lead with chart "Source:" @REQ-CONTENT-03', () => {
  for (const { name, path, selector } of surfaces) {
    test(`${name} cards do not render a "Source:" lede`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const cards = page.locator(selector);
      const count = await cards.count();
      expect(count, `expected at least one teaser card on ${path}`).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        const text = ((await cards.nth(i).textContent()) || '').trim();
        expect(text, `teaser #${i} on ${path} leads with "Source:"`).not.toMatch(/^source:/i);
      }
    });
  }
});
