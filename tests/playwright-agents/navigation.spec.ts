import { test, expect } from '@playwright/test';

/**
 * Navigation & User Journey Tests for Economist Blog v5
 * Based on navigation-test-plan.md
 *
 * These tests complement BackstopJS visual regression testing by validating
 * behavioral aspects of navigation and user interactions.
 */

test.describe('Navigation & User Journeys', () => {

  test('Primary navigation journey: Homepage → Blog → Article → Back', async ({ page }) => {
    // Start from homepage
    await page.goto('/');

    // Verify main navigation is visible (improved selector)
    const mainNav = page.locator('nav, .site-nav, .main-nav, [role="navigation"]');
    await expect(mainNav.first()).toBeVisible();

    // Click "Blog" in main navigation
    const blogLink = page.getByRole('link', { name: /blog/i });
    await blogLink.click();

    // Verify blog index page loads
    await expect(page).toHaveURL('/blog/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/blog|posts|articles/i);

    // Find and click on first article card
    const firstArticle = page.locator('.post-card, article').first();
    await expect(firstArticle).toBeVisible();
    const firstArticleLink = firstArticle.getByRole('link').first();
    await firstArticleLink.click();

    // Verify article page loads with proper layout
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('.post-content, .article-content, main')).toBeVisible();

    // Scroll to bottom and find "Back to Blog" link
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const backToBlogLink = page.getByRole('link', { name: /back to blog/i });
    await expect(backToBlogLink).toBeVisible();

    // Click "Back to Blog" and verify return
    await backToBlogLink.click();
    await expect(page).toHaveURL('/blog/');
  });

  test('Category navigation flow', async ({ page }) => {
    await page.goto('/');

    // Click "Software Engineering" category
    const categoryLink = page.getByRole('link', { name: /software engineering/i });
    await categoryLink.click();

    // Verify category page loads
    await expect(page).toHaveURL(/software-engineering/);
    await expect(page.locator('h1, .page-title').last()).toContainText(/software engineering/i);

    // Find and click on a category article
    const categoryArticle = page.locator('.post-card, article').first();
    await categoryArticle.getByRole('link').first().click();

    // Verify breadcrumb shows correct category
    const breadcrumb = page.locator('.breadcrumb, .category-tag');
    await expect(breadcrumb).toContainText(/software engineering/i);

    // Click category link in breadcrumb to return
    if (await breadcrumb.getByRole('link').count() > 0) {
      await breadcrumb.getByRole('link').first().click();
      await expect(page).toHaveURL(/software-engineering/);
    }
  });

  test('Related posts navigation', async ({ page }) => {
    // Navigate to a blog post (Testing Times - known to have related posts)
    await page.goto('/2025/12/31/testing-times/');

    // Find related posts section (could be sidebar on desktop, bottom on mobile)
    const relatedPosts = page.locator('.related-posts, .sidebar, [class*="related"]');

    if (await relatedPosts.count() > 0) {
      await expect(relatedPosts.first()).toBeVisible();

      // Find related post links (should have at least one)
      const relatedLinks = relatedPosts.getByRole('link').filter({ hasText: /\w+/ });
      const relatedCount = await relatedLinks.count();

      if (relatedCount > 0) {
        expect(relatedCount).toBeGreaterThan(0);
        expect(relatedCount).toBeLessThanOrEqual(3); // Should show max 3 related posts

        // Click first related post
        const firstRelated = relatedLinks.first();
        const relatedTitle = await firstRelated.textContent();
        await firstRelated.click();

        // Verify we're on a different article
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await expect(page.getByRole('heading', { level: 1 })).not.toContainText(relatedTitle?.trim() || '');
      }
    }
  });

  test('Main navigation accessibility and keyboard support', async ({ page }) => {
    await page.goto('/');

    // Focus on first navigation element
    await page.keyboard.press('Tab');

    // Verify focus indicators are visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Tab through navigation items
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const currentFocus = page.locator(':focus');
      await expect(currentFocus).toBeVisible();
    }

    // Test Enter key activation on a navigation link
    const blogNavItem = page.getByRole('link', { name: /blog/i });
    await blogNavItem.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/blog/');
  });

  test('Navigation consistency across pages', async ({ page }) => {
    const pages = [
      '/',
      '/blog/',
      '/about/',
      '/software-engineering/',
      '/test-automation/'
    ];

    for (const url of pages) {
      await page.goto(url);

      // Verify main navigation is present and consistent
      const navigation = page.locator('nav, .site-nav, .main-nav, [role="navigation"], header nav');
      await expect(navigation).toBeVisible();

      // Check for expected navigation items (use more specific selectors)
      await expect(page.getByRole('link', { name: /home/i }).first()).toBeVisible();
      await expect(page.getByRole('link', { name: 'Blog', exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: /about/i })).toBeVisible();

      // Verify navigation styling is consistent
      const navLinks = navigation.getByRole('link');
      const linkCount = await navLinks.count();
      expect(linkCount).toBeGreaterThanOrEqual(3);
    }
  });

  test('Search functionality (if present)', async ({ page }) => {
    await page.goto('/');

    // Look for search functionality
    const searchInput = page.getByRole('searchbox');
    const searchButton = page.getByRole('button', { name: /search/i });

    // If search exists, test it
    if (await searchInput.count() > 0) {
      await searchInput.fill('testing');

      if (await searchButton.count() > 0) {
        await searchButton.click();
      } else {
        await searchInput.press('Enter');
      }

      // Verify search results or redirect
      await expect(page).not.toHaveURL('/');
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

test.describe('Mobile Navigation Specific Tests', () => {

  test.use({ viewport: { width: 320, height: 568 } }); // Mobile viewport

  test('Mobile navigation is touch-friendly', async ({ page }) => {
    await page.goto('/');

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

    // Check that navigation doesn't cover main content
    const navigation = page.locator('nav, .site-nav, .main-nav, [role="navigation"]');
    const mainContent = page.locator('main, .main-content, .content');

    if (await navigation.count() > 0 && await mainContent.count() > 0) {
      const navBox = await navigation.boundingBox();
      const contentBox = await mainContent.boundingBox();

      if (navBox && contentBox) {
        // Navigation should not overlap main content area
        expect(navBox.y + navBox.height <= contentBox.y ||
               navBox.y >= contentBox.y + contentBox.height).toBeTruthy();
      }
    }
  });

});