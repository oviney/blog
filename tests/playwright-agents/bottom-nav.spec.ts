import { test, expect } from '@playwright/test';

/**
 * Mobile thumb-zone bottom navigation (#953).
 * Verifies the bottom nav is visible at mobile, hidden at desktop, has working
 * active-state, meets WCAG 2.5.8 tap-target size, and does not overlap content
 * on long pages.
 */

const MOBILE = { width: 375, height: 667 };
const DESKTOP = { width: 1024, height: 768 };

test.describe('@navigation @mobile @accessibility Mobile Bottom Nav @REQ-NAV-01 @REQ-NAV-02 @REQ-A11Y-02', () => {

  test('1. Renders at mobile viewport with Home / Blog / Search links', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const nav = page.locator('.bottom-nav');
    await expect(nav).toBeVisible();
    await expect(nav).toHaveAttribute('aria-label', 'Primary mobile navigation');

    const links = nav.locator('.bottom-nav__link');
    await expect(links).toHaveCount(3);
    await expect(links.nth(0)).toContainText('Home');
    await expect(links.nth(1)).toContainText('Blog');
    await expect(links.nth(2)).toContainText('Search');
  });

  test('2. Hidden at desktop viewport (computed display: none)', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const display = await page.locator('.bottom-nav').evaluate(
      (el) => window.getComputedStyle(el).display
    );
    expect(display).toBe('none');
  });

  test('3. Home link is active on / with aria-current="page"', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const home = page.locator('.bottom-nav__link', { hasText: 'Home' });
    await expect(home).toHaveClass(/is-active/);
    await expect(home).toHaveAttribute('aria-current', 'page');

    const blog = page.locator('.bottom-nav__link', { hasText: 'Blog' });
    await expect(blog).not.toHaveClass(/is-active/);
    expect(await blog.getAttribute('aria-current')).toBeNull();
  });

  test('4. Blog link is active on /blog/ with aria-current="page"', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/blog/');
    await page.waitForLoadState('networkidle');

    const blog = page.locator('.bottom-nav__link', { hasText: 'Blog' });
    await expect(blog).toHaveClass(/is-active/);
    await expect(blog).toHaveAttribute('aria-current', 'page');

    const home = page.locator('.bottom-nav__link', { hasText: 'Home' });
    await expect(home).not.toHaveClass(/is-active/);
    expect(await home.getAttribute('aria-current')).toBeNull();
  });

  test('5. Every link meets WCAG 2.5.8 tap-target size (>=44x44 px)', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const links = page.locator('.bottom-nav__link');
    const count = await links.count();
    expect(count).toBe(3);

    for (let i = 0; i < count; i++) {
      const box = await links.nth(i).boundingBox();
      expect(box, `link ${i} bounding box`).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('6. Bottom nav does not cover last content paragraph on long pages', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/blog/');
    await page.waitForLoadState('networkidle');

    // Pick the first post card link and follow it to a real post page.
    const firstPost = page.locator('article a[href*="/202"]').first();
    const href = await firstPost.getAttribute('href');
    expect(href).toBeTruthy();
    await page.goto(href!);
    await page.waitForLoadState('networkidle');

    // Scroll to the very bottom of the document.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(150);

    const main = page.locator('.main-content');
    const navHandle = page.locator('.bottom-nav');

    const mainBottom = await main.evaluate((el) => el.getBoundingClientRect().bottom);
    const navTop = await navHandle.evaluate((el) => el.getBoundingClientRect().top);

    // .main-content's bottom edge must clear the nav's top edge — proves the
    // padding-bottom mitigation reserves space for the fixed nav.
    expect(mainBottom).toBeLessThanOrEqual(navTop);
  });
});
