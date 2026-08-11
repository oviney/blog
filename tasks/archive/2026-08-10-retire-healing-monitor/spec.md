# SPEC — Retire the Healing Monitor, and stop publishing the metric it stopped producing

**Stream:** session resume 2026-08-10 · **Priority:** P1 (active resource burn) · **Scope:** M
**Date:** 2026-08-10 · **Label:** `agent:qa-gatekeeper` · **Issues:** [#1238](https://github.com/oviney/blog/issues/1238), [#1240](https://github.com/oviney/blog/issues/1240), [#1206](https://github.com/oviney/blog/issues/1206) + 25 `triage:` issues
**Status:** specified — awaiting owner sign-off on the plan

---

## 1. Objective

Resuming after a machine switch, `main` fast-forwarded 130 commits and the
handoff in `docs/BACKLOG.md` ("Where to pick up", 2026-08-09) proved accurate:
nothing was in flight. What the handoff could not see is that **one scheduled
workflow has been failing continuously for a week and silently publishing a
frozen metric to production for four months**.

This spec retires that workflow, unpublishes what it fed, and collapses a
duplicated issue generator. Four owner decisions were taken before writing it
(§6) — none of the work below is open-ended.

---

## 2. The Healing Monitor is dead and has been for some time

`.github/workflows/healing-monitor.yml` runs every 4 hours across a 3-browser
matrix. Measured on `main`:

| Evidence | Value |
|----------|-------|
| Last 40 runs (since 2026-08-04) | **38 `cancelled`, 2 `failure`, 0 success** |
| `dashboard/dashboard-data.json` last successful commit | **2026-04-04** |
| Cost | ~18 jobs/day, ~126 jobs/week |
| Alerting | already disabled — `if: false` at `:418` |

Three independent defects, each sufficient on its own:

**D1 — the chromium leg always times out.** It runs the full suite across three
projects (`:47`) under `timeout-minutes: 15` (`:40`). It is cancelled at the
limit every run. Because `monitor-healing` declares `needs: playwright-tests`
(`:205`), the cancel means **the metric is never computed and the dashboard is
never written**. The workflow's entire output is dead.

**D2 — two of three matrix legs run zero tests.** The firefox and webkit legs
pass `--project "Desktop Firefox"` / `"Desktop Safari"` (`:48-51`), but those
projects only exist when `PLAYWRIGHT_ALL_BROWSERS=1` (`playwright.config.ts:109`),
which this workflow never sets. They select nothing and pass in ~1 minute —
after paying full freight for checkout, Ruby, `npm ci`, `playwright install
--with-deps` and a Jekyll build. This is the **same** defect as the open
`docs/BACKLOG.md` P3 "decide the fate of cross-browser coverage"; that row
recorded it in the PR gate and did not know it also bites here.

**D3 — the metric is partly fabricated.** `:626` hardcodes `totalTests: 135`
and derives `passingTests` as `round(135 × successRate/100)` (`:585`). The
count is not measured.

**Why this went unnoticed:** the alert step is disabled, the tests are wrapped
in `|| true` (`:161`) so failures never surface, and the only signal left is
`#1238` — one CI-health issue that reads as a single flaky workflow rather than
a week of total failure.

---

## 3. The dead metric is on the public site

`_config.yml:130-131` carries `include: - dashboard/`. Verified live:

| URL | Status | Content |
|-----|--------|---------|
| `viney.ca/dashboard/` | **200** | healing metrics, frozen at **2026-04-04** |
| `viney.ca/dashboard/agents.html` | 200 | agent observability — genuinely live (PR #1232 refreshes it) |

The live payload reads `"healingSuccessRate": 85.71, "totalTests": 135`. A
public page on a blog whose own editorial line critiques self-healing test
claims (`_posts/2026-01-02-self-healing-tests-myth-vs-reality.md`) should not be
serving a four-month-stale, partly-synthesized healing success rate.

**Constraint discovered in test:** `tests/playwright-agents/sitemap-exclusions.spec.ts:74-83`
asserts `/dashboard/` is **reachable (200) and `noindex`**. So `/dashboard/`
cannot simply 404 — deleting `index.html` outright turns that test red. The
design below keeps the route alive and honest instead, which needs **no test
edit**.

---

## 4. The 25 stale-skill-file issues are one fact filed by two scripts

Not one noisy generator — two, emitting the same finding at different
granularity:

| Source | Emits | Issues |
|--------|-------|--------|
| `scripts/idea-triage.sh:133` | one issue **per skill file** | the 24 `triage: stale skill file — *` + new #1250 |
| `scripts/doc-audit.sh:567-621` | **one rollup** issue | #1206 |

Both use a 90-day cutoff (`doc-audit.sh:574`). The per-file generator is pure
duplication of the rollup and is the entire source of the issue-list noise.
Precedent from #1175 says staleness sometimes signals *real* drift, so the
rollup stays — it is the per-file fan-out that goes.

---

## 5. `#1240` is already resolved

It fired because `🔒 Security Audit` was red on the js-yaml advisory.
[#1247](https://github.com/oviney/blog/pull/1247) cleared it on 2026-08-09. The
2026-08-10 scheduled nightly is **7/7 green**, Security Audit included. Close as
resolved; do not re-diagnose.

---

## 6. Decisions taken (owner, 2026-08-10)

| # | Decision | Rationale |
|---|----------|-----------|
| **D-A** | **Retire** the Healing Monitor rather than repair it | Alerting already disabled, metric uncomputed for a week, dashboard unwritten for four months, and nobody noticed — the strongest available evidence it is not load-bearing. Matches the repo's "match complexity to scale" principle. |
| **D-B** | **Unpublish** the healing dashboard; point `/dashboard/` at the agents view | Stale, partly-fabricated metrics on a public QA-credibility blog are worse than no page. |
| **D-C** | Merge the 3 Dependabot patch bumps **with `--admin`**; fix the scope guard as a **follow-up** | Keeps an unblock and a governance change from riding in one PR. |
| **D-D** | **Retune** the staleness audit — drop the per-file generator, keep the rollup | Treats the noise source, not the noise. |

---

## 7. Out of scope — filed as follow-ups, not built here

**F1 — the orphaned healing machinery.** Retiring the workflow strands
`scripts/healing-monitor.js`, `analyze-healing-trends.js`,
`check-healing-degradation.js`, `dashboard-server.js`, five `package.json`
scripts (`:27-35`), `healing-metrics/`, `healing-reports/`, `.github/badges/`,
and `ARCHITECTURE.md:21,65,69,74,78,80,82`. Bundling it here would blow the
15-file Rule 2 cap. Separate PR.

**F2 — the scope guard blocks every bundler Dependabot PR.**
`scripts/check-pr-scope.sh` has **zero** Dependabot handling, and
`Gemfile`/`Gemfile.lock` are in `PROTECTED_FILES` (`:49-57`), deliberately
excluded from the `protected-file-update` bypass (`:59-66`: "infra files always
trip Rule 1 — even with the label"). So #1242/#1243/#1245 fail
`check-agent-scope` structurally and **can never go green**; #1244 (npm) passes
because `package-lock.json` is not protected. Every future bundler bump needs
`--admin`. Needs a deliberate governance decision, not a drive-by.

---

## 8. Acceptance criteria

- **AC-1** `healing-monitor.yml` is gone; no scheduled run appears after the merge commit.
- **AC-2** `#1238` and `#1240` are closed with reasons recorded.
- **AC-3** `viney.ca/dashboard/` returns **200** and `noindex`, and serves **no** healing metrics or `dashboard-data.json`.
- **AC-4** `sitemap-exclusions.spec.ts` passes **unmodified**.
- **AC-5** `viney.ca/dashboard/agents.html` is unchanged and still refreshed by `agent-dashboard.yml`.
- **AC-6** `README.md` carries no badge pointing at a deleted workflow.
- **AC-7** `idea-triage.sh` no longer files per-file stale-skill issues; `doc-audit.sh` rollup behaviour is unchanged.
- **AC-8** The 25 per-file issues are closed referencing the retune; **#1206 stays open**.
- **AC-9** Dependabot #1243/#1244/#1245 merged; #1242 summarized for an owner call.
- **AC-10** F1 and F2 exist as tracked issues.
- **AC-11** `bundle exec jekyll build` succeeds and the PR gate is green.
