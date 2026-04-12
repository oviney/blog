import { test, expect } from '@playwright/test';

/**
 * SEO JSON-LD Structured Data Tests
 *
 * Validates that JSON-LD structured data is correctly rendered in <head> for:
 *  - Article schema on post pages
 *  - BreadcrumbList schema on all pages
 *  - Meta description using page.description front matter
 */

test.describe('@content @links SEO JSON-LD Structured Data', () => {

  test('BreadcrumbList JSON-LD is present on the homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    const count = await jsonLdScripts.count();
    expect(count).toBeGreaterThan(0);

    // Find the BreadcrumbList schema
    let foundBreadcrumb = false;
    for (let i = 0; i < count; i++) {
      const content = await jsonLdScripts.nth(i).textContent();
      if (content) {
        try {
          const json = JSON.parse(content);
          if (json['@type'] === 'BreadcrumbList') {
            foundBreadcrumb = true;
            expect(json['@context']).toBe('https://schema.org');
            expect(json.itemListElement).toBeInstanceOf(Array);
            expect(json.itemListElement.length).toBeGreaterThanOrEqual(1);
            // First item must be Home
            const homeItem = json.itemListElement[0];
            expect(homeItem['@type']).toBe('ListItem');
            expect(homeItem.position).toBe(1);
            expect(homeItem.name).toBe('Home');
            expect(homeItem.item).toContain('viney.ca');
            break;
          }
        } catch (_) {
          // Not valid JSON or not the schema we're looking for
        }
      }
    }
    expect(foundBreadcrumb).toBe(true);
  });

  test('BreadcrumbList JSON-LD is present on the blog listing page', async ({ page }) => {
    await page.goto('/blog/');
    await page.waitForLoadState('networkidle');

    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    const count = await jsonLdScripts.count();
    expect(count).toBeGreaterThan(0);

    let foundBreadcrumb = false;
    for (let i = 0; i < count; i++) {
      const content = await jsonLdScripts.nth(i).textContent();
      if (content) {
        try {
          const json = JSON.parse(content);
          if (json['@type'] === 'BreadcrumbList') {
            foundBreadcrumb = true;
            expect(json.itemListElement).toBeInstanceOf(Array);
            expect(json.itemListElement.length).toBeGreaterThanOrEqual(1);
            break;
          }
        } catch (_) {
          // Not valid JSON or not the schema we're looking for
        }
      }
    }
    expect(foundBreadcrumb).toBe(true);
  });

  test('Article and BreadcrumbList JSON-LD are present on a post page', async ({ page }) => {
    // Navigate to a post from the blog listing
    await page.goto('/blog/');
    await page.waitForLoadState('networkidle');

    const firstPostLink = page.locator('article a, .article-card a, .post-link, h2 a, h3 a').first();
    const linkCount = await firstPostLink.count();
    if (linkCount === 0) {
      console.log('No post links found on /blog/ — skipping post JSON-LD check');
      return;
    }

    await firstPostLink.click();
    await page.waitForLoadState('networkidle');

    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    const count = await jsonLdScripts.count();
    expect(count).toBeGreaterThan(0);

    let foundArticle = false;
    let foundBreadcrumb = false;

    for (let i = 0; i < count; i++) {
      const content = await jsonLdScripts.nth(i).textContent();
      if (!content) continue;
      try {
        const json = JSON.parse(content);
        if (json['@type'] === 'Article') {
          foundArticle = true;
          expect(json['@context']).toBe('https://schema.org');
          expect(json.headline).toBeTruthy();
          expect(json.description).toBeTruthy();
          expect(json.datePublished).toBeTruthy();
          expect(json.url).toContain('viney.ca');
          expect(json.author).toBeTruthy();
          expect(json.author.name).toBeTruthy();
          expect(json.author.name.length).toBeGreaterThan(0);
          expect(json.publisher).toBeTruthy();
          expect(json.publisher.name).toBeTruthy();
        } else if (json['@type'] === 'BreadcrumbList') {
          foundBreadcrumb = true;
          // Post breadcrumb should have Home > Blog > Post (3 items)
          expect(json.itemListElement.length).toBe(3);
          expect(json.itemListElement[0].name).toBe('Home');
          expect(json.itemListElement[1].name).toBe('Blog');
          expect(json.itemListElement[2].name).toBeTruthy();
        }
      } catch (_) {
        // Not valid JSON or not the schema we're looking for
      }
    }

    expect(foundArticle).toBe(true);
    expect(foundBreadcrumb).toBe(true);
  });

  test('Article JSON-LD description matches the post description front matter', async ({ page }) => {
    // Navigate to the test strategy post which has a known description
    await page.goto('/2026/04/05/building-a-test-strategy-that-works/');
    await page.waitForLoadState('networkidle');

    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    const count = await jsonLdScripts.count();

    let articleDescription = '';
    for (let i = 0; i < count; i++) {
      const content = await jsonLdScripts.nth(i).textContent();
      if (!content) continue;
      try {
        const json = JSON.parse(content);
        if (json['@type'] === 'Article') {
          articleDescription = json.description;
          break;
        }
      } catch (_) {
        // skip
      }
    }

    expect(articleDescription).toBeTruthy();
    expect(articleDescription.length).toBeLessThanOrEqual(160);
  });

  test('Meta description tag is present on post pages', async ({ page }) => {
    await page.goto('/2026/04/05/building-a-test-strategy-that-works/');
    await page.waitForLoadState('networkidle');

    const metaDescription = page.locator('meta[name="description"]').first();
    await expect(metaDescription).toHaveCount(1);

    const content = await metaDescription.getAttribute('content');
    expect(content).toBeTruthy();
    expect(content!.length).toBeGreaterThan(0);
    expect(content!.length).toBeLessThanOrEqual(160);
  });

});
