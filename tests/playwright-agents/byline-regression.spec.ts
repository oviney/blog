import { test, expect } from '@playwright/test';

test.use({ baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4000' });

test.describe('@content Byline regression coverage', () => {
  test('blog cards and post headers render a visible byline', async ({ page }) => {
    await page.goto('/blog/');
    await page.waitForLoadState('networkidle');

    const firstCard = page.locator('.econ-article-card').first();
    await expect(firstCard).toBeVisible();

    const cardByline = firstCard.getByText(/^By\s+\S/).first();
    await expect(cardByline).toBeVisible();
    const cardBylineText = (await cardByline.textContent())?.trim();

    expect(cardBylineText).toBeTruthy();
    expect(cardBylineText).toMatch(/^By\s+\S.+$/);

    const postLink = firstCard.locator('h2 a').first();
    await expect(postLink).toBeVisible();

    const postHref = await postLink.getAttribute('href');
    expect(postHref).toBeTruthy();

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(postHref!);
    await page.waitForLoadState('networkidle');

    const articleHeader = page.locator('.article-header').first();
    await expect(articleHeader).toBeVisible();

    const postByline = articleHeader.getByText(/^By\s+\S/).first();
    await expect(postByline).toBeVisible();
    await expect(postByline).toHaveText(cardBylineText!);

    const box = await postByline.boundingBox();
    const viewport = page.viewportSize();

    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height);
  });
});
