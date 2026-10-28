# Test cost and value

The PR feedback target is under three minutes for ordinary content and design
changes. This is a target to measure, not a guarantee from a test-count reduction.
Security auditing and the existing reader-facing assertions remain blocking.

## Execution policy

| Checks | When | Screen-size coverage |
| --- | --- | --- |
| Page contract, stale service-worker CSS | Every PR/push/nightly | Mobile and desktop |
| Visual snapshots | Every PR/push/nightly | Mobile, tablet and desktop |
| Security, content validation, test-selection integrity | Every PR/push/nightly | No viewport matrix |
| Pa11y and Lighthouse compatibility | Dependency/configuration PRs, nightly, manual full suite | Tool-specific configuration |
| Extended browser behavior | Test/runner PRs, nightly, manual full suite | Layout-dependent cases at three sizes; markup once; explicit viewport matrices once |

`npm run test:selection` lists the actual Playwright selections and checks that
every spec is represented, the extended suite contains every non-gate case, and
the dedicated jobs cover the excluded gates. New unclassified specs default to
the three viewport projects. `PLAYWRIGHT_ALL_BROWSERS=1` remains available for
explicit Firefox/WebKit testing after installing those browsers.

`npm test` runs every category. `npm run test:playwright` runs the extended portion
without repeating the dedicated contract and screenshot gates.

## Baseline and consolidation

[Run 40723778141](https://github.com/oviney/blog/actions/runs/40723778141) selected
645 executions: 634 passed and 11 skipped, with one worker. Playwright took
983 seconds, Pa11y 8 seconds, and Lighthouse 112 seconds.

The revised default selection has 424 executions, including the dedicated gates;
the extended selection has 337 executions and uses two workers. DOM/JavaScript
checks that do not depend on screen size run in Content Chrome. Specs that
explicitly choose their own viewports run in Responsive Chrome. The other layout
and journey specs retain mobile, tablet and desktop coverage.

Removed assertions are limited to the empty seed and repeated head-tag checks
already covered by the stronger SEO metadata spec (which now also covers the
security topic). Analytics assertions are consolidated into one visit per page
template, preserving async/defer, domain, measurement ID, initialization and
verification-meta checks. The homepage's explicit viewport cases move unchanged
to their own spec. Screenshot baselines, functional assertions and audit
thresholds are unchanged.

Measured runtime and validation evidence belong in the performance PR linked
from [issue #1373](https://github.com/oviney/blog/issues/1373).

## Retention review

Review this ledger monthly and whenever a failing test causes a repair. A green
run or a large assertion count is not evidence of reader value. Link a confirmed
defect or an explicit risk to each retained group; separate product failures from
test maintenance and environment failures before counting defects caught.

| Group | Confirmed reader defects caught (issue/PR) | False alarms / environment failures | Maintenance minutes | CI duration | Decision |
| --- | --- | --- | --- | --- | --- |
| Page contract / service worker | Record links | Record separately | Record effort | Workflow step time | Keep reader contracts |
| Visual regression | Record links | Record baseline/environment repairs | Record effort | Workflow step time | Review signal quality |
| Extended behavior | Record links by spec | Record separately | Record effort | Workflow step time | Consolidate overlap first |
| Accessibility / Lighthouse | Record links | Separate score variability/tool incompatibility | Record effort | Workflow step time | Keep actionable checks |

Mark unknown values as unknown. Retire a test only after identifying its retained
replacement or explicitly reviewing the reader risk it uniquely protects.
