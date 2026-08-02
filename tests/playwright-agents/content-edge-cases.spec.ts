import { test, expect } from '@playwright/test';

/**
 * Content Edge Cases Tests for Economist Blog v5
 *
 * These tests validate handling of various content scenarios and edge cases
 * including AI disclosure, missing images, metadata variations, and content overflow.
 */

test.describe('@content @links April AI posts: cross-post links resolve @REQ-CONTENT-01 @REQ-LINKS-01', () => {

  const posts = [
    {
      name: 'AI Testing Tools',
      postUrl: '/2026/04/05/ai-quality-testing-automation/',
      links: [
        '/2025/12/31/testing-times/',
        '/2026/04/05/why-ai-test-generation-tools-overpromise-on-maintenance-savi/',
        '/2026/01/19/the-surprising-economics-of-test-automation-roi/',
      ],
    },
    {
      // Filename date and front matter date both 2026-04-05; Jekyll serves
      // this at /2026/04/05/ (was a filename/front-matter mismatch, fixed in #916).
      name: 'Code Generators',
      postUrl: '/2026/04/05/ai-assisted-development-the-new-industrial-revolut/',
      links: [
        '/2026/04/05/ai-quality-testing-automation/',
        '/2026/04/05/practical-applications-of-ai-in-software-development/',
        '/2026/01/02/self-healing-tests-myth-vs-reality/',
      ],
    },
  ];

  for (const { name, postUrl, links } of posts) {
    test(`${name} post: cross-post links are present and resolve`, async ({ page }) => {
      await page.goto(postUrl);

      const articleBody = page.locator('.article-content');
      await expect(articleBody).toBeVisible();

      for (const path of links) {
        await expect(
          articleBody.locator(`p a[href="${path}"]`),
          `link to ${path} should be present in article prose`
        ).toBeVisible();
        const response = await page.request.get(path);
        expect(response.status(), `${path} should return 200`).toBe(200);
      }
    });
  }

});

test.describe('@content @visual Image Handling Edge Cases @REQ-CONTENT-01 @REQ-CONTENT-02', () => {

  test('Posts with hero images load correctly', async ({ page }) => {
    await page.goto('/2025/12/31/testing-times/');

    // Look for hero/featured image
    const heroImage = page.locator('.hero-image, .featured-image, .post-image img, .article-header img').first();

    if (await heroImage.count() > 0) {
      await expect(heroImage).toBeVisible();

      // Wait for image to load
      await heroImage.waitFor({ state: 'attached' });

      // Verify image has loaded successfully
      const isLoaded = await heroImage.evaluate((img: HTMLImageElement) => {
        return img.complete && img.naturalHeight !== 0;
      });

      expect(isLoaded).toBeTruthy();

      // Verify image has proper alt text
      const altText = await heroImage.getAttribute('alt');
      expect(altText).toBeTruthy();
      expect(altText?.length).toBeGreaterThan(0);
    }
  });

  test('no image on the homepage fails to load', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // The previous version of this test only asserted anything when an image was
    // *already* broken, so on a healthy site it passed without checking
    // anything. Inverted: a broken image is the failure, not the precondition.
    const broken = await page.locator('img').evaluateAll((imgs) =>
      imgs
        .filter((img) => {
          const i = img as HTMLImageElement;
          return i.complete && (i.naturalWidth === 0 || i.naturalHeight === 0);
        })
        .map((img) => (img as HTMLImageElement).src)
    );
    expect(broken, `images failed to load: ${broken.join(', ')}`).toHaveLength(0);

    const missingAlt = await page.locator('img:not([alt])').count();
    expect(missingAlt, 'every image needs an alt attribute').toBe(0);
  });

});

test.describe('@content Content Metadata Variations @REQ-CONTENT-01 @REQ-CONTENT-02', () => {

  test('Posts with complete metadata display correctly', async ({ page }) => {
    await page.goto('/2025/12/31/testing-times/');

    // Check for publication date (conditional)
    const dateElement = page.locator('.post-date, .publish-date, [class*="date"]').first();
    const dateCount = await dateElement.count();
    if (dateCount > 0) {
      await expect(dateElement).toBeVisible();
      const dateText = await dateElement.textContent();
      if (dateText && dateText.trim()) {
        expect(dateText).toMatch(/\d{4}|\d{1,2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i);
      }
    }

    // Check for read time calculation (conditional)
    const readTime = page.locator('.read-time, .reading-time, [class*="read-time"], [class*="reading-time"]').first();
    const readTimeCount = await readTime.count();
    if (readTimeCount > 0) {
      await expect(readTime).toBeVisible();
      const readTimeText = await readTime.textContent();
      if (readTimeText && readTimeText.match(/\d+.*min/i)) {
        // Read time should be reasonable (1-20 minutes for blog posts)
        const minutes = parseInt(readTimeText.match(/\d+/)?.[0] || '0');
        expect(minutes).toBeGreaterThan(0);
        expect(minutes).toBeLessThan(21);
      }
    }

    // Check for author information (conditional)
    const author = page.locator('.author, .post-author, [class*="author"]').first();
    const authorCount = await author.count();
    if (authorCount > 0) {
      await expect(author).toBeVisible();
      const authorText = await author.textContent();
      if (authorText && authorText.trim()) {
        expect(authorText.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('Posts with missing optional metadata handle gracefully', async ({ page }) => {
    // Test older posts that might have incomplete metadata
    const testPosts = [
      '/2026/04/05/building-a-test-strategy-that-works/',
      '/2026/04/05/practical-applications-of-ai-in-software-development/'
    ];

    for (const postUrl of testPosts) {
      await page.goto(postUrl);

      // Verify page loads successfully even with missing metadata
      // Fixed H1 selector conflict - use article-specific heading
      const articleTitle = page.locator('.article-title, .post-title').first();
      await expect(articleTitle).toBeVisible();

      // Check that missing metadata doesn't break layout
      const main = page.locator('main, .main-content').first();
      await expect(main).toBeVisible();

      // Verify no empty metadata containers are visible
      const metadataElements = page.locator('.post-meta, .article-meta, [class*="meta"]');
      const metaCount = await metadataElements.count();

      for (let i = 0; i < metaCount; i++) {
        const metaElement = metadataElements.nth(i);
        if (await metaElement.isVisible()) {
          const metaText = await metaElement.textContent();
          // Metadata elements should not be empty or just whitespace
          expect(metaText?.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  test('Date formatting is consistent and readable', async ({ page }) => {
    // The original selector list (.post-date, .publish-date, [class*="date"])
    // matched nothing on a post page — dates render as <time> inside
    // .article-meta. Because every assertion sat behind `if (count > 0)` and
    // `if (dateFormats.length > 1)`, the test collected zero dates and asserted
    // nothing. It also navigated to /2023/08/09/building-a-test-strategy-that-works/,
    // which 404s: the post lives at /2026/04/05/. Both were invisible for the
    // same reason.
    const testPosts = [
      '/2025/12/31/testing-times/',
      '/2026/01/02/self-healing-tests-myth-vs-reality/',
      '/2026/04/05/building-a-test-strategy-that-works/'
    ];

    const malformed: string[] = [];

    for (const postUrl of testPosts) {
      const response = await page.goto(postUrl);
      expect(response!.status(), `${postUrl} did not return 200`).toBe(200);
      await page.waitForLoadState('networkidle');

      const dateElement = page.locator('.article-meta time').first();
      await expect(dateElement, `${postUrl} renders no date element`).toBeVisible();

      // Machine-readable date drives feeds and structured data.
      await expect(dateElement).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}/);

      // Human-readable form: "Dec 31st 2025".
      const dateText = ((await dateElement.textContent()) || '').trim();
      if (!/^[A-Z][a-z]{2} \d{1,2}(st|nd|rd|th) \d{4}$/.test(dateText)) {
        malformed.push(`${postUrl} → "${dateText}"`);
      }
    }

    expect(malformed, `dates not in the expected format: ${malformed.join('; ')}`).toHaveLength(0);
  });

});

test.describe('@content Content Length and Overflow Edge Cases @REQ-CONTENT-01 @REQ-CONTENT-02', () => {

  test('Very long article titles handle gracefully', async ({ page }) => {
    await page.goto('/blog/');

    // Find all post titles
    const postTitles = page.locator('.post-title, .card-title, h2 a, h3 a');
    const titleCount = await postTitles.count();

    for (let i = 0; i < Math.min(titleCount, 10); i++) {
      const title = postTitles.nth(i);
      await expect(title).toBeVisible();

      const titleBox = await title.boundingBox();
      const titleText = await title.textContent();

      if (titleBox && titleText) {
        // Very long titles should wrap properly
        if (titleText.length > 60) {
          // Title should not exceed container width
          const container = title.locator('..').first();
          const containerBox = await container.boundingBox();

          if (containerBox) {
            expect(titleBox.width).toBeLessThanOrEqual(containerBox.width + 10); // Small tolerance
          }

          // Multi-line titles should have reasonable line height
          const lineHeight = await title.evaluate(el =>
            parseFloat(window.getComputedStyle(el).lineHeight)
          );
          expect(lineHeight).toBeGreaterThan(0);
        }
      }
    }
  });

  test('Very short posts display appropriately', async ({ page }) => {
    // This test looks for posts that might be very short
    const testPosts = [
      '/2025/12/31/testing-times/',
      '/2026/01/02/self-healing-tests-myth-vs-reality/'
    ];

    for (const postUrl of testPosts) {
      await page.goto(postUrl);

      const postContent = page.locator('.post-content, .article-content').first();
      await expect(postContent).toBeVisible();

      const content = await postContent.textContent();
      if (content && content.trim().length < 500) {
        // Short posts should still have proper structure

        // Should have at least a title
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

        // Content area should not be empty
        expect(content.trim().length).toBeGreaterThan(50);

        // Layout should not be broken for short content
        const contentBox = await postContent.boundingBox();
        expect(contentBox).not.toBeNull();
      }
    }
  });

  test('Very long posts maintain readability', async ({ page }) => {
    // Test longest available post
    await page.goto('/2025/12/31/testing-times/');

    const postContent = page.locator('.post-content, .article-content').first();
    await expect(postContent).toBeVisible();

    const content = await postContent.textContent();
    if (content && content.trim().length > 3000) {
      // Long posts should maintain typography and spacing

      // Check paragraph spacing
      const paragraphs = page.locator('.post-content p, .article-content p');
      const paragraphCount = await paragraphs.count();

      if (paragraphCount > 5) {
        // Check spacing between paragraphs
        const firstPara = await paragraphs.first().boundingBox();
        const secondPara = await paragraphs.nth(1).boundingBox();

        if (firstPara && secondPara) {
          const spacing = secondPara.y - (firstPara.y + firstPara.height);
          expect(spacing).toBeGreaterThan(10); // Reasonable paragraph spacing
          expect(spacing).toBeLessThan(100); // Not excessive spacing
        }
      }

      // Check that text doesn't exceed comfortable reading width
      const contentBox = await postContent.boundingBox();
      if (contentBox) {
        expect(contentBox.width).toBeLessThan(800); // Max reading width
      }
    }
  });

});

test.describe('@content Hero image caption casing @REQ-CONTENT-CAPTION-CASE', () => {

  // Guard for the all-caps hero caption defect (P2): the authored sentence-case
  // caption must NOT be forced to ALL CAPS — neither by a Liquid `| upcase`
  // filter in _layouts/post.html nor by a `text-transform: uppercase` rule on
  // the .image-credit figcaption in _sass/economist-theme.scss.
  test('hero figcaption renders in authored sentence case, not ALL CAPS', async ({ page }) => {
    await page.goto('/2026/01/02/self-healing-tests-myth-vs-reality/');

    const caption = page.locator('.article-hero-image figcaption.image-credit').first();
    await expect(caption).toBeVisible();

    const text = (await caption.textContent() || '').trim();
    expect(text.length).toBeGreaterThan(0);

    // The caption contains lowercase-capable letters, so a sentence-case string
    // must differ from its own uppercased form. Catches the `| upcase` filter.
    expect(text).not.toEqual(text.toUpperCase());

    // The CSS must not visually re-uppercase the caption. Catches a
    // text-transform: uppercase rule that would defeat the layout fix.
    const transform = await caption.evaluate(
      (el) => getComputedStyle(el).textTransform
    );
    expect(transform).not.toBe('uppercase');
  });

});