# Test–Requirement Traceability Matrix

This document maps every requirement to the Playwright spec files that cover it,
explains the change-based test selection rules, and defines the sharding strategy
used when a full suite run is triggered.

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
| `tests/playwright-agents/responsive.spec.ts` | REQ-NAV-01, REQ-CONTENT-01, REQ-CONTENT-02, REQ-VISUAL-01, REQ-NAV-02, REQ-A11Y-02, REQ-PERF-01 |
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
| REQ-NAV-02 | navigation.spec.ts, responsive.spec.ts, interactive-elements.spec.ts |
| REQ-CONTENT-01 | homepage.spec.ts, responsive.spec.ts, seo-jsonld.spec.ts, analytics.spec.ts |
| REQ-CONTENT-02 | homepage.spec.ts, responsive.spec.ts, content-edge-cases.spec.ts, interactive-elements.spec.ts, seo-jsonld.spec.ts |
| REQ-SEARCH-01 | *(no dedicated spec — see coverage gaps above)* |
| REQ-A11Y-01 | Pa11y CI |
| REQ-A11Y-02 | responsive.spec.ts, interactive-elements.spec.ts |
| REQ-PERF-01 | Lighthouse CI, responsive.spec.ts |
| REQ-VISUAL-01 | BackstopJS, responsive.spec.ts, content-edge-cases.spec.ts |
| REQ-LINKS-01 | homepage.spec.ts, content-edge-cases.spec.ts |
| REQ-SEC-01 | npm audit |

---

## Change-Based Test Selection Rules

The `scripts/select-tests.sh` script inspects `git diff --name-only HEAD~1` and
outputs a `TEST_GROUPS` environment variable consumed by the CI workflow.

| Changed Paths | Test Groups Triggered |
|---------------|-----------------------|
| `_sass/**`, `assets/css/**` | REQ-VISUAL-01, REQ-A11Y-01, REQ-NAV-01 |
| `_layouts/**`, `_includes/**` | ALL (layout changes are high-risk) |
| `_posts/**`, `_drafts/**` | REQ-CONTENT-01, REQ-CONTENT-02, REQ-LINKS-01 |
| `assets/js/**` | REQ-NAV-02, REQ-SEARCH-01, REQ-A11Y-02 |
| `.github/workflows/**` | No Playwright — CI-only change |
| `package.json`, `package-lock.json` | REQ-SEC-01 + full suite (dependency risk) |
| `_config*.yml` | ALL (config changes are high-risk) |

**Full suite triggers:**
- Changes to `_layouts/`, `_includes/`, `_config*.yml`, `package.json`
- Manual `workflow_dispatch` with `full_suite: true`
- Nightly scheduled run (cron)

---

## Sharding Strategy (Full-Suite Runs)

When a full run is triggered, Playwright is sharded across 3 parallel jobs:

| Shard | Grep Filter | Requirements Covered |
|-------|-------------|---------------------|
| Shard 1 | `@REQ-NAV-01\|@REQ-NAV-02` | Navigation + mobile viewport tests |
| Shard 2 | `@REQ-CONTENT-01\|@REQ-CONTENT-02\|@REQ-LINKS-01` | Content + links tests |
| Shard 3 | `@REQ-A11Y-02\|@REQ-VISUAL-01\|@REQ-PERF-01` | Accessibility + visual + performance |

Lighthouse CI runs as a separate parallel job alongside the three Playwright shards.

**Target wall-clock time:** ≤ 6 min for full suite (down from ~19 min).

---

## Quality Report

After every CI run a `quality-report.json` artefact is uploaded and a markdown
summary is posted to the GitHub Actions step summary. The report contains:

- ✅ Pass/fail per requirement ID
- 📊 Coverage table (which REQ IDs have ≥ 1 test, which are untested)
- ⏱️ Time spent per test group
- 🔁 Whether this was a full run or partial (which groups were skipped and why)

The report is generated by `scripts/generate-quality-report.js`.
