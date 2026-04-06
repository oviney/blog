import { test, expect } from '@playwright/test';

/**
 * Homepage Redesign Tests
 * Validates the new 6-section homepage structure:
 * 1. Hero section with latest post
 * 2. 3-column Focus Areas cards with icons
 * 3. Featured posts grid (2-3 posts)
 * 4. Brief bio with headshot/avatar
 * 5. Newsletter signup
 * 6. Footer with social links + RSS
 *
 * @requirements REQ-CONTENT-01, REQ-CONTENT-02, REQ-LINKS-01
 */

test.describe('@REQ-CONTENT-01 @REQ-CONTENT-02 Homepage Redesign', () => {

  test('1. Hero section displays latest post', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Hero post section should be visible
    const heroPost = page.locator('.hero-post');
    await expect(heroPost).toBeVisible();

    // Hero must have an H1 title with a link
    const heroTitle = heroPost.locator('.hero-post-title');
    await expect(heroTitle).toBeVisible();
    const heroLink = heroTitle.getByRole('link');
    expect(await heroLink.count()).toBeGreaterThan(0);

    // Hero excerpt should be present
    const heroExcerpt = heroPost.locator('.hero-post-excerpt');
    await expect(heroExcerpt).toBeVisible();

    // "Read more" CTA link should be present
    const heroCta = heroPost.locator('.hero-post-cta');
    await expect(heroCta).toBeVisible();
    const ctaHref = await heroCta.getAttribute('href');
    expect(ctaHref).toBeTruthy();
  });

  test('2. Focus Areas section shows 3 cards with icons and links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Focus areas section should be visible
    const focusSection = page.locator('.home-focus-areas');
    await expect(focusSection).toBeVisible();

    // Should have exactly 3 focus area cards
    const cards = page.locator('.home-focus-card');
    await expect(cards).toHaveCount(3);

    // Each card must have an icon, title, description, and CTA link
    for (let i = 0; i < 3; i++) {
      const card = cards.nth(i);

      const icon = card.locator('.home-focus-icon');
      await expect(icon).toBeAttached();

      const title = card.locator('.home-focus-title');
      await expect(title).toBeVisible();
      const titleText = await title.textContent();
      expect(titleText?.trim().length).toBeGreaterThan(0);

      const desc = card.locator('.home-focus-desc');
      await expect(desc).toBeVisible();

      const link = card.locator('.home-focus-link');
      await expect(link).toBeVisible();
      const href = await link.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });

  test('3. Featured posts grid shows recent posts', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Featured posts section
    const recentSection = page.locator('.home-recent');
    await expect(recentSection).toBeVisible();

    // Should display 2-3 post cards
    const postCards = recentSection.locator('.topic-card');
    const cardCount = await postCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(2);
    expect(cardCount).toBeLessThanOrEqual(3);

    // Each card must have a title link
    for (let i = 0; i < cardCount; i++) {
      const card = postCards.nth(i);
      const titleLink = card.locator('.topic-card-title a');
      await expect(titleLink.first()).toBeVisible();
    }

    // "View all posts" link should be present
    const viewAll = recentSection.locator('.view-all a');
    await expect(viewAll).toBeVisible();
    const viewAllHref = await viewAll.getAttribute('href');
    expect(viewAllHref).toContain('/blog/');
  });

  test('4. Author bio section is visible with name, bio, and links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Bio section should be present
    const bioSection = page.locator('.home-bio');
    await expect(bioSection).toBeVisible();

    // Avatar (initials) should be shown
    const avatar = bioSection.locator('.home-bio-avatar');
    await expect(avatar).toBeVisible();

    // Author name heading
    const bioName = bioSection.locator('.home-bio-name');
    await expect(bioName).toBeVisible();
    const nameText = await bioName.textContent();
    expect(nameText?.trim().length).toBeGreaterThan(0);

    // Bio text
    const bioText = bioSection.locator('.home-bio-text');
    await expect(bioText).toBeVisible();

    // Should have links (About, LinkedIn, GitHub, RSS)
    const bioLinks = bioSection.locator('.home-bio-link');
    const linkCount = await bioLinks.count();
    expect(linkCount).toBeGreaterThanOrEqual(2);
  });

  test('5. Newsletter signup section is present', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const newsletter = page.locator('.newsletter-signup');
    await expect(newsletter).toBeVisible();

    const heading = newsletter.locator('.newsletter-heading');
    await expect(heading).toBeVisible();
  });

  test('6. Footer has social links and RSS', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const footer = page.locator('footer, .site-footer');
    await expect(footer).toBeVisible();

    // Footer should have RSS link
    const rssLink = footer.getByRole('link', { name: /rss/i });
    await expect(rssLink.first()).toBeVisible();

    // Footer should have social links (LinkedIn, GitHub, Twitter)
    const socialLinks = footer.getByRole('link', { name: /linkedin|github|twitter/i });
    const socialCount = await socialLinks.count();
    expect(socialCount).toBeGreaterThanOrEqual(2);
  });

  test('Hero → Article navigation works', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const heroCta = page.locator('.hero-post-cta').first();
    await expect(heroCta).toBeVisible();

    const href = await heroCta.getAttribute('href');
    expect(href).toBeTruthy();

    await heroCta.click();
    await page.waitForLoadState('networkidle');

    // Should have navigated to a post page
    const currentUrl = page.url();
    expect(currentUrl).not.toBe('http://localhost:4000/');
  });

});

test.describe('@REQ-CONTENT-01 @REQ-NAV-01 Homepage Responsive Layout', () => {

  test('Focus Area cards stack on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('.home-focus-card');
    await expect(cards.first()).toBeVisible();

    // On mobile, cards should be stacked (one per row)
    const firstCard = cards.nth(0);
    const secondCard = cards.nth(1);
    const firstBox = await firstCard.boundingBox();
    const secondBox = await secondCard.boundingBox();

    if (firstBox && secondBox) {
      // Stacked layout: second card should be below first card
      expect(secondBox.y).toBeGreaterThan(firstBox.y);
    }
  });

  test('Focus Area cards are 3-column on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('.home-focus-card');
    const count = await cards.count();
    expect(count).toBe(3);

    const firstCard = cards.nth(0);
    const secondCard = cards.nth(1);
    const firstBox = await firstCard.boundingBox();
    const secondBox = await secondCard.boundingBox();

    if (firstBox && secondBox) {
      // Side-by-side layout: cards should have similar Y positions.
      // Allow up to 50px difference to account for slight rendering offsets.
      const LAYOUT_TOLERANCE_PX = 50;
      const yDiff = Math.abs(firstBox.y - secondBox.y);
      expect(yDiff).toBeLessThan(LAYOUT_TOLERANCE_PX);
    }
  });

  test('Bio section is visible on all viewports', async ({ page }) => {
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 768, height: 1024 },
      { width: 1920, height: 1080 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const bioSection = page.locator('.home-bio');
      await expect(bioSection).toBeVisible();
    }
  });

});
