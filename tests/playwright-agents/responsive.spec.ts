import { test, expect } from '@playwright/test';

/**
 * Responsive Design Tests for Economist Blog v5
 * Based on responsive-test-plan.md
 *
 * These tests validate responsive behavior across viewports to complement
 * BackstopJS visual regression testing with behavioral validation.
 */

// Test viewport configurations matching BackstopJS
const viewports = {
  mobile: { width: 320, height: 568 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 }
};

test.describe('Responsive Layout Adaptation', () => {

  test('Article grid adapts correctly across viewports', async ({ page }) => {
    await page.goto('/blog/');

    // Test mobile layout (1 column)
    await page.setViewportSize(viewports.mobile);
    await page.waitForLoadState('networkidle');

    const mobileCards = page.locator('.post-card, article');
    await expect(mobileCards.first()).toBeVisible();

    // Verify mobile cards are stacked (single column)
    const mobileCardCount = await mobileCards.count();
    if (mobileCardCount >= 2) {
      const firstCard = await mobileCards.first().boundingBox();
      const secondCard = await mobileCards.nth(1).boundingBox();

      if (firstCard && secondCard) {
        // Second card should be below first card (vertical stacking)
        expect(secondCard.y).toBeGreaterThan(firstCard.y + firstCard.height - 50);
      }
    }

    // Test tablet layout (2 columns)
    await page.setViewportSize(viewports.tablet);
    await page.waitForLoadState('networkidle');

    if (mobileCardCount >= 2) {
      const tabletFirstCard = await mobileCards.first().boundingBox();
      const tabletSecondCard = await mobileCards.nth(1).boundingBox();

      if (tabletFirstCard && tabletSecondCard) {
        // Cards should be side by side on tablet (horizontal layout)
        expect(Math.abs(tabletFirstCard.y - tabletSecondCard.y)).toBeLessThan(100);
        expect(tabletSecondCard.x).toBeGreaterThan(tabletFirstCard.x);
      }
    }

    // Test desktop layout (3 columns)
    await page.setViewportSize(viewports.desktop);
    await page.waitForLoadState('networkidle');

    if (mobileCardCount >= 3) {
      const cards = await Promise.all([
        mobileCards.first().boundingBox(),
        mobileCards.nth(1).boundingBox(),
        mobileCards.nth(2).boundingBox()
      ]);

      if (cards.every(card => card !== null)) {
        // All three cards should be roughly at the same Y level
        const [first, second, third] = cards;
        expect(Math.abs(first!.y - second!.y)).toBeLessThan(100);
        expect(Math.abs(first!.y - third!.y)).toBeLessThan(100);

        // Cards should be horizontally distributed
        expect(second!.x).toBeGreaterThan(first!.x);
        expect(third!.x).toBeGreaterThan(second!.x);
      }
    }
  });

  test('Navigation menu adapts to viewport size', async ({ page }) => {
    await page.goto('/');

    const navigation = page.locator('nav[role="navigation"], .main-nav');
    await expect(navigation).toBeVisible();

    // Test mobile navigation
    await page.setViewportSize(viewports.mobile);
    await page.waitForLoadState('networkidle');

    const mobileNavBox = await navigation.boundingBox();
    expect(mobileNavBox).not.toBeNull();

    // Test tablet navigation
    await page.setViewportSize(viewports.tablet);
    await page.waitForLoadState('networkidle');

    const tabletNavBox = await navigation.boundingBox();
    expect(tabletNavBox).not.toBeNull();

    // Test desktop navigation
    await page.setViewportSize(viewports.desktop);
    await page.waitForLoadState('networkidle');

    const desktopNavBox = await navigation.boundingBox();
    expect(desktopNavBox).not.toBeNull();

    // Navigation should remain accessible at all sizes
    const navLinks = navigation.getByRole('link');
    const linkCount = await navLinks.count();
    expect(linkCount).toBeGreaterThan(0);

    // All nav links should be clickable
    for (let i = 0; i < Math.min(linkCount, 5); i++) {
      await expect(navLinks.nth(i)).toBeVisible();
    }
  });

  test('Content width constraints work properly', async ({ page }) => {
    await page.goto('/2025/12/31/testing-times/'); // Test with a known article

    const mainContent = page.locator('main, .post-content, .article-content').first();
    await expect(mainContent).toBeVisible();

    // Test desktop - content should be constrained to readable width
    await page.setViewportSize(viewports.desktop);
    await page.waitForLoadState('networkidle');

    const desktopContentBox = await mainContent.boundingBox();
    if (desktopContentBox) {
      // Content should not span the full width of large screens
      expect(desktopContentBox.width).toBeLessThan(1200);
      expect(desktopContentBox.width).toBeGreaterThan(600);
    }

    // Test tablet - content should use more of available width
    await page.setViewportSize(viewports.tablet);
    await page.waitForLoadState('networkidle');

    const tabletContentBox = await mainContent.boundingBox();
    if (tabletContentBox) {
      expect(tabletContentBox.width).toBeLessThan(800);
      expect(tabletContentBox.width).toBeGreaterThan(400);
    }

    // Test mobile - content should use most of available width
    await page.setViewportSize(viewports.mobile);
    await page.waitForLoadState('networkidle');

    const mobileContentBox = await mainContent.boundingBox();
    if (mobileContentBox) {
      // On mobile, content should use most of the viewport width (with some padding)
      expect(mobileContentBox.width).toBeGreaterThan(280);
      expect(mobileContentBox.width).toBeLessThan(320);
    }
  });

});

test.describe('Typography Responsiveness', () => {

  test('Font sizes scale appropriately across viewports', async ({ page }) => {
    await page.goto('/2025/12/31/testing-times/');

    const titleElement = page.getByRole('heading', { level: 1 }).first();
    const bodyElement = page.locator('p').first();

    await expect(titleElement).toBeVisible();
    await expect(bodyElement).toBeVisible();

    // Test mobile typography
    await page.setViewportSize(viewports.mobile);
    await page.waitForLoadState('networkidle');

    const mobileTitleSize = await titleElement.evaluate(el =>
      window.getComputedStyle(el).fontSize
    );
    const mobileBodySize = await bodyElement.evaluate(el =>
      window.getComputedStyle(el).fontSize
    );

    // Mobile should have readable minimum font sizes
    expect(parseFloat(mobileBodySize)).toBeGreaterThanOrEqual(16);

    // Test desktop typography
    await page.setViewportSize(viewports.desktop);
    await page.waitForLoadState('networkidle');

    const desktopTitleSize = await titleElement.evaluate(el =>
      window.getComputedStyle(el).fontSize
    );
    const desktopBodySize = await bodyElement.evaluate(el =>
      window.getComputedStyle(el).fontSize
    );

    // Desktop fonts should be larger than mobile
    expect(parseFloat(desktopTitleSize)).toBeGreaterThan(parseFloat(mobileTitleSize));
    expect(parseFloat(desktopBodySize)).toBeGreaterThanOrEqual(parseFloat(mobileBodySize));
  });

  test('Drop cap remains proportional across viewports', async ({ page }) => {
    await page.goto('/2025/12/31/testing-times/');

    // Find drop cap (first letter styling)
    const firstParagraph = page.locator('.post-content p, .article-content p').first();
    await expect(firstParagraph).toBeVisible();

    const viewportSizes = [viewports.mobile, viewports.tablet, viewports.desktop];

    for (const viewport of viewportSizes) {
      await page.setViewportSize(viewport);
      await page.waitForLoadState('networkidle');

      // Check if drop cap exists and is proportional
      const paragraphHeight = await firstParagraph.evaluate(el => el.offsetHeight);
      const paragraphFontSize = await firstParagraph.evaluate(el =>
        parseFloat(window.getComputedStyle(el).fontSize)
      );

      // Drop cap should not make paragraph excessively tall
      expect(paragraphHeight).toBeLessThan(paragraphFontSize * 10);
    }
  });

  test('Line length remains readable across viewports', async ({ page }) => {
    await page.goto('/2025/12/31/testing-times/');

    const paragraph = page.locator('.post-content p, .article-content p').first();
    await expect(paragraph).toBeVisible();

    const viewportSizes = [viewports.mobile, viewports.tablet, viewports.desktop];

    for (const viewport of viewportSizes) {
      await page.setViewportSize(viewport);
      await page.waitForLoadState('networkidle');

      const paragraphWidth = await paragraph.evaluate(el => el.offsetWidth);
      const fontSize = await paragraph.evaluate(el =>
        parseFloat(window.getComputedStyle(el).fontSize)
      );

      // Calculate approximate characters per line (rough estimate)
      const approximateCharsPerLine = paragraphWidth / (fontSize * 0.6);

      // Optimal line length is 45-75 characters for readability
      expect(approximateCharsPerLine).toBeGreaterThan(30); // Allow slightly short for mobile
      expect(approximateCharsPerLine).toBeLessThan(90); // Don't allow excessively long lines
    }
  });

});

test.describe('Image Responsiveness', () => {

  test('Hero images scale properly across viewports', async ({ page }) => {
    await page.goto('/2025/12/31/testing-times/'); // Post with hero image

    const heroImage = page.locator('.hero-image, .post-image, img').first();

    if (await heroImage.count() > 0) {
      await expect(heroImage).toBeVisible();

      const viewportSizes = [viewports.mobile, viewports.tablet, viewports.desktop];

      for (const viewport of viewportSizes) {
        await page.setViewportSize(viewport);
        await page.waitForLoadState('networkidle');

        const imageBox = await heroImage.boundingBox();
        if (imageBox) {
          // Image should not exceed container width
          expect(imageBox.width).toBeLessThanOrEqual(viewport.width);

          // Image should maintain reasonable aspect ratio (assuming 16:9 hero images)
          const aspectRatio = imageBox.width / imageBox.height;
          expect(aspectRatio).toBeGreaterThan(1.0); // Wider than tall
          expect(aspectRatio).toBeLessThan(3.0); // Not excessively wide
        }
      }
    }
  });

  test('Content images don\'t overflow containers', async ({ page }) => {
    await page.goto('/2025/12/31/testing-times/');

    const contentImages = page.locator('.post-content img, .article-content img');
    const imageCount = await contentImages.count();

    if (imageCount > 0) {
      const contentContainer = page.locator('.post-content, .article-content').first();
      const containerBox = await contentContainer.boundingBox();

      for (let i = 0; i < imageCount; i++) {
        const image = contentImages.nth(i);
        await expect(image).toBeVisible();

        const imageBox = await image.boundingBox();
        if (imageBox && containerBox) {
          // Image should not exceed container width
          expect(imageBox.width).toBeLessThanOrEqual(containerBox.width + 10); // Small tolerance
        }
      }
    }
  });

});

test.describe('Interactive Elements Touch Targets', () => {

  test.use({ viewport: viewports.mobile });

  test('Touch targets meet minimum size requirements', async ({ page }) => {
    await page.goto('/blog/');

    // Find all interactive elements
    const interactiveElements = page.locator('button, a, input, [role="button"]');
    const elementCount = await interactiveElements.count();

    for (let i = 0; i < Math.min(elementCount, 20); i++) {
      const element = interactiveElements.nth(i);

      if (await element.isVisible()) {
        const box = await element.boundingBox();
        if (box) {
          // Touch targets should be at least 44px in the smallest dimension
          // Allow some tolerance for text links that might rely on padding
          const minDimension = Math.min(box.width, box.height);
          if (minDimension < 40) {
            // Check if element has sufficient padding or margin for touch
            const computedStyle = await element.evaluate(el => {
              const style = window.getComputedStyle(el);
              return {
                paddingTop: parseFloat(style.paddingTop),
                paddingBottom: parseFloat(style.paddingBottom),
                paddingLeft: parseFloat(style.paddingLeft),
                paddingRight: parseFloat(style.paddingRight),
                marginTop: parseFloat(style.marginTop),
                marginBottom: parseFloat(style.marginBottom),
              };
            });

            const effectiveHeight = box.height + computedStyle.paddingTop + computedStyle.paddingBottom;
            expect(effectiveHeight).toBeGreaterThanOrEqual(40);
          }
        }
      }
    }
  });

  test('Touch targets have sufficient spacing', async ({ page }) => {
    await page.goto('/');

    // Check navigation links for adequate spacing
    const navLinks = page.getByRole('navigation').getByRole('link');
    const linkCount = await navLinks.count();

    if (linkCount >= 2) {
      for (let i = 0; i < linkCount - 1; i++) {
        const currentLink = navLinks.nth(i);
        const nextLink = navLinks.nth(i + 1);

        if (await currentLink.isVisible() && await nextLink.isVisible()) {
          const currentBox = await currentLink.boundingBox();
          const nextBox = await nextLink.boundingBox();

          if (currentBox && nextBox) {
            // Calculate distance between elements
            const horizontalGap = Math.abs(nextBox.x - (currentBox.x + currentBox.width));
            const verticalGap = Math.abs(nextBox.y - (currentBox.y + currentBox.height));

            // Elements should have at least 8px spacing in the primary layout direction
            const primaryGap = Math.max(horizontalGap, verticalGap);
            expect(primaryGap).toBeGreaterThanOrEqual(8);
          }
        }
      }
    }
  });

});

test.describe('Orientation Change Handling', () => {

  test('Layout adapts to orientation changes on tablet', async ({ page }) => {
    await page.goto('/blog/');

    // Start in portrait orientation
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForLoadState('networkidle');

    const portraitCards = page.locator('.post-card, article');
    const portraitCardCount = await portraitCards.count();
    const portraitFirstCardBox = await portraitCards.first().boundingBox();

    // Switch to landscape orientation
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForLoadState('networkidle');

    const landscapeFirstCardBox = await portraitCards.first().boundingBox();

    // Content should still be visible and properly laid out
    await expect(portraitCards.first()).toBeVisible();
    expect(landscapeFirstCardBox).not.toBeNull();

    // Layout should adapt (cards may be arranged differently)
    if (portraitFirstCardBox && landscapeFirstCardBox) {
      // At minimum, content should not overflow the new viewport
      expect(landscapeFirstCardBox.x + landscapeFirstCardBox.width).toBeLessThanOrEqual(1024);
      expect(landscapeFirstCardBox.y + landscapeFirstCardBox.height).toBeLessThanOrEqual(768);
    }

    // Navigation should remain functional
    const navigation = page.locator('nav[role="navigation"], .main-nav');
    await expect(navigation).toBeVisible();
  });

});

test.describe('Performance Under Responsive Conditions', () => {

  test('Layout performance during viewport changes', async ({ page }) => {
    await page.goto('/blog/');

    // Start performance monitoring
    await page.evaluate(() => performance.mark('responsive-test-start'));

    // Simulate rapid viewport changes
    const viewportChanges = [
      { width: 320, height: 568 },
      { width: 768, height: 1024 },
      { width: 1920, height: 1080 },
      { width: 480, height: 854 },
      { width: 1024, height: 768 }
    ];

    for (const viewport of viewportChanges) {
      await page.setViewportSize(viewport);
      await page.waitForFunction(() => document.readyState === 'complete');

      // Brief wait to allow layout calculations
      await page.waitForTimeout(100);
    }

    await page.evaluate(() => performance.mark('responsive-test-end'));

    // Check that page is still functional after rapid changes
    const finalContent = page.locator('.post-card, article').first();
    await expect(finalContent).toBeVisible();

    // Verify no layout thrashing indicators (this is a basic check)
    const hasOverflowIssues = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 10;
    });

    expect(hasOverflowIssues).toBeFalsy();
  });

});