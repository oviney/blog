import { test, expect } from '@playwright/test';

// These cases choose their own viewport; run the matrix once.
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
