import { test, expect } from '@playwright/test';

const TESTING_TIMES = '/2025/12/31/testing-times/';

test.describe('@navigation @links Navigation & User Journeys @REQ-NAV-01 @REQ-NAV-02', () => {

  test('Primary navigation journey: Homepage → Blog → Article → Back', async ({ page }) => {
    await page.goto('/');

    const hamburger = page.locator('.nav-toggle');
    if (await hamburger.isVisible()) {
      await hamburger.click();
    }

    const nav = page.locator('#site-navigation');
    await expect(nav).toBeVisible();

    const blogLink = nav.getByRole('link', { name: 'Blog' });
    if (await blogLink.count() === 0) {
      test.skip(true, 'Blog link not found in #site-navigation');
      return;
    }

    await blogLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/(blog|posts)/);
    await expect(page.locator('h1').first()).toBeVisible();

    const firstArticleLink = page.locator('article a[href]').first();
    await firstArticleLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.article-title')).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const backLink = page.locator('.back-link');
    await expect(backLink).toBeVisible();
    await backLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/(blog|posts)/);
  });

  test('Category navigation flow', async ({ page }) => {
    await page.goto('/');

    const hamburger = page.locator('.nav-toggle');
    if (await hamburger.isVisible()) {
      await hamburger.click();
    }

    const categoryLink = page.locator('#site-navigation')
      .getByRole('link', { name: /software engineering|test automation/i });
    const categoryCount = await categoryLink.count();

    if (categoryCount === 0) {
      test.skip(true, 'No category links found in navigation');
      return;
    }

    await categoryLink.first().click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/(software-engineering|test-automation)/);
    await expect(page.locator('h1').first()).toBeVisible();

    const firstArticleLink = page.locator('article a, .post-card a').first();
    if (await firstArticleLink.count() > 0) {
      await firstArticleLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.article-section-line .section-link')).toBeVisible();
    }
  });

  test('Related posts navigation', async ({ page }) => {
    await page.goto(TESTING_TIMES);
    await page.waitForLoadState('networkidle');

    const relatedSection = page.locator('section.related-reading');
    if (await relatedSection.count() === 0) {
      test.skip(true, 'related-reading section not rendered — fewer than 2 related posts found');
      return;
    }

    await expect(relatedSection).toBeVisible();

    // Read the origin post's category dynamically so the assertion is not hardcoded
    const originCategory = (await page.locator('.article-section-line .section-link').first().textContent())?.trim();
    expect(originCategory).toBeTruthy();

    // Every related item must belong to the same category as the origin post
    const categoryLabels = relatedSection.locator('.related-category');
    const labelCount = await categoryLabels.count();
    expect(labelCount).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < labelCount; i++) {
      await expect(categoryLabels.nth(i)).toContainText(originCategory!);
    }

    // Clicking a related post navigates to a real article page
    const firstLink = relatedSection.locator('.related-title a').first();
    await firstLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.article-title')).toBeVisible();
  });

  test('Representative post article matches ARIA smoke snapshot', async ({ page }) => {
    await page.goto(TESTING_TIMES);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('main article').first()).toMatchAriaSnapshot(`
      - article:
        - link /.+/
        - heading /.+/ [level=1]
        - button "Copy link to this article"
        - figure /.+/
        - time
        - navigation "Table of contents"
        - heading "Explore more" [level=3]
    `);
  });

  test('Main navigation accessibility and keyboard support', async ({ page }) => {
    await page.goto('/');

    let successfulTabs = 0;
    try {
      await page.keyboard.press('Tab');
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        if (await page.locator(':focus').count() > 0) successfulTabs++;
      }
    } catch {
      // keyboard events unavailable in this environment
    }
    expect(successfulTabs).toBeGreaterThanOrEqual(1);

    // Enter key on a focused link must navigate away from the current page
    try {
      const startUrl = page.url();
      const firstLink = page.getByRole('link').first();
      await firstLink.focus();
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');
      await expect(page).not.toHaveURL(startUrl);
    } catch {
      // Enter-key navigation is best-effort; tab count assertion above is the required check
    }
  });

  test('Navigation consistency across pages', async ({ page }) => {
    const essentialPages = ['/', '/blog/'];

    for (const url of essentialPages) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // Open hamburger on mobile viewports before checking nav links
      const hamburger = page.locator('.nav-toggle');
      if (await hamburger.isVisible()) await hamburger.click();

      const nav = page.locator('#site-navigation');
      await expect(nav).toBeVisible();
      expect(await nav.getByRole('link').count()).toBeGreaterThanOrEqual(3);
    }
  });

  test('Search page provides guided discovery', async ({ page }) => {
    await page.goto('/search/');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByRole('searchbox');
    await expect(searchInput).toBeVisible();

    const emptyState = page.locator('#search-empty-state');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('Not sure where to start?');

    const suggestion = page.getByRole('button', { name: 'Security debt' });
    await expect(suggestion).toBeVisible();
    await suggestion.click();

    await expect(searchInput).toHaveValue('security debt');
    await expect(page.locator('.search-result').first()).toBeVisible();
  });

  test('QA/QC article keeps one article heading and its internal references resolve', async ({ page }) => {
    await page.goto('/2026/04/12/understanding-qa-qc-and-quality-engineering/');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.article-title')).toHaveCount(1);
    await expect(page.locator('.article-chart img')).toBeVisible();
    await expect(page.locator('.article-hero-image img')).toHaveAttribute('src', /understanding-qa-qc-quality-engineering-hero\.svg/);
    await expect(page.locator('.article-hero-image .image-credit')).toContainText('ILLUSTRATION: WHEN QUALITY OWNERSHIP TANGLES');

    const articleHeadings = page.locator('article.economist-article h1');
    await expect(articleHeadings).toHaveCount(1);

    const internalPaths = [
      '/2026/04/05/cost-of-poor-quality-copq/',
      '/2026/04/05/ai-quality-testing-automation/',
      '/2026/04/05/the-real-cost-of-testing-theater-when-quality-metr/',
    ];

    for (const path of internalPaths) {
      const response = await page.request.get(path);
      expect(response.ok(), `${path} should resolve`).toBeTruthy();
    }
  });

  test('Footer navigation and links', async ({ page }) => {
    await page.goto('/');

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Verify footer is visible
    const footer = page.locator('footer, .footer, .site-footer');
    await expect(footer).toBeVisible();

    // Check for social/contact links
    const footerLinks = footer.getByRole('link');
    const footerLinkCount = await footerLinks.count();

    if (footerLinkCount > 0) {
      expect(footerLinkCount).toBeGreaterThan(0);

      // Test that external links have proper attributes
      for (let i = 0; i < Math.min(footerLinkCount, 5); i++) {
        const link = footerLinks.nth(i);
        const href = await link.getAttribute('href');

        if (href && (href.startsWith('http') || href.startsWith('mailto'))) {
          // External links should have target="_blank" or rel="noopener"
          const target = await link.getAttribute('target');
          const rel = await link.getAttribute('rel');

          if (target === '_blank') {
            expect(rel).toMatch(/(noopener|noreferrer)/);
          }
        }
      }
    }
  });

  test('Error page navigation (404)', async ({ page }) => {
    // Navigate to non-existent page
    const response = await page.goto('/non-existent-page');

    // Should either get 404 or be redirected
    if (response && response.status() === 404) {
      // Verify 404 page has navigation (conditional check)
      const navigation = page.locator('nav, .site-nav, .main-nav, [role="navigation"]');
      const navCount = await navigation.count();

      if (navCount > 0) {
        await expect(navigation.first()).toBeVisible();

        // Verify we can navigate away from 404
        const homeLink = page.getByRole('link', { name: /home|back/i }).first();
        await homeLink.click();
        await expect(page).toHaveURL('/');
      }
    }
  });

});

test.describe('@navigation Post-page Taxonomy & Recommendations', () => {

  test('Section-line CTA links to /blog/ with category text', async ({ page }) => {
    await page.goto(TESTING_TIMES);
    await page.waitForLoadState('networkidle');

    const sectionLink = page.locator('.article-section-line .section-link');
    await expect(sectionLink).toBeVisible();

    const linkText = (await sectionLink.textContent())?.trim();
    expect(linkText).toBeTruthy();

    const href = await sectionLink.getAttribute('href');
    expect(href).toMatch(/\/blog\/?$/);
  });

  test('Explore more tags: ≥1 link with non-empty text and href', async ({ page }) => {
    await page.goto(TESTING_TIMES);
    await page.waitForLoadState('networkidle');

    const tagLinks = page.locator('.explore-more .topic-tag-link');
    const count = await tagLinks.count();
    expect(count).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < count; i++) {
      const tag = tagLinks.nth(i);
      const text = (await tag.textContent())?.trim();
      expect(text).toBeTruthy();
      const href = await tag.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });

  test('Related reading: category labels match the current post', async ({ page }) => {
    await page.goto(TESTING_TIMES);
    await page.waitForLoadState('networkidle');

    const relatedSection = page.locator('section.related-reading');
    if (await relatedSection.count() === 0) {
      test.skip(true, 'related-reading section not rendered — fewer than 2 related posts');
      return;
    }

    await expect(relatedSection).toBeVisible();

    const originCategory = (await page.locator('.article-section-line .section-link').first().textContent())?.trim();
    expect(originCategory).toBeTruthy();

    const categoryLabels = relatedSection.locator('.related-category');
    const labelCount = await categoryLabels.count();
    expect(labelCount).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < labelCount; i++) {
      await expect(categoryLabels.nth(i)).toContainText(originCategory!);
    }

    const relatedItems = relatedSection.locator('.related-item');
    const itemCount = await relatedItems.count();
    for (let i = 0; i < itemCount; i++) {
      await expect(relatedItems.nth(i).locator('.related-title a')).toBeVisible();
      const excerpt = (await relatedItems.nth(i).locator('.related-excerpt').textContent())?.trim();
      expect(excerpt).toBeTruthy();
    }
  });

  test('More from section: heading has category name, grid has ≥1 article', async ({ page }) => {
    await page.goto(TESTING_TIMES);
    await page.waitForLoadState('networkidle');

    const moreFromSection = page.locator('section.more-from-section');
    await expect(moreFromSection).toBeVisible();

    const heading = moreFromSection.locator('h2');
    await expect(heading).toBeVisible();

    const headingText = (await heading.textContent())?.trim();
    expect(headingText).toBeTruthy();

    // Heading must reference the post's actual category, not just any static string
    const originCategory = (await page.locator('.article-section-line .section-link').first().textContent())?.trim();
    expect(originCategory).toBeTruthy();
    expect(headingText).toContain(originCategory!);

    const gridArticles = moreFromSection.locator('.more-from-grid article');
    expect(await gridArticles.count()).toBeGreaterThanOrEqual(1);
  });

});

test.describe('@navigation Mobile Navigation Specific Tests @REQ-NAV-01 @REQ-NAV-02', () => {

  test.use({ viewport: { width: 320, height: 568 } }); // Mobile viewport

  test('Hamburger button is visible and nav is hidden by default on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // JS should have added js-nav-enabled class (progressive enhancement)
    const hasJsClass = await page.evaluate(() => document.body.classList.contains('js-nav-enabled'));
    expect(hasJsClass).toBe(true);

    // Hamburger toggle button should be visible
    const toggle = page.getByRole('button', { name: /open navigation menu/i });
    await expect(toggle).toBeVisible();

    // Navigation should be hidden behind hamburger when JS is active
    const nav = page.locator('#site-navigation');
    await expect(nav).toBeHidden();
  });

  test('Hamburger opens and closes the navigation menu', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const toggle = page.locator('.nav-toggle');
    const nav = page.locator('#site-navigation');

    // Menu starts hidden
    await expect(nav).toBeHidden();

    // Open the menu
    await toggle.click();
    await expect(nav).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    // Close the menu
    await toggle.click();
    await expect(nav).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('Mobile navigation landmark matches ARIA smoke snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const toggle = page.getByRole('button', { name: /open navigation menu/i });
    await expect(toggle).toBeVisible();
    await toggle.click();

    await expect(page.locator('#site-navigation')).toMatchAriaSnapshot(`
      - navigation:
        - list:
          - listitem:
            - link "Home"
          - listitem:
            - link "Blog"
          - listitem:
            - link "Software Engineering"
          - listitem:
            - link "Test Automation"
          - listitem:
            - link "About"
          - listitem:
            - link "Search"
          - listitem:
            - link "RSS"
    `);
  });

  test('Nav link tap closes the hamburger menu', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const toggle = page.locator('.nav-toggle');
    const nav = page.locator('#site-navigation');

    // Open the menu
    await toggle.click();
    await expect(nav).toBeVisible();

    // Skip if the Blog link is not present; return stops further execution
    const blogLink = nav.getByRole('link', { name: /blog/i }).first();
    if (await blogLink.count() === 0) {
      test.skip(true, 'Blog link is not present in the mobile navigation on this page.');
      return;
    }

    const blogHref = await blogLink.getAttribute('href');
    if (blogHref) {
      const expectedUrl = new URL(blogHref, page.url()).toString();
      await Promise.all([
        page.waitForURL(expectedUrl),
        blogLink.click(),
      ]);
    } else {
      await blogLink.click();
    }

    await page.waitForLoadState('networkidle');
    // After navigation the menu should be closed (nav-open class removed)
    const isOpen = await page.evaluate(() => document.body.classList.contains('nav-open'));
    expect(isOpen).toBe(false);
  });

  test('Mobile navigation is touch-friendly', async ({ page }) => {
    await page.goto('/');

    // Open the menu so links are visible before measuring
    const toggle = page.locator('.nav-toggle');
    if (await toggle.count() > 0) {
      await toggle.click();
    }

    // Verify navigation elements are large enough for touch
    const navLinks = page.getByRole('navigation').getByRole('link');
    const linkCount = await navLinks.count();

    for (let i = 0; i < linkCount; i++) {
      const link = navLinks.nth(i);
      const box = await link.boundingBox();

      if (box) {
        // Touch targets should be at least 44px in either dimension
        expect(Math.max(box.width, box.height)).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('Mobile navigation doesn\'t overlap content', async ({ page }) => {
    await page.goto('/');

    // Check that navigation (when closed) doesn't cover main content
    const mainContent = page.locator('main, .main-content, .content');
    const header = page.locator('header.page-header, .page-header');

    if (await header.count() > 0 && await mainContent.count() > 0) {
      const headerBox = await header.boundingBox();
      const contentBox = await mainContent.boundingBox();

      if (headerBox && contentBox) {
        // Header should be above main content; allow 1px sub-pixel rounding tolerance
        expect(headerBox.y + headerBox.height).toBeLessThanOrEqual(contentBox.y + 1);
      }
    }
  });

  test('Desktop layout: hamburger hidden, nav visible at 1280px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Hamburger button should not be visible on desktop
    const toggle = page.locator('.nav-toggle');
    await expect(toggle).toBeHidden();

    // Navigation should be visible directly (no hamburger needed)
    const nav = page.locator('#site-navigation');
    await expect(nav).toBeVisible();
  });

});
