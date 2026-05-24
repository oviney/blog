# SPEC — Mobile Thumb-Zone Bottom Navigation (#953)

**Status:** Draft — awaiting approval
**Issue:** [#953](https://github.com/oviney/blog/issues/953)
**Labels:** `agent:creative-director`
**Date:** 2026-05-24
**Lifecycle phase:** DEFINE
**Spawned from:** Research Sweep [#943](https://github.com/oviney/blog/issues/943) (2026-05-15)

---

## 1. Situation

Mobile navigation on viney.ca relies exclusively on a top-left hamburger menu (`_layouts/default.html` lines 32–49). On modern tall phones the hamburger sits well outside the natural thumb-reach zone — a documented friction point for high-priority destinations (Home, Blog, Search). The existing top nav stays; this spec adds a complementary fixed bottom nav that surfaces only at mobile widths.

The repo already ships every destination the bottom nav needs:

- `/` — home (`index.md`)
- `/blog/` — blog index
- `/search/` — search page (`search.html`)

Design-system context (audited at HEAD `c5eabc5`):

- Mobile breakpoint pattern in `_sass/economist-theme.scss` is **`max-width: 768px`** (used in 14+ rules; `768px` is the de facto boundary).
- Spacing tokens: `$spacing-xs … $spacing-xl` in `_sass/economist-theme.scss`.
- Fonts: `$font-sans`, `$font-serif` in `_sass/economist-theme.scss`.
- Theme color: `#E3120B` (Economist red, declared in `_layouts/default.html` line 17 as `meta name="theme-color"` — promote to a `$brand-red` variable as part of this work *only if* one does not already exist; otherwise reuse).
- Existing nav rules live at `_sass/economist-theme.scss:70` (`.page-header`), `:104` (`.site-nav`), `:157` (`.nav-toggle`).

The issue body anticipates JS may not be needed — confirmed: a CSS-only media-query implementation satisfies every AC, so no new JS ships in this PR.

---

## 2. Objective

Add a fixed bottom navigation bar that appears only at viewports `≤ 767px`, surfacing **Home / Blog / Search** with stacked icon + label, an active-state highlight for the current section, and proper iOS safe-area handling — without altering the existing top hamburger nav or touching protected files. Ship as one atomic PR routed to `agent:creative-director` (Copilot Coding Agent).

---

## 3. Design Decisions (confirmed 2026-05-24)

| Decision | Choice | Rationale |
|---|---|---|
| Visual treatment | **Stacked SVG icon + text label** | Standard mobile bottom-nav pattern; more scannable in thumb zone than icon-only or text-only. |
| Active state | **Yes — via Liquid `page.url` match** | Pure CSS class toggle at render time; no JS, no client-side routing logic. |
| Scope | **Every page at mobile widths** | Rendered in `_layouts/default.html` so home, blog, post, and topic pages all get it. |
| Visibility logic | **CSS-only media query** | No new JS file; consistent with issue's "or pure CSS media query if no JS needed" preference. |
| iOS safe-area | **Respect `env(safe-area-inset-bottom)`** | Standard bottom-nav requirement on iPhones with home indicator. Adds bottom padding inside the nav so labels don't sit under the indicator. |
| Z-index | **Above main content, below modal overlays** | Use a single SCSS variable (e.g. `$z-bottom-nav: 50`) introduced alongside the partial. |
| Breakpoint | **`max-width: 767px`** (matches `min-width: 768px` desktop boundary used elsewhere) | Aligns with the codebase's de facto mobile breakpoint, not the `641px` example in the issue. |

---

## 4. Acceptance Criteria

- [ ] **AC-1** At a 375×667 viewport, every page renders a fixed bottom `<nav class="bottom-nav" aria-label="Primary mobile navigation">` containing Home / Blog / Search.
- [ ] **AC-2** At a 1024×768 viewport, `.bottom-nav` is `display: none` (asserted via Playwright computed-style check, not just visual).
- [ ] **AC-3** Each link is icon + label stacked vertically; tap-target is **≥ 44×44 px** (WCAG 2.5.8 target size minimum). Icons are inline SVG with `aria-hidden="true"`; the link's accessible name comes from the text label.
- [ ] **AC-4** When the current page matches a nav destination (`page.url == '/'`, starts with `/blog/`, or starts with `/search/`), that link receives `class="is-active"` and is styled with brand-red accent + `aria-current="page"`.
- [ ] **AC-5** iOS safe-area: the nav uses `padding-bottom: max($spacing-xs, env(safe-area-inset-bottom))` so labels clear the home indicator on notched iPhones.
- [ ] **AC-6** All colours, spacing, typography, and the new `$z-bottom-nav` variable come from `_sass/economist-theme.scss` (or `_sass/variables.scss`). **Zero hardcoded hex codes, px values, or font-family strings** in the new `.bottom-nav` rules.
- [ ] **AC-7** `pa11y-ci` passes on `/` and `/blog/` at mobile viewport. No new violations introduced.
- [ ] **AC-8** Lighthouse mobile score on `/` does not regress vs. the most recent baseline run on `main`. Performance category specifically must not drop more than 1 point.
- [ ] **AC-9** A new Playwright spec at `tests/playwright-agents/bottom-nav.spec.ts` covers: (a) visible at 375×667 with all three links present and correctly labelled, (b) hidden at 1024×768, (c) `is-active` + `aria-current="page"` applied when on `/blog/`, (d) tap-target ≥ 44×44 px on each link.
- [ ] **AC-10** `bundle exec jekyll build` exits 0.
- [ ] **AC-11** *(amended 2026-05-24 during BUILD — see Risks §10 row "Existing nav-locator regression")* Scope-guard boundary: `git diff --name-only main...HEAD` is — `_layouts/default.html`, `_sass/economist-theme.scss`, `tests/playwright-agents/bottom-nav.spec.ts`, `tests/playwright-agents/responsive.spec.ts` (one-line locator fix), and this `SPEC.md`. Five files. Zero changes to `_config.yml`, `Gemfile`, `Gemfile.lock`, `.github/CODEOWNERS`, `.github/copilot-instructions.md`. No new JS file.

---

## 5. Commands

```bash
# Inspect baseline
grep -n "site-nav\|nav-toggle\|page-header" _layouts/default.html
grep -nE "@media.*(min-width|max-width)" _sass/economist-theme.scss | head
grep -nE "\$spacing-|\$font-|\$z-" _sass/economist-theme.scss | head

# Local dev loop
bundle exec jekyll serve --config _config.yml,_config_dev.yml &

# Visual verification at mobile + desktop
open "http://localhost:4000/"           # then DevTools → iPhone SE (375×667)
open "http://localhost:4000/blog/"      # confirm active-state on /blog/

# Tests
npx playwright test tests/playwright-agents/bottom-nav.spec.ts
npx playwright test                      # full sweep — confirm no regression
npm run test:a11y                        # pa11y-ci on / and /blog/

# Build gate
bundle exec jekyll build
```

---

## 6. Project Structure (touched files)

```
_layouts/default.html                              # M — add <nav class="bottom-nav"> block after </main> or before </body>
_sass/economist-theme.scss                         # M — append .bottom-nav rules; introduce $z-bottom-nav variable
tests/playwright-agents/bottom-nav.spec.ts         # A — new spec covering AC-2, AC-3, AC-4, AC-9
```

No new SCSS partial files (the issue notes a "new `.bottom-nav` partial" but the repo's convention is one `economist-theme.scss` monolith — append, don't split). No new JS file. No new asset files (SVG icons are inline in the template).

---

## 7. Code Style

- **SCSS:** Append the `.bottom-nav` block at the bottom of `_sass/economist-theme.scss` (the file is monolithic by convention). Wrap mobile-only rules in `@media (max-width: 767px) { ... }`; the default state of `.bottom-nav` outside the query is `display: none`.
- **Variables only:** every colour, spacing, font, and z-index value comes from a `$variable`. If a needed token does not exist (e.g. `$z-bottom-nav`), add it at the top of the file in the same `// Z-index` section as any existing z-index tokens (or create the section if none exists).
- **HTML:** the new `<nav>` lives in `_layouts/default.html`, inserted **after** the `<footer>` close (line 89) and **before** the navigation `<script>` block (line 90). Use 2-space indentation matching the surrounding template.
- **Liquid active-state pattern:**
  ```liquid
  {% assign p = page.url %}
  <a href="{{ '/' | relative_url }}"
     class="bottom-nav__link{% if p == '/' %} is-active{% endif %}"
     {% if p == '/' %}aria-current="page"{% endif %}>
  ```
  Apply the equivalent `contains` check for `/blog/` and `/search/`.
- **Inline SVG icons:** match the style of the existing RSS icon at `_layouts/default.html:47` (24×24 viewBox, `currentColor`, `aria-hidden="true"`). Source from Heroicons outline set (MIT licensed) — Home `home`, Blog `newspaper`, Search `magnifying-glass`. Inline the SVG; do not link external icon files.
- **Comments:** one short `<!-- Mobile bottom nav (#953) -->` marker before the `<nav>` block. No multi-paragraph comments. No commit refs.

---

## 8. Testing Strategy

1. **Local Playwright first.** Run `tests/playwright-agents/bottom-nav.spec.ts` standalone, then the full sweep against `bundle exec jekyll serve`. Both must exit 0 before pushing.
2. **Viewport assertions are computed-style based, not visual.** Avoid screenshot baselines for this spec — they're brittle at the breakpoint boundary and we already have visual coverage from existing Playwright shard 3. Assert `display: none` vs `display: flex` (or whatever the implementation uses) via `evaluate(el => getComputedStyle(el).display)`.
3. **Active-state coverage:** test the `/blog/` route specifically; that's the path most likely to regress because of the `contains` prefix match (must match `/blog/` and `/blog/some-post/` but **not** `/blog-archive/` if that path is ever added).
4. **Tap-target measurement:** use Playwright `boundingBox()` and assert `width >= 44 && height >= 44`. Done per-link, not once for the nav container.
5. **pa11y-ci is a hard gate** — any new violation at `/` or `/blog/` at mobile viewport fails the AC. Run locally before pushing if there's any doubt.
6. **Lighthouse regression check is a one-time manual gate** — the most recent main-branch Lighthouse run is the baseline; compare via the CI report on the PR.
7. **No unit tests** — this is template + SCSS + one integration spec. No business logic to unit-test.

---

## 9. Boundaries

**Always do:**
- Use design-system variables for every value (AC-6 is non-negotiable).
- Keep diff at ≤ 3 files (AC-11).
- Test active-state on `/blog/` specifically.
- Match `aria-current="page"` to the `.is-active` class — they must always agree.
- Respect `env(safe-area-inset-bottom)` on iOS (AC-5).

**Ask first:**
- If a needed design token doesn't exist and you're tempted to inline a value — propose the new variable and where it should live before adding it.
- If the Lighthouse mobile baseline regresses by more than 1 performance point — investigate root cause before re-baselining.
- If the existing top hamburger nav needs any tweak (it shouldn't — but if e.g. `body` padding-bottom collides with bottom nav at mobile, surface it).
- If a fourth touched file becomes necessary, surface the reason in the PR description and reassess scope.

**Never do:**
- Modify `_config.yml`, `Gemfile`, `Gemfile.lock`, `.github/CODEOWNERS`, `.github/copilot-instructions.md`.
- Add a new JS file or extend `_layouts/default.html`'s existing `<script>` block — CSS-only is the agreed implementation.
- Change the top hamburger nav's markup, styles, or behaviour.
- Add analytics tracking to bottom-nav clicks (out of scope per issue).
- Add a "Recently viewed" or personalisation slot to the nav (Watch item in #943).
- Add a feature flag in `_config.yml` to gate rollout (protected file). If rollout caution is needed, gate via an SCSS feature class instead.
- Use icon-only links (worse accessibility — confirmed during design decision).
- Use `--no-verify` or otherwise skip hooks.
- Use the `bulk-content` or `governance-update` label (this PR is neither).

---

## 10. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Bottom nav overlaps last paragraph of long posts on mobile | High | Add `padding-bottom` to `.main-content` at mobile widths equal to bottom-nav height + safe-area inset. Verify on a long post like the devops-defences article. |
| Active-state prefix match collides with a future `/blog-archive/`-style route | Low | Match `/blog/` with a trailing-slash-aware check (`p == '/blog/' or p contains '/blog/'`) not a loose `contains '/blog'`. |
| pa11y-ci flags contrast on the active-state accent | Medium | Use `$brand-red` (or equivalent existing token) for accent and verify WCAG AA contrast against the nav background colour before pushing. |
| Inline SVG icons inflate `default.html` page weight noticeably | Low | Three 24×24 outline SVGs ≈ 0.5 KB total; well below Lighthouse perf-budget noise floor. |
| Lighthouse mobile drops because of layout shift introduced by the fixed nav | Low-medium | Reserve nav height via `height` + `min-height` on the element from the first paint — do not animate in. CLS budget is 0.1. |
| Existing tests use an over-broad `nav` locator that now resolves to multiple elements | **Realised 2026-05-24** | `responsive.spec.ts:145` "Navigation menu adapts to viewport size" failed via Playwright strict-mode after the second `<nav>` landed. Fixed by scoping the locator to `.site-nav` (the test was always intended for the top hamburger nav). AC-11 amended to include the test fix + this SPEC.md as a 4th and 5th touched file. |

---

## 11. Out of Scope (deferred)

- Top-nav hamburger redesign — leave the existing top nav untouched.
- Adding analytics tracking to bottom-nav clicks (separate decision).
- Personalisation / "Recently viewed" — Watch item in [#943](https://github.com/oviney/blog/issues/943).
- Feature flag in `_config.yml` — protected file; gate via SCSS class if rollout caution is later needed.
- Changing what destinations live in the bottom nav (Home / Blog / Search is the agreed initial set).
- Adding hide-on-scroll behaviour — adds JS, contradicts CSS-only decision.
- Migrating `_sass/economist-theme.scss` into smaller partials — separate refactor.
