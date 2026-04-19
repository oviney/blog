---
description: Prove it works — run the full test suite (Playwright, pa11y, Lighthouse, Jekyll build)
---

Invoke `test` first. This workflow is backed by the upstream-aligned
`test-driven-development` guide, then use `jekyll-qa` for repo-specific QA workflows.

Run the test suite in this order:
1. `bundle exec jekyll build` — must pass before anything else
2. Start dev server: `bundle exec jekyll serve --config _config_dev.yml`
3. `npx playwright test` — all projects (Mobile/Tablet/Desktop)
4. Check for visual regressions, accessibility failures, and performance issues

Report results as:
- ✅ Passed / ❌ Failed / ⚠️ Warning
- For failures: include the exact error, file, and line number
- For warnings: explain the impact and whether it blocks merge

If any test fails, stop and diagnose before continuing.
