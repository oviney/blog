import { test, expect } from '@playwright/test';

/**
 * Homepage Redesign Tests (2026 editorial layout)
 *
 * Validates the `.home-2026` structure that replaced the previous
 * `.homepage` markup:
 * 1. Positioning band — H1 headline + standfirst + archive link
 * 2. Credibility strip — four at-a-glance facts
 * 3. Lead story + "More from the blog" rail
 * 4. Browse-by-topic index (3 topic destinations)
 * 5. Author block
 * 6. Newsletter signup (rendered by _layouts/default.html)
 * 7. Footer with social links + RSS
 *
 * The lead story is an <h2>: the page's single <h1> is now the positioning
 * headline, not the newest post's title. That is deliberate — the homepage is
 * a publication front page, not an article — so the H1 no longer changes on
 * every publish.
 */

test.describe('@content @navigation Homepage Redesign @REQ-CONTENT-01 @REQ-VISUAL-01', () => {

  test('1. Positioning band renders the page H1 and standfirst', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const lede = page.locator('.h26-lede');
    await expect(lede).toBeVisible();

    // The positioning headline is the page's only H1.
    const headline = lede.locator('h1.h26-headline');
    await expect(headline).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);

    // Standfirst must name the four beats the site covers.
    const standfirst = lede.locator('.h26-standfirst');
    await expect(standfirst).toBeVisible();
    await expect(standfirst).toContainText('test strategy');
    await expect(standfirst).toContainText('automation ROI');

    // Archive link resolves to /blog/.
    const archiveLink = lede.locator('.h26-lede-link a');
    await expect(archiveLink).toBeVisible();
    expect(await archiveLink.getAttribute('href')).toContain('/blog/');
  });

  test('2. Credibility strip shows four facts, each with a figure and a label', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const facts = page.locator('.h26-fact');
    await expect(facts).toHaveCount(4);

    for (let i = 0; i < 4; i++) {
      const fact = facts.nth(i);
      await expect(fact.locator('.h26-fact-num')).toBeVisible();

      const label = fact.locator('.h26-fact-label');
      await expect(label).toBeVisible();
      expect((await label.textContent())?.trim().length).toBeGreaterThan(0);
    }

    // The archive-size figure is generated from site.posts, so it must be a
    // real number rather than an unrendered Liquid tag.
    const archiveCount = facts.nth(1).locator('.h26-fact-num');
    expect((await archiveCount.textContent())?.trim()).toMatch(/^\d+$/);
  });

  test('3. Lead story renders title, excerpt, CTA and meta', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const lead = page.locator('.h26-lead');
    await expect(lead).toBeVisible();

    // "Latest" flag marks the lead slot.
    await expect(lead.locator('.h26-flag')).toBeVisible();

    // Lead title is an H2 with a link to the post.
    const leadTitle = lead.locator('h2.h26-lead-title');
    await expect(leadTitle).toBeVisible();
    const leadLink = leadTitle.getByRole('link');
    expect(await leadLink.count()).toBeGreaterThan(0);
    expect(await leadLink.first().getAttribute('href')).toBeTruthy();

    // Excerpt and CTA.
    await expect(lead.locator('.h26-lead-excerpt')).toBeVisible();

    const cta = lead.locator('.h26-lead-cta');
    await expect(cta).toBeVisible();
    expect(await cta.getAttribute('href')).toBeTruthy();

    // Meta line carries a machine-readable date and a read-time estimate.
    const meta = lead.locator('.h26-lead-meta');
    await expect(meta.locator('time')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}/);
    await expect(meta).toContainText(/\d+ min read/);
  });

  test('4. Rail lists recent posts and links to the archive', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const rail = page.locator('.h26-rail');
    await expect(rail).toBeVisible();

    // Rail is capped at 3 items by `limit: 3`.
    const items = rail.locator('.h26-rail-item');
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(3);

    // The rail excludes the lead story, so no headline may repeat it.
    const leadTitle = ((await page.locator('.h26-lead-title').textContent()) || '')
      .replace('Latest post:', '')
      .trim();

    for (let i = 0; i < count; i++) {
      const titleLink = items.nth(i).locator('.h26-rail-title a');
      await expect(titleLink).toBeVisible();
      expect(await titleLink.getAttribute('href')).toBeTruthy();
      expect((await titleLink.textContent())?.trim()).not.toBe(leadTitle);
    }

    const viewAll = rail.locator('.h26-rail-more a');
    await expect(viewAll).toBeVisible();
    expect(await viewAll.getAttribute('href')).toContain('/blog/');
  });

  test('5. Topic index shows 3 topics with counts and correct destinations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const topicsSection = page.locator('.h26-topics');
    await expect(topicsSection).toBeVisible();

    const topics = page.locator('.h26-topic');
    await expect(topics).toHaveCount(3);

    // Order is deliberate: the primary beat leads.
    const expectedDestinations = [
      { href: '/test-automation/', cta: 'Browse the analysis' },
      { href: '/software-engineering/', cta: 'Browse the essays' },
      { href: '/security/', cta: 'Browse the reporting' },
    ];

    for (let i = 0; i < 3; i++) {
      const topic = topics.nth(i);

      // The whole card is the link.
      const href = await topic.getAttribute('href');
      expect(href).toContain(expectedDestinations[i].href);

      const title = topic.locator('.h26-topic-title');
      await expect(title).toBeVisible();
      expect((await title.textContent())?.trim().length).toBeGreaterThan(0);

      await expect(topic.locator('.h26-topic-desc')).toBeVisible();

      // Counts come from Liquid `where_exp` filters — assert a real integer,
      // not an unrendered tag or an empty string.
      const num = topic.locator('.h26-topic-num');
      await expect(num).toBeVisible();
      expect((await num.textContent())?.trim()).toMatch(/^\d+$/);

      await expect(topic.locator('.h26-topic-link')).toContainText(expectedDestinations[i].cta);
    }
  });

  test('6. Author block is visible with name, bio, and links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const author = page.locator('.h26-author');
    await expect(author).toBeVisible();

    await expect(author.locator('.h26-author-avatar')).toBeVisible();

    const name = author.locator('.h26-author-name');
    await expect(name).toBeVisible();
    expect((await name.textContent())?.trim().length).toBeGreaterThan(0);

    const bio = author.locator('.h26-author-bio');
    await expect(bio).toBeVisible();
    expect((await bio.textContent())?.trim().length).toBeGreaterThan(0);

    const links = author.locator('.h26-author-link');
    expect(await links.count()).toBeGreaterThanOrEqual(2);
  });

  test('7. Newsletter signup section is present', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const newsletter = page.locator('.newsletter-signup');
    await expect(newsletter).toBeVisible();

    const heading = newsletter.locator('.newsletter-heading');
    await expect(heading).toBeVisible();
  });

  test('8. Footer has social links and RSS', async ({ page }) => {
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

  test('Lead story → Article navigation works', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const cta = page.locator('.h26-lead-cta').first();
    await expect(cta).toBeVisible();

    const href = await cta.getAttribute('href');
    expect(href).toBeTruthy();

    await cta.click();
    await page.waitForLoadState('networkidle');

    // Should have navigated to a post page
    const currentUrl = page.url();
    expect(currentUrl).not.toBe('http://localhost:4000/');
  });

  test('Homepage page-level landmarks match ARIA smoke snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Page-level smoke snapshot — asserts the three structural landmarks
    // (banner, main, contentinfo) exist at top level on every viewport.
    // Navigation is deliberately not asserted here: at mobile widths the
    // primary nav collapses into a "Open navigation menu" button and is no
    // longer a top-level <nav> landmark, so a snapshot that included nav
    // would fail on Mobile/Tablet Chrome. Detailed nav assertions live in
    // navigation.spec.ts (desktop) and the mobile-nav tests there. See #947
    // for migration context.
    await expect(page).toMatchAriaSnapshot(`
      - banner
      - main
      - contentinfo
    `);
  });

});

test.describe('@visual @navigation Homepage Responsive Layout @REQ-VISUAL-01 @REQ-CONTENT-01', () => {

  test('Topic cards stack on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const topics = page.locator('.h26-topic');
    await expect(topics.first()).toBeVisible();

    const firstBox = await topics.nth(0).boundingBox();
    const secondBox = await topics.nth(1).boundingBox();

    expect(firstBox).not.toBeNull();
    expect(secondBox).not.toBeNull();

    // Stacked layout: second card sits below the first.
    expect(secondBox!.y).toBeGreaterThan(firstBox!.y);
  });

  test('Topic cards are 3-column on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const topics = page.locator('.h26-topic');
    await expect(topics).toHaveCount(3);

    const firstBox = await topics.nth(0).boundingBox();
    const secondBox = await topics.nth(1).boundingBox();

    expect(firstBox).not.toBeNull();
    expect(secondBox).not.toBeNull();

    // Side-by-side layout: cards should have similar Y positions.
    // Allow up to 50px difference to account for slight rendering offsets.
    const LAYOUT_TOLERANCE_PX = 50;
    expect(Math.abs(firstBox!.y - secondBox!.y)).toBeLessThan(LAYOUT_TOLERANCE_PX);
  });

  test('Lead story and rail stack into one column on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const leadBox = await page.locator('.h26-lead').boundingBox();
    const railBox = await page.locator('.h26-rail').boundingBox();

    expect(leadBox).not.toBeNull();
    expect(railBox).not.toBeNull();

    // Single column: the rail drops below the lead rather than beside it.
    expect(railBox!.y).toBeGreaterThan(leadBox!.y);
  });

  test('Author block is visible on all viewports', async ({ page }) => {
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 768, height: 1024 },
      { width: 1920, height: 1080 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('.h26-author')).toBeVisible();
    }
  });

  test('Theme drop-cap does not leak onto homepage article kickers', async ({ page }) => {
    // Regression guard: economist-theme.scss:1416 applies a 3rem drop-cap to
    // `article > p:first-of-type::first-letter` below its mobile breakpoint.
    // The redesign introduced <article> wrappers whose first <p> child is a
    // small kicker/subtitle, so the unscoped rule rendered a 10.4px uppercase
    // category label's first letter at 48px. `.home-2026` resets it.
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    for (const selector of ['.h26-lead-subtitle', '.h26-rail-category']) {
      const el = page.locator(selector).first();
      if ((await el.count()) === 0) continue;

      const { base, firstLetter } = await el.evaluate((node) => ({
        base: parseFloat(getComputedStyle(node).fontSize),
        firstLetter: parseFloat(getComputedStyle(node, '::first-letter').fontSize),
      }));

      expect(firstLetter, `${selector} first-letter must not be enlarged`).toBeCloseTo(base, 1);
    }
  });

});
