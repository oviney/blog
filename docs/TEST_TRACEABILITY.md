# Test–Requirement Traceability Matrix

This document maps every requirement to the Playwright spec files that cover it,
explains which of them gate a pull request and which run nightly.

---

## Requirements

| Requirement ID | Area | Description |
|---------------|------|-------------|
| REQ-NAV-01 | Navigation | Site nav renders at all viewports (320/768/1920 px) |
| REQ-NAV-02 | Navigation | Mobile nav opens/closes correctly |
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

## Spec File → Requirement Coverage

| Spec File | Requirement IDs |
|-----------|----------------|
| `tests/playwright-agents/navigation.spec.ts` | REQ-NAV-01, REQ-NAV-02 |
| `tests/playwright-agents/responsive.spec.ts` | REQ-NAV-01, REQ-VISUAL-01, REQ-A11Y-02 |
| `tests/playwright-agents/homepage.spec.ts` | REQ-CONTENT-01, REQ-CONTENT-02, REQ-LINKS-01, REQ-NAV-01 |
| `tests/playwright-agents/content-edge-cases.spec.ts` | REQ-CONTENT-02, REQ-LINKS-01, REQ-VISUAL-01 |
| `tests/playwright-agents/interactive-elements.spec.ts` | REQ-NAV-02, REQ-A11Y-02, REQ-CONTENT-02 |
| `tests/playwright-agents/seo-jsonld.spec.ts` | REQ-CONTENT-01, REQ-CONTENT-02 |
| `tests/playwright-agents/analytics.spec.ts` | REQ-CONTENT-01 |
| Pa11y CI (`npm run test:a11y`) | REQ-A11Y-01 |
| BackstopJS (`npm run test:visual`) | REQ-VISUAL-01 |
| Lighthouse CI (`npm run test:lighthouse`) | REQ-PERF-01 |
| `npm run test:security` | REQ-SEC-01 |

### Coverage Gaps

| Requirement ID | Status | Notes |
|---------------|--------|-------|
| REQ-SEARCH-01 | ⚠️ No dedicated Playwright spec | Search feature tested manually; a dedicated spec is tracked as a future improvement |

---

## Requirement → Spec File Coverage

| Requirement ID | Spec Files |
|---------------|-----------|
| REQ-NAV-01 | navigation.spec.ts, responsive.spec.ts, homepage.spec.ts |
| REQ-NAV-02 | navigation.spec.ts, interactive-elements.spec.ts |
| REQ-CONTENT-01 | homepage.spec.ts, seo-jsonld.spec.ts, analytics.spec.ts |
| REQ-CONTENT-02 | homepage.spec.ts, content-edge-cases.spec.ts, interactive-elements.spec.ts, seo-jsonld.spec.ts |
| REQ-SEARCH-01 | *(no dedicated spec — see coverage gaps above)* |
| REQ-A11Y-01 | Pa11y CI |
| REQ-A11Y-02 | responsive.spec.ts, interactive-elements.spec.ts |
| REQ-PERF-01 | Lighthouse CI |
| REQ-VISUAL-01 | responsive.spec.ts, content-edge-cases.spec.ts, visual-snapshot.spec.ts |
| REQ-LINKS-01 | homepage.spec.ts, content-edge-cases.spec.ts |
| REQ-SEC-01 | npm audit |

---

## What gates a pull request

Two blocking Playwright jobs, both judging a single `_site` artifact built once
by the `🏗️ Build Site` job:

| Job | Runs | Blocking |
|-----|------|----------|
| `🎭 Page Contract` | `page-contract.spec.ts` on Mobile + Desktop | yes |
| `🖼️ Visual Regression` | `visual-snapshot.spec.ts` on all three viewports | yes |
| `🔒 Security Audit` | `npm audit` + Puppeteer support floor | yes |
| `📝 Content Validation` | `validate-post-quality.sh` | no (warnings advisory) |

The page contract is the whole PR gate for behaviour. For every page type it
asserts: a 200 response and exactly one `h1`; no first-party console error, page
error, failed request or 4xx/5xx response; no horizontal scroll at 320px; mobile
navigation that opens, closes and holds real destinations; and primary nav hrefs
that all resolve.

It is deliberately small and held to a wall-clock budget rather than a coverage
target. Adding a test to it should be a considered decision — if the assertion
does not describe a contract *every* page must honour, it belongs in the nightly
suite.

## What runs nightly

`🌙 Nightly Full Suite` runs at 02:00 UTC, and on dispatch with
`full_suite=true`. It runs the full Playwright suite across all three viewports,
plus pa11y (REQ-A11Y-01) and Lighthouse CI (REQ-PERF-01). It does not gate PRs;
on failure it opens or comments on a single `Nightly quality suite failing`
issue, and triage decides whether a finding becomes a fix, a new contract test,
or an accepted risk.

## Retired: change-based selection and sharding

Until #1197 the PR path ran three sharded Playwright jobs whose test set was
chosen by `scripts/select-tests.sh` from the changed paths. Both are gone from
the PR path.

The selection script routed `@REQ-*` grep expressions that never selected
`@REQ-VISUAL-SNAP`, `@REQ-PAGE-CHROME`, `@REQ-CONTENT-03`, `@REQ-CONTENT-04` or
`@REQ-CONTENT-CAPTION-CASE`, so those tests silently did not run on any targeted
run. The contract suite is small enough to always run in full, which removes the
need to choose. The script remains in the tree for reference; no workflow path
calls it.

---

## Quality Report

After every CI run a `quality-report.json` artefact is uploaded and a markdown
summary is posted to the GitHub Actions step summary. The report contains:

- ✅ Pass/fail per requirement ID
- 📊 Coverage table (which REQ IDs have ≥ 1 test, which are untested)
- ⏱️ Time spent per test group
- 🔁 Whether this was a full run or partial (which groups were skipped and why)

The report is generated by `scripts/generate-quality-report.js`.
