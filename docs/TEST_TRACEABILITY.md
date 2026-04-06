# Test–Requirement Traceability Matrix

> Auto-maintained by the Quality Intelligence System.  
> Last updated: 2026-04-06

## Requirement Definitions

| Requirement ID | Area | Description |
|---|---|---|
| REQ-NAV-01 | Navigation | Site nav renders at all viewports (320 / 768 / 1920 px) |
| REQ-NAV-02 | Navigation | Mobile nav opens and closes correctly |
| REQ-CONTENT-01 | Content | Blog index lists posts with correct metadata |
| REQ-CONTENT-02 | Content | Individual post pages render without layout breaks |
| REQ-SEARCH-01 | Search | Search returns relevant results |
| REQ-A11Y-01 | Accessibility | WCAG AA contrast on all pages |
| REQ-A11Y-02 | Accessibility | Keyboard navigation works across all pages |
| REQ-PERF-01 | Performance | Lighthouse score ≥ 80 (mobile), ≥ 90 (desktop) |
| REQ-VISUAL-01 | Visual | No visual regressions vs baseline screenshots |
| REQ-LINKS-01 | Links | No broken internal links |
| REQ-SEC-01 | Security | No vulnerable npm dependencies (audit-level=moderate) |

---

## Coverage Table

| Requirement ID | Covered by spec file(s) | Group tag | Status |
|---|---|---|---|
| REQ-NAV-01 | `navigation.spec.ts`, `homepage.spec.ts`, `responsive.spec.ts` | `@navigation` | ✅ covered |
| REQ-NAV-02 | `navigation.spec.ts` | `@navigation` | ✅ covered |
| REQ-CONTENT-01 | `homepage.spec.ts`, `content-edge-cases.spec.ts`, `seo-jsonld.spec.ts`, `analytics.spec.ts` | `@content` | ✅ covered |
| REQ-CONTENT-02 | `content-edge-cases.spec.ts`, `interactive-elements.spec.ts`, `seo-jsonld.spec.ts` | `@content` | ✅ covered |
| REQ-SEARCH-01 | *(no dedicated spec yet)* | `@search` | ⚠️ gap |
| REQ-A11Y-01 | `responsive.spec.ts` | `@accessibility` | ✅ covered |
| REQ-A11Y-02 | `responsive.spec.ts`, `interactive-elements.spec.ts` | `@accessibility` | ✅ covered |
| REQ-PERF-01 | Lighthouse CI (separate job) | `@performance` | ✅ covered |
| REQ-VISUAL-01 | BackstopJS (separate job), `responsive.spec.ts` | `@visual` | ✅ covered |
| REQ-LINKS-01 | `content-edge-cases.spec.ts` | `@links` | ✅ covered |
| REQ-SEC-01 | `npm audit` CI step | `@security` | ✅ covered |

---

## Spec File → Requirements Map

### `tests/playwright-agents/navigation.spec.ts`

```
@requirements REQ-NAV-01, REQ-NAV-02
@group        navigation
```

| Describe block | Requirements |
|---|---|
| `@navigation Navigation & User Journeys` | REQ-NAV-01, REQ-NAV-02 |
| `@navigation Mobile Navigation Specific Tests` | REQ-NAV-01, REQ-NAV-02 |

---

### `tests/playwright-agents/homepage.spec.ts`

```
@requirements REQ-CONTENT-01, REQ-NAV-01
@group        content navigation
```

| Describe block | Requirements |
|---|---|
| `@content @navigation Homepage Redesign` | REQ-CONTENT-01, REQ-NAV-01 |
| `@content @navigation @visual Homepage Responsive Layout` | REQ-CONTENT-01, REQ-NAV-01, REQ-VISUAL-01 |

---

### `tests/playwright-agents/responsive.spec.ts`

```
@requirements REQ-VISUAL-01, REQ-A11Y-01, REQ-NAV-01
@group        visual accessibility navigation
```

| Describe block | Requirements |
|---|---|
| `@visual @navigation Responsive Layout Adaptation` | REQ-VISUAL-01, REQ-NAV-01 |
| `@visual @accessibility Typography Responsiveness` | REQ-VISUAL-01, REQ-A11Y-01 |
| `@visual Image Responsiveness` | REQ-VISUAL-01 |
| `@accessibility @navigation Interactive Elements Touch Targets` | REQ-A11Y-02, REQ-NAV-01 |
| `@visual @navigation Orientation Change Handling` | REQ-VISUAL-01, REQ-NAV-01 |
| `@visual @navigation Performance Under Responsive Conditions` | REQ-VISUAL-01, REQ-NAV-01 |

---

### `tests/playwright-agents/content-edge-cases.spec.ts`

```
@requirements REQ-CONTENT-01, REQ-CONTENT-02, REQ-LINKS-01
@group        content links
```

| Describe block | Requirements |
|---|---|
| `@content AI Disclosure and Content Badges` | REQ-CONTENT-02 |
| `@content @visual Image Handling Edge Cases` | REQ-CONTENT-02, REQ-VISUAL-01 |
| `@content Content Metadata Variations` | REQ-CONTENT-01, REQ-CONTENT-02 |
| `@content Content Length and Overflow Edge Cases` | REQ-CONTENT-02 |
| `@content @links Related Posts and Content Discovery` | REQ-CONTENT-01, REQ-LINKS-01 |

---

### `tests/playwright-agents/seo-jsonld.spec.ts`

```
@requirements REQ-CONTENT-01, REQ-CONTENT-02
@group        content
```

| Describe block | Requirements |
|---|---|
| `@content SEO JSON-LD Structured Data` | REQ-CONTENT-01, REQ-CONTENT-02 |

---

### `tests/playwright-agents/interactive-elements.spec.ts`

```
@requirements REQ-CONTENT-02, REQ-A11Y-02
@group        content accessibility
```

| Describe block | Requirements |
|---|---|
| `@content @accessibility Reading Progress Bar` | REQ-CONTENT-02, REQ-A11Y-02 |
| `@content @accessibility Table of Contents` | REQ-CONTENT-02, REQ-A11Y-02 |
| `@content @accessibility Copy Code Buttons` | REQ-CONTENT-02, REQ-A11Y-02 |
| `@content @accessibility Back to Top Button` | REQ-CONTENT-02, REQ-A11Y-02 |
| `@content Share Buttons` | REQ-CONTENT-02 |
| `@content Share Buttons (absent on non-post pages)` | REQ-CONTENT-02 |
| `@visual Print Styles` | REQ-VISUAL-01 |
| `@content @accessibility @navigation Interactive Elements - Mobile` | REQ-CONTENT-02, REQ-A11Y-02, REQ-NAV-01 |

---

### `tests/playwright-agents/analytics.spec.ts`

```
@requirements REQ-CONTENT-01
@group        content
```

| Describe block | Requirements |
|---|---|
| `@content Analytics Integration` | REQ-CONTENT-01 |

---

## Regression Tests

Regression tests live in `tests/playwright-agents/regression/`.
They are auto-generated by the Auto-Regression workflow (Story C, issue #634)
when a production bug is filed and tagged `bug` + `production`.

| Bug | Issue | Test file | Status |
|---|---|---|---|
| *(none yet)* | — | — | — |

---

## Group → File Trigger Map

This table shows which changed file patterns trigger which test groups
(defined in `scripts/test-groups.json`):

| Changed paths | Groups triggered |
|---|---|
| `_sass/**`, `assets/css/**` | `visual`, `accessibility` |
| `_layouts/**`, `_includes/**` | **ALL** |
| `_config*.yml` | **ALL** |
| `package*.json` | `security` + **ALL** |
| `_posts/**`, `_drafts/**` | `content`, `links` |
| `assets/js/**` | `navigation`, `search`, `accessibility` |
| `assets/images/**`, `assets/charts/**` | `visual`, `content` |
| `.github/workflows/**` | *(skip Playwright)* |
| *(unmatched)* | **ALL** (safe fallback) |

---

## How to Run by Group

```bash
# Run only navigation tests
npx playwright test --grep "@navigation"

# Run content + links tests (post-only change)
npx playwright test --grep "@content|@links"

# Run visual + accessibility tests (CSS change)
npx playwright test --grep "@visual|@accessibility"

# Run full suite
npx playwright test
```
