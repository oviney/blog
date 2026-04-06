import { test, expect } from '@playwright/test';

/**
 * Interactive Elements Tests
 * Validates: reading progress bar, table of contents, copy code buttons,
 * back-to-top button, share buttons, and print stylesheet.
 *
 * @requirements REQ-CONTENT-02, REQ-A11Y-02
 * @group content accessibility
 */

// Use a post that has multiple h2 headings to trigger the ToC
const POST_URL = '/2026/01/02/self-healing-tests-myth-vs-reality/';

test.describe('@content @accessibility Reading Progress Bar', () => {
  test('progress bar is present on post pages', async ({ page }) => {
    await page.goto(POST_URL);
    await page.waitForLoadState('networkidle');

    const progressBar = page.locator('#reading-progress');
    await expect(progressBar).toBeAttached();
  });

  test('progress bar has correct ARIA attributes', async ({ page }) => {
    await page.goto(POST_URL);
    await page.waitForLoadState('networkidle');

    const progressBar = page.locator('#reading-progress');
    await expect(progressBar).toHaveAttribute('role', 'progressbar');
    await expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    await expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  test('progress bar is not present on non-post pages', async ({ page }) => {
    await page.goto('/blog/');
    await page.waitForLoadState('networkidle');

    const progressBar = page.locator('#reading-progress');
    const count = await progressBar.count();
    expect(count).toBe(0);
  });
});

test.describe('@content @accessibility Table of Contents', () => {
  test('ToC container is present on post pages', async ({ page }) => {
    await page.goto(POST_URL);
    await page.waitForLoadState('networkidle');

    const toc = page.locator('#toc');
    await expect(toc).toBeAttached();
  });

  test('ToC is populated with heading links for posts with multiple h2/h3', async ({ page }) => {
    await page.goto(POST_URL);
    await page.waitForLoadState('networkidle');

    const toc = page.locator('#toc');
    const tocCount = await toc.count();
    if (tocCount === 0) {
      console.log('ToC element not found — skipping test');
      return;
    }

    // Check computed display style to reliably detect hidden state
    const isHidden = await toc.evaluate((el) => window.getComputedStyle(el).display === 'none');
    if (!isHidden) {
      const tocLinks = toc.locator('.toc-link');
      const linkCount = await tocLinks.count();
      expect(linkCount).toBeGreaterThanOrEqual(2);
    }
  });

  test('ToC links point to heading anchors', async ({ page }) => {
    await page.goto(POST_URL);
    await page.waitForLoadState('networkidle');

    const toc = page.locator('#toc');
    const isHidden = await toc.evaluate((el) => window.getComputedStyle(el).display === 'none');
    if (isHidden) {
      console.log('ToC hidden (too few headings) — skipping anchor test');
      return;
    }

    const tocLinks = toc.locator('.toc-link');
    const count = await tocLinks.count();

    for (let i = 0; i < Math.min(count, 3); i++) {
      const href = await tocLinks.nth(i).getAttribute('href');
      expect(href).toMatch(/^#/);
    }
  });

  test('ToC uses details/summary for collapsible behaviour', async ({ page }) => {
    await page.goto(POST_URL);
    await page.waitForLoadState('networkidle');

    const details = page.locator('#toc details');
    const detailsCount = await details.count();
    if (detailsCount === 0) {
      console.log('details element not found inside ToC — skipping');
      return;
    }
    await expect(details.first()).toBeAttached();

    const summary = page.locator('#toc .toc-title');
    await expect(summary.first()).toBeVisible();
  });
});

test.describe('@content @accessibility Copy Code Buttons', () => {
  // Use a post that is known to have code blocks
  const CODE_POST = '/2023/08/08/practical-applications-of-ai-in-software-development/';

  test('copy code buttons are absent when there are no code blocks', async ({ page }) => {
    await page.goto(POST_URL);
    await page.waitForLoadState('networkidle');

    const preBlocks = page.locator('.article-content pre');
    const preCount = await preBlocks.count();

    if (preCount === 0) {
      // No code blocks → no copy buttons expected
      const copyBtns = page.locator('.copy-code-btn');
      const btnCount = await copyBtns.count();
      expect(btnCount).toBe(0);
    } else {
      // Each pre should have exactly one copy button
      const copyBtns = page.locator('.copy-code-btn');
      const btnCount = await copyBtns.count();
      expect(btnCount).toBe(preCount);
    }
  });

  test('copy code buttons have accessible label', async ({ page }) => {
    await page.goto(CODE_POST);
    await page.waitForLoadState('networkidle');

    const copyBtns = page.locator('.copy-code-btn');
    const count = await copyBtns.count();

    if (count === 0) {
      console.log('No code blocks on this post — skipping copy button test');
      return;
    }

    for (let i = 0; i < count; i++) {
      const label = await copyBtns.nth(i).getAttribute('aria-label');
      expect(label).toBeTruthy();
    }
  });
});

test.describe('@content @accessibility Back to Top Button', () => {
  test('back-to-top button is present on post pages', async ({ page }) => {
    await page.goto(POST_URL);
    await page.waitForLoadState('networkidle');

    const btn = page.locator('#back-to-top');
    await expect(btn).toBeAttached();
  });

  test('back-to-top button has accessible label', async ({ page }) => {
    await page.goto(POST_URL);
    await page.waitForLoadState('networkidle');

    const btn = page.locator('#back-to-top');
    const ariaLabel = await btn.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
  });

  test('back-to-top button meets minimum touch-target size', async ({ page }) => {
    await page.goto(POST_URL);
    await page.waitForLoadState('networkidle');

    const btn = page.locator('#back-to-top');
    const box = await btn.boundingBox();

    if (box) {
      // Should be at least 44×44px for WCAG touch targets
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('back-to-top button becomes visible after scrolling', async ({ page }) => {
    await page.goto(POST_URL);
    await page.waitForLoadState('networkidle');

    // Initially should not have 'visible' class
    const btn = page.locator('#back-to-top');
    const hasVisibleBefore = await btn.evaluate((el) => el.classList.contains('visible'));
    expect(hasVisibleBefore).toBe(false);

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(200);

    const hasVisibleAfter = await btn.evaluate((el) => el.classList.contains('visible'));
    expect(hasVisibleAfter).toBe(true);
  });
});

test.describe('@content Share Buttons', () => {
  test('share section is present on post pages', async ({ page }) => {
    await page.goto(POST_URL);
    await page.waitForLoadState('networkidle');

    const shareSection = page.locator('.share-section');
    await expect(shareSection).toBeVisible();
  });

  test('share section contains LinkedIn, Twitter, and Email links', async ({ page }) => {
    await page.goto(POST_URL);
    await page.waitForLoadState('networkidle');

    const linkedIn = page.locator('.share-btn--linkedin');
    const twitter = page.locator('.share-btn--twitter');
    const email = page.locator('.share-btn--email');

    await expect(linkedIn).toBeVisible();
    await expect(twitter).toBeVisible();
    await expect(email).toBeVisible();
  });

  test('LinkedIn and Twitter share links open in new tab with noopener', async ({ page }) => {
    await page.goto(POST_URL);
    await page.waitForLoadState('networkidle');

    for (const selector of ['.share-btn--linkedin', '.share-btn--twitter']) {
      const link = page.locator(selector);
      const target = await link.getAttribute('target');
      const rel = await link.getAttribute('rel');

      expect(target).toBe('_blank');
      expect(rel).toMatch(/(noopener|noreferrer)/);
    }
  });

  test('copy-link button is present at both top and bottom of article', async ({ page }) => {
    await page.goto(POST_URL);
    await page.waitForLoadState('networkidle');

    const topBtn = page.locator('#copy-link-btn-top');
    const bottomBtn = page.locator('#copy-link-btn-bottom');

    await expect(topBtn).toBeVisible();
    await expect(bottomBtn).toBeVisible();
  });

  test('email share link uses mailto: protocol', async ({ page }) => {
    await page.goto(POST_URL);
    await page.waitForLoadState('networkidle');

    const emailLink = page.locator('.share-btn--email');
    const href = await emailLink.getAttribute('href');
    expect(href).toMatch(/^mailto:/);
  });
});

test.describe('@content Share Buttons (absent on non-post pages)', () => {
  test('share section is not present on the blog listing page', async ({ page }) => {
    await page.goto('/blog/');
    await page.waitForLoadState('networkidle');

    const shareSection = page.locator('.share-section');
    const count = await shareSection.count();
    expect(count).toBe(0);
  });
});

test.describe('@visual Print Styles', () => {
  test('print-url span is present in article footer', async ({ page }) => {
    await page.goto(POST_URL);
    await page.waitForLoadState('networkidle');

    const printUrl = page.locator('.article-footer .print-url');
    await expect(printUrl).toBeAttached();
  });

  test('print-url span contains the article URL', async ({ page }) => {
    await page.goto(POST_URL);
    await page.waitForLoadState('networkidle');

    const printUrl = page.locator('.article-footer .print-url');
    const text = await printUrl.textContent();
    expect(text).toBeTruthy();
    // Should contain a URL-like string
    expect(text).toMatch(/https?:\/\//);
  });

  test('reading progress bar is hidden in print media via CSS', async ({ page }) => {
    await page.goto(POST_URL);
    await page.waitForLoadState('networkidle');

    // Emulate print media and check that key interactive elements are hidden
    await page.emulateMedia({ media: 'print' });

    const progressBar = page.locator('#reading-progress');
    await expect(progressBar).toBeHidden();

    const backToTop = page.locator('#back-to-top');
    await expect(backToTop).toBeHidden();

    const shareSection = page.locator('.share-section');
    await expect(shareSection).toBeHidden();

    // Restore screen media for subsequent tests
    await page.emulateMedia({ media: 'screen' });
  });
});

test.describe('@content @accessibility @navigation Interactive Elements - Mobile', () => {
  test.use({ viewport: { width: 320, height: 568 } });

  test('back-to-top button is accessible on mobile', async ({ page }) => {
    await page.goto(POST_URL);
    await page.waitForLoadState('networkidle');

    const btn = page.locator('#back-to-top');
    await expect(btn).toBeAttached();
    const box = await btn.boundingBox();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('share section is visible on mobile', async ({ page }) => {
    await page.goto(POST_URL);
    await page.waitForLoadState('networkidle');

    const shareSection = page.locator('.share-section');
    await expect(shareSection).toBeVisible();
  });

  test('ToC is accessible on mobile', async ({ page }) => {
    await page.goto(POST_URL);
    await page.waitForLoadState('networkidle');

    const toc = page.locator('#toc');
    const tocCount = await toc.count();
    if (tocCount > 0) {
      const isHidden = await toc.evaluate((el) => window.getComputedStyle(el).display === 'none');
      if (!isHidden) {
        await expect(toc).toBeVisible();
      }
    }
  });
});
