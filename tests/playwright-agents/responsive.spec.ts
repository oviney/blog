import { test, expect } from '@playwright/test';

/**
 * Responsive behaviour tests.
 *
 * Scope note (2026-08-02): this file previously carried nine further tests whose
 * assertions could not fail — font size "between 8px and 50px", paragraph height
 * "between 10px and 1000px", image width "between 10px and 5000px", and a touch-
 * target check that incremented its own pass counter inside every branch,
 * including the catch. They were written by successive "healing" passes that
 * widened each bound until the suite went green. They are deleted rather than
 * repaired: the permissive scaffolding was load-bearing, so extracting the intent
 * was a rewrite, not an edit.
 *
 * What survives asserts a real contract and fails when that contract breaks.
 */

// Test viewport configurations matching the Playwright projects.
const viewports = {
  mobile: { width: 320, height: 568 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 }
};

async function expectVisibleFocusIndicator(locator, page) {
  await locator.scrollIntoViewIfNeeded();
  const before = await locator.evaluate((el) => {
    const styles = window.getComputedStyle(el);
    return {
      outlineStyle: styles.outlineStyle,
      outlineWidth: styles.outlineWidth,
      boxShadow: styles.boxShadow,
      borderColor: styles.borderColor,
    };
  });

  await locator.focus();
  await expect(locator).toBeFocused();

  const after = await locator.evaluate((el) => {
    const styles = window.getComputedStyle(el);
    return {
      outlineStyle: styles.outlineStyle,
      outlineWidth: styles.outlineWidth,
      boxShadow: styles.boxShadow,
      borderColor: styles.borderColor,
    };
  });

  const outlineWidth = parseFloat(after.outlineWidth);
  const hasOutline = after.outlineStyle !== 'none' && outlineWidth >= 2;
  const hasShadow = after.boxShadow !== 'none' && after.boxShadow !== before.boxShadow;
  const hasBorderChange = after.borderColor !== before.borderColor;

  expect(hasOutline || hasShadow || hasBorderChange).toBeTruthy();

  const box = await locator.boundingBox();
  expect(box).not.toBeNull();

  const isUnobscured = await locator.evaluate((el, point) => {
    const top = document.elementFromPoint(point.x, point.y);
    return !!top && (top === el || el.contains(top) || top.contains(el));
  }, {
    x: box!.x + box!.width / 2,
    y: box!.y + box!.height / 2,
  });

  expect(isUnobscured).toBeTruthy();

  await page.keyboard.press('Escape').catch(() => {});
}

test.describe('@visual Responsive Layout Adaptation @REQ-NAV-01 @REQ-VISUAL-01', () => {

  test('Navigation menu adapts to viewport size', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Scoped to the primary top navigation (.site-nav) so the assertion isn't
    // ambiguous when other <nav> landmarks (e.g. .bottom-nav) are present.
    const navigation = page.locator('.site-nav');
    const hamburger = page.locator('.nav-toggle');

    // On mobile/tablet viewports the nav is hidden behind the hamburger; open it first
    if (!(await navigation.first().isVisible()) && await hamburger.isVisible()) {
      await hamburger.click();
    }
    await expect(navigation.first()).toBeVisible();

    // Test mobile navigation
    await page.setViewportSize(viewports.mobile);
    await page.waitForLoadState('networkidle');

    // Open hamburger on mobile so nav is visible for measurement
    if (!(await navigation.first().isVisible()) && await hamburger.isVisible()) {
      await hamburger.click();
    }

    const mobileNavBox = await navigation.boundingBox();
    expect(mobileNavBox).not.toBeNull();

    // Test tablet navigation
    await page.setViewportSize(viewports.tablet);
    await page.waitForLoadState('networkidle');

    // Open hamburger on tablet if nav is still hidden
    if (!(await navigation.first().isVisible()) && await hamburger.isVisible()) {
      await hamburger.click();
    }

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

  test('@REQ-A11Y-02 mobile navigation toggle meets WCAG 2.2 focus and target-size expectations', async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize(viewports.mobile);
    await page.waitForLoadState('networkidle');

    const toggle = page.locator('.nav-toggle');
    await expect(toggle).toBeVisible();

    const box = await toggle.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);

    await expectVisibleFocusIndicator(toggle, page);
  });

});

test.describe('@accessibility Touch target sizing @REQ-A11Y-02 @REQ-NAV-01', () => {

  test.use({ viewport: viewports.mobile });

  // Replaces the previous "Touch targets meet minimum size requirements" test,
  // which applied a 16-32px sliding floor and then incremented its pass counter
  // in every failing branch — including `catch` — so no element could fail it.
  //
  // WCAG 2.2 SC 2.5.8 (AA) sets 24x24 CSS px; `.github/instructions/
  // tests.instructions.md` sets the house standard for navigation at 44x44.
  // Primary navigation links are held to the house standard, with no escape
  // hatch: every visible link in `.site-nav` must pass.
  test('primary navigation links meet the 44px house standard', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const hamburger = page.locator('.nav-toggle');
    const nav = page.locator('.site-nav').first();

    if (!(await nav.isVisible()) && await hamburger.isVisible()) {
      await hamburger.click();
      await expect(nav).toBeVisible();
    }

    const links = nav.getByRole('link');
    const linkCount = await links.count();
    expect(linkCount).toBeGreaterThan(0);

    const undersized: string[] = [];

    for (let i = 0; i < linkCount; i++) {
      const link = links.nth(i);
      if (!(await link.isVisible())) continue;

      const box = await link.boundingBox();
      expect(box, `nav link ${i} has no layout box`).not.toBeNull();

      // The larger dimension must clear 44px — matches the documented house rule
      // for navigation touch targets.
      if (Math.max(box!.width, box!.height) < 44) {
        undersized.push(
          `${(await link.textContent())?.trim() || `link ${i}`} (${Math.round(box!.width)}x${Math.round(box!.height)})`
        );
      }
    }

    expect(undersized, `undersized nav touch targets: ${undersized.join(', ')}`).toHaveLength(0);
  });

});

// The site-wide 320px horizontal-overflow guard moved to page-contract.spec.ts
// so it runs on every PR rather than only in the nightly suite.

test.describe('@visual Category Listing Grid Width @REQ-VISUAL-01', () => {

  // Guard for the regression where category/topic listing pages inherited the
  // 900px article reading cap (plus a 148px fixed side padding), crushing the
  // 3-column .topic-grid into a ~556px centered column on wide desktops.
  test('Category page grid uses the full listing width at desktop', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto('/security/');
    await page.waitForLoadState('networkidle');

    const wrapper = page.locator('.topic-page, .econ-topic-page').first();
    await expect(wrapper).toBeVisible();

    const wrapperBox = await wrapper.boundingBox();
    expect(wrapperBox).not.toBeNull();
    // The listing wrapper must escape the 900px article cap (target ~1040px).
    expect(wrapperBox!.width).toBeGreaterThanOrEqual(1000);

    const firstCard = page.locator('.topic-card').first();
    await expect(firstCard).toBeVisible();

    const cardBox = await firstCard.boundingBox();
    expect(cardBox).not.toBeNull();
    // Each of the 3 columns needs >= 280px for the card design to hold.
    expect(cardBox!.width).toBeGreaterThanOrEqual(280);
  });

});

test.describe('@visual Gap E — Listing width matches design token @REQ-VISUAL-01', () => {

  // Gap E (docs/agents/visual-audit-findings.md): Playwright ran at 320/768/1920
  // but never asserted a listing container's computed width against its intended
  // `max-width` design token, so dead width ceilings (the ~852px / ~556px
  // regressions in defects #1 and #3) passed unnoticed. The CSS was fixed by
  // #1097 (the `.main-content:has(.topic-page), :has(.econ-topic-page)` width
  // unlock + `max-width: 1040px` on the wrappers). These assertions lock that
  // contract so the token can never silently drift again.
  //
  // `.topic-page` (category pages) and `.econ-topic-page` (/blog/) both declare
  // `max-width: 1040px`. At a 1920px viewport the centered wrapper's boundingBox
  // width must land within a tolerance band around that token — tight enough to
  // catch the crushed-column regressions, loose enough to absorb sub-pixel
  // rounding and any wrapper padding.
  const WIDTH_TOKEN = 1040;
  const WIDTH_TOLERANCE = 50; // accept [990, 1090]

  // Wrapper and card selectors are per-page rather than one shared family list.
  // That is the whole lesson of #1260: the homepage redesign named its wrapper
  // `.home-2026`, which is in neither the `.topic-page` nor `.econ-topic-page`
  // family, so it matched neither the theme's `:has()` width unlock NOR this
  // guard. The page was born pinched at 852px — the exact defect #1 value this
  // block exists to catch — and born uncovered, because the fix and the guard
  // were keyed on the same strings. A new page type must now name its selectors
  // here explicitly, and a missing entry is visible in this list rather than
  // silently absent from a shared union selector.
  const listingPages = [
    { path: '/', name: 'Homepage', wrapper: '.home-2026', card: '.h26-topic' },
    { path: '/security/', name: 'Security', wrapper: '.topic-page', card: '.topic-card' },
    { path: '/software-engineering/', name: 'Software Engineering', wrapper: '.topic-page', card: '.topic-card' },
    { path: '/test-automation/', name: 'Test Automation', wrapper: '.topic-page', card: '.topic-card' },
    // /blog/ renders `.topic-card`, not `.econ-article-card`. The previous
    // shared union selector (`.topic-card, .econ-article-card`) hid that:
    // `.econ-article-card` is emitted by no template on the site and survives
    // only as orphaned CSS at economist-theme.scss:1767, so the union always
    // resolved via the `.topic-card` half. Naming selectors per page surfaces
    // dead ones instead of silently falling back past them.
    { path: '/blog/', name: 'Blog index', wrapper: '.econ-topic-page', card: '.topic-card' },
  ];

  for (const { path, name, wrapper: wrapperSel, card: cardSel } of listingPages) {
    test(`${name} (${path}) wrapper width ≈ ${WIDTH_TOKEN}px at 1920px`, async ({ page }) => {
      await page.setViewportSize(viewports.desktop);
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const wrapper = page.locator(wrapperSel).first();
      await expect(wrapper).toBeVisible();

      const wrapperBox = await wrapper.boundingBox();
      expect(wrapperBox).not.toBeNull();
      // Assert the computed width against the 1040px design token, not just a
      // floor — a dead ceiling that renders ~852px would still clear a bare
      // lower bound, which is exactly how Gap E slipped through.
      expect(Math.abs(wrapperBox!.width - WIDTH_TOKEN)).toBeLessThanOrEqual(WIDTH_TOLERANCE);

      // Listing cards (`.topic-card` on category pages and /blog/, `.h26-topic`
      // on the homepage) must keep the >= ~280px per-column width the 3-up grid
      // needs. The pinched homepage rendered these at 257px.
      const firstCard = page.locator(cardSel).first();
      await expect(firstCard).toBeVisible();

      const cardBox = await firstCard.boundingBox();
      expect(cardBox).not.toBeNull();
      expect(cardBox!.width).toBeGreaterThanOrEqual(280);
    });
  }

});

test.describe('@visual Gap F — Masthead sits on the site grid @REQ-VISUAL-01', () => {

  // Gap E asserts a listing wrapper is ~1040px wide. Nothing asserted that the
  // masthead sits on the same axis as that wrapper, and the two were never
  // connected in CSS: `.site-title` and `.site-nav ul` carried their own
  // hardcoded `max-width: 900px`. So the masthead lined up with the content
  // column on exactly one page type (`/about/`) and was off by between -83px
  // and +94px everywhere else.
  //
  // #1260 made that visible on `/` — it widened the home page to 1040px but
  // could not move the masthead, because `_sass/economist-theme.scss` was out
  // of scope for that cycle. It then re-seeded the visual baselines, which
  // recorded the misalignment as expected. A pixel gate cannot flag a
  // regression it has been taught to expect, which is why this has to be a
  // geometric assertion rather than a screenshot.
  //
  // The contract: masthead and nav anchor to one grid on every page, whatever
  // that page's own reading measure is.
  const GRID_MAX_WIDTH = 1040; // $grid-max-width
  const GRID_GUTTER = 32;      // $spacing-lg at the site's 16px root
  const TOLERANCE = 1;         // sub-pixel rounding only

  // Where the grid's text edge falls at a given viewport. Computed rather than
  // hardcoded: asserting a literal `232` would pass at 1440px and be silently
  // meaningless at every other width.
  const gridTextLeft = (viewportWidth: number) =>
    Math.max(0, (viewportWidth - GRID_MAX_WIDTH) / 2) + GRID_GUTTER;

  // The grid only binds above the 767px nav breakpoint; below it the masthead
  // keeps the narrow `$spacing-md` gutter and this contract does not apply.
  // 1024 is deliberate: below the grid's own width, so `gridTextLeft` clamps to
  // a bare gutter. It proves the assertion is computed rather than a 1440px
  // coincidence, and covers the band where the wrappers are fluid.
  const gridViewports = [
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ];

  // `onGrid: true` means the page's content column is the grid itself, so its
  // text must share the masthead's axis. `false` means the page deliberately
  // narrows its reading measure inside the grid — `/about/` at 900px and posts
  // at 750px ($content-max-width) — and is expected to be inset. Those pages
  // still assert the masthead, because the masthead belongs to the site rather
  // than to the article.
  const pages = [
    { path: '/', name: 'Homepage', wrapper: '.home-2026', onGrid: true },
    { path: '/blog/', name: 'Blog index', wrapper: '.econ-topic-page', onGrid: true },
    { path: '/security/', name: 'Security', wrapper: '.topic-page', onGrid: true },
    { path: '/search/', name: 'Search', wrapper: '.topic-page', onGrid: true },
    { path: '/about/', name: 'About', wrapper: '.main-content', onGrid: false },
    { path: '/2025/12/31/testing-times/', name: 'Post', wrapper: '.economist-article', onGrid: false },
  ];

  // Left edge of an element's *content* box — where the reader sees text or a
  // block start, not where its padding starts.
  const textLeft = (selector: string) => async (page) =>
    page.locator(selector).first().evaluate((el: Element) => {
      const rect = el.getBoundingClientRect();
      return rect.left + parseFloat(window.getComputedStyle(el).paddingLeft);
    });

  for (const viewport of gridViewports) {
    for (const { path, name, wrapper, onGrid } of pages) {
      test(`${name} (${path}) masthead is on the grid at ${viewport.width}px`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto(path);
        await page.waitForLoadState('networkidle');

        const expected = gridTextLeft(viewport.width);

        // The masthead's red logo block is an inline-block anchor flush with
        // the title's content box, so its own left edge is the visible axis.
        const logo = page.locator('.site-title a').first();
        await expect(logo).toBeVisible();
        const logoLeft = (await logo.boundingBox())!.x;
        expect(
          Math.abs(logoLeft - expected),
          `masthead at ${logoLeft}px, grid at ${expected}px`,
        ).toBeLessThanOrEqual(TOLERANCE);

        // Each nav link carries its own `padding-left: $spacing-md`, so it is
        // the link's text edge — not the list box — that has to land on the
        // grid. Checking the `ul` instead would pass while the visible nav sat
        // 24px inboard of the masthead, which is what it did before this guard.
        const navLinkLeft = await textLeft('.site-nav ul li a')(page);
        expect(
          Math.abs(navLinkLeft - expected),
          `first nav link at ${navLinkLeft}px, grid at ${expected}px`,
        ).toBeLessThanOrEqual(TOLERANCE);

        const contentLeft = await textLeft(wrapper)(page);
        if (onGrid) {
          expect(
            Math.abs(contentLeft - expected),
            `${wrapper} text at ${contentLeft}px, grid at ${expected}px`,
          ).toBeLessThanOrEqual(TOLERANCE);
        } else {
          // Inset by design. Assert it really is inset rather than skipping:
          // a narrow measure that drifted *outboard* of the grid would be a
          // regression this branch would otherwise wave through.
          expect(
            contentLeft,
            `${wrapper} should be inset from the grid, not outboard of it`,
          ).toBeGreaterThan(expected);
        }
      });
    }
  }

});

test.describe('@visual Image Responsiveness @REQ-VISUAL-01', () => {

  test('Hero images never exceed the viewport at any width', async ({ page }) => {
    await page.goto('/2025/12/31/testing-times/'); // Post with hero image

    const heroImage = page.locator('.hero-image, .post-image, img').first();
    await expect(heroImage).toBeVisible();

    for (const viewport of [viewports.mobile, viewports.tablet, viewports.desktop]) {
      await page.setViewportSize(viewport);
      await page.waitForLoadState('networkidle');

      const imageBox = await heroImage.boundingBox();
      expect(imageBox, `hero image has no layout box at ${viewport.width}px`).not.toBeNull();

      // The image must fit the viewport (1px rounding tolerance) — the previous
      // version allowed +20px, which tolerated a real overflow.
      expect(imageBox!.width, `hero image overflows at ${viewport.width}px`)
        .toBeLessThanOrEqual(viewport.width + 1);

      // A collapsed or stretched hero is a layout break, not a style choice.
      const aspectRatio = imageBox!.width / imageBox!.height;
      expect(aspectRatio).toBeGreaterThan(0.5);
      expect(aspectRatio).toBeLessThan(4.0);
    }
  });

});

test.describe('@visual Inline Chart Overflow @REQ-VISUAL-01', () => {

  // Guard for P2: inline /charts/ images must shrink below their 500px desktop
  // cap on narrow phones so the page never gains horizontal scroll. Fails on
  // origin/main (fixed max-width: 500px) and passes once the chart rule uses
  // max-width: min(500px, 100%).
  const chartPost = '/2026/01/19/the-surprising-economics-of-test-automation-roi/';
  const narrowViewports = [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
  ];

  for (const viewport of narrowViewports) {
    test(`charts do not cause horizontal overflow at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(chartPost);
      await page.waitForLoadState('networkidle');

      // No horizontal page scroll (allow 1px rounding tolerance).
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

      // Every inline chart image must fit within the viewport width.
      const charts = page.locator('.article-content img[src*="/charts/"]');
      const chartCount = await charts.count();
      expect(chartCount).toBeGreaterThan(0);

      for (let i = 0; i < chartCount; i++) {
        const box = await charts.nth(i).boundingBox();
        expect(box).not.toBeNull();
        expect(box!.width).toBeLessThanOrEqual(viewport.width + 1);
      }
    });
  }

});

test.describe('@visual Orientation Change Handling @REQ-VISUAL-01', () => {

  test('Layout adapts to orientation changes on tablet', async ({ page }) => {
    await page.goto('/blog/');

    // Start in portrait orientation
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForLoadState('networkidle');

    const cards = page.locator('.post-card, article');
    await expect(cards.first()).toBeVisible();

    // Switch to landscape orientation
    const landscape = { width: 1024, height: 768 };
    await page.setViewportSize(landscape);
    await page.waitForLoadState('networkidle');

    await expect(cards.first()).toBeVisible();

    const landscapeBox = await cards.first().boundingBox();
    expect(landscapeBox).not.toBeNull();

    // The card must fit the landscape viewport. The previous version asserted a
    // hardcoded 1200px ceiling against a 1024px viewport, so a 175px overflow
    // would have passed.
    expect(landscapeBox!.x + landscapeBox!.width).toBeLessThanOrEqual(landscape.width + 1);

    // Navigation should remain functional
    const navigation = page.locator('nav, .site-nav, .main-nav, [role="navigation"]');
    await expect(navigation.first()).toBeVisible();
  });

});
