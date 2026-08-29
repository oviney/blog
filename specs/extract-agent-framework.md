# SPEC — Extract the agent framework from `oviney/blog`

**Status:** ready to execute · **Decision:** [ADR-011](../decisions.md#adr-011-extract-the-agent-framework--the-classification-adr-008-asked-for)
**Measured:** 2026-08-29 against `main` @ `fb1b195`

This is the classification [ADR-008](../decisions.md#adr-008-publication-first-repository-boundary)
asked for in May 2026 and the migration that follows from it. It is executable
by someone who was not present when it was written.

## 1. The test

One question decides every file:

> **Does this exist to publish, validate, deploy or protect viney.ca?**

Yes → **keep**. No → **extract**. "Only because something else here needs it" →
**decide later**, and it moves when its consumer moves.

## 2. Classification

### 2.1 Workflows — keep (987 lines)

| File | Lines | Why it stays |
|---|---:|---|
| `test-quality.yml` | 429 | Visual regression, a11y, Lighthouse, security on public pages |
| `research-sweep.yml` | 158 | Feeds the editorial pipeline |
| `test-build.yml` | 133 | Build validation on every PR |
| `jekyll.yml` | 51 | **The deploy.** Nothing is more in scope than this |
| `content-review.yml` | 48 | Post quality |
| `content-remediation.yml` | 46 | Post quality |
| `idea-triage.yml` | 44 | Editorial pipeline |
| `production-smoke-tests.yml` | 32 | Post-deploy verification of the live site |
| `editorial-issue-router.yml` | 25 | Editorial pipeline |
| `content-validation.yml` | 21 | Front-matter and editorial gates |

### 2.2 Workflows — extract (2,461 lines, 72%)

| File | Lines | Why it goes |
|---|---:|---|
| `orchestrator.yml` | 641 | PR lifecycle automation. About agents, not about the blog |
| `agent-eval.yml` | 388 | Scores agent PRs against a rubric |
| `ci-health-monitor.yml` | 340 | Watches CI. 126 of the last 300 runs |
| `defect-tracker.yml` | 322 | Agent defect log |
| `auto-regression.yml` | 246 | Generates regression tests from issues |
| `agent-activity-report.yml` | 244 | Weekly agent activity issue |
| `agent-rework-tracking.yml` | 154 | Monthly agent rework metric |
| `agent-dashboard.yml` | 56 | Refreshes the observability dashboard |
| `doc-audit.yml` | 44 | Audits skill files for accuracy |
| `workflow-roi.yml` | 26 | Measures the ROI of workflows |

### 2.3 Scripts — extract (2,976 lines, 49%)

`doc-audit.sh` (702) · `agent-dashboard-data.js` (333) ·
`generate-quality-report.js` (309) · `eval-agent-pr.sh` (284) ·
`fix-agent-merge-blockers.sh` (224) · `analyse-changes.sh` (206) ·
`require-up-to-date-branches.sh` (171) · `workflow-roi.sh` (165) ·
`handoff.sh` (110) · `generate-regression-test.js` (106) ·
`update-defect-log.js` (70) · `check-agent-memory-discipline.sh` (68) ·
`regression-coverage-report.js` (63) · `agent-status.sh` (62) ·
`status.sh` (55) · `generate-pr-body.js` (48)

Scripts that **stay** are the ones a publication needs:
`validate-post-quality.sh` (415), `validate-posts.sh` (251),
`content-review.js` (718), `content-remediation.js` (545),
`idea-triage.sh` (217), `content-inventory.sh` (124),
`check-npm-audit.js` (123), `production-smoke-tests.sh` (107),
`generate-image-dimensions.sh` (79), `check-supported-puppeteer.js` (64),
`select-tests.sh` (225).

### 2.4 Skills — extract 21 of 30 (3,505 lines, 48%)

**Extract** — generic lifecycle skills that mirror upstream `addyosmani/agent-skills`
and say nothing about this blog:

`test-driven-development` (384) · `code-review-and-quality` (353) ·
`git-workflow-and-versioning` (317) · `incremental-implementation` (246) ·
`spec-driven-development` (219) · `planning` (181) · `context-engineering` (160) ·
`source-driven-development` (146) · `debugging-and-error-recovery` (142) ·
`security-and-hardening` (141) · `using-agent-skills` (126) ·
`performance-optimization` (124) · `shipping-and-launch` (118) ·
`documentation-and-adrs` (116) · `ci-cd-and-automation` (114) ·
`deprecation-and-migration` (113) · `code-simplification` (103) ·
`browser-testing-with-devtools` (101) · `api-and-interface-design` (100) ·
`idea-refine` (102) · `frontend-ui-engineering` (99)

**Keep** — repo-specific knowledge that would be meaningless elsewhere:

`jekyll-qa` (1,261) · `github-issues-workflow` (866) · `economist-theme` (389) ·
`git-operations` (353) · `jekyll-development` (328) · `editorial` (222) ·
`code-review` (194) · `general` (148) · `audience-research` (115)

### 2.5 Decide later (34 lines + 269)

| File | Why it is not yet decided |
|---|---|
| `copilot-setup-steps.yml` (34) | GitHub requires it wherever Copilot cloud agents run. Moves only if cloud-agent work moves |
| `scripts/check-pr-scope.sh` (269) | The **engine** is generic and reusable; the **rules** name this repo's protected files (`_config.yml`, `Gemfile`, `CODEOWNERS`, …). Splitting engine from policy is real work and is not required by this migration. Stays until someone wants the engine elsewhere |

## 3. Destination

`oviney/economist-agents` already exists, is public, already produces this blog's
drafts, and already carries a Python agent SDK with 2,686 tests. It is the
natural home; a third repository would add a boundary nobody needs.

**Before assuming that:** confirm the extracted workflows do not conflict with
that repo's own CI, and that its maintainers (the same person) want the
observability surface there. If not, `oviney/agent-ops` is the fallback.

## 4. What replaces each extracted piece here

| Removed | Replacement in `oviney/blog` |
|---|---|
| `orchestrator.yml` | Nothing, initially. It never merged a PR (see #1310); its escalation labelling is the only behaviour actually observed working, and that can return as a reusable workflow if missed |
| `ci-health-monitor.yml` | A reusable workflow called from the extracted repo, or nothing — GitHub already emails on scheduled-workflow failure |
| `agent-*` reporters, `workflow-roi` | Nothing. If a metric is not read, it is not a metric |
| `doc-audit.yml` + `doc-audit.sh` | Moves with the skills it audits |
| 21 generic skills | `.claude/` already loads the upstream `agent-skills` plugin; the vendored copies are a second source of truth for the same content |

## 5. Sequence

Each step is independently revertible. Do not batch them.

1. **Confirm the destination** (§3). Owner decision. Blocks everything.
2. **Move the 21 generic skills.** Lowest risk — they are documentation, and
   `.agents/` already tracks upstream. Verify: `doc-audit.sh` still runs; no
   remaining file references a moved path (#1294 exists because that check has
   failed before).
3. **Move the reporters** — `agent-activity-report`, `agent-rework-tracking`,
   `workflow-roi`, `agent-dashboard`, `defect-tracker`, and their scripts.
   Verify: no open issue is orphaned; `dashboard/` either moves whole or stays
   whole, never half (`sitemap-exclusions.spec.ts` asserts the route).
4. **Move the eval + regression machinery** — `agent-eval.yml`,
   `auto-regression.yml`, `eval-agent-pr.sh`, `generate-regression-test.js`,
   `regression-coverage-report.js`, `.agent-evals/`.
5. **Move `ci-health-monitor.yml` and `orchestrator.yml` last.** They act on this
   repo's PRs, so they need a cross-repo token and are the only steps that can
   affect the merge queue. Do not move them until #1310's fix has run under
   `ORCHESTRATOR_AUTO_MERGE` long enough to know what it does.
6. **Update the instruction layer** — `AGENTS.md`, `CLAUDE.md`,
   `.github/copilot-instructions.md`. `AGENTS.md` is protected but bypassable
   with `protected-file-update`; `.github/copilot-instructions.md` is protected
   and **not** bypassable by any label, so it needs a deliberate owner edit;
   `CLAUDE.md` is unprotected. Comes last, when the moves it describes are
   already true.

## 6. Acceptance criteria

- `bundle exec jekyll build` passes at every step
- The site deploys at every step
- No file in `oviney/blog` references a moved path — checked with
  `grep -rn` per step, not assumed
- Every extracted artefact is **used or deleted** in its new home within one
  cycle. Moving something is not a way of keeping it (ADR-011)
- `ROADMAP.md`, `CLAUDE.md` and `docs/CURRENT_STATE.md` describe the boundary
  that actually exists afterwards

## 7. Explicit non-goals

- Rewriting git history in either repository
- Changing what a reader sees on viney.ca
- Re-litigating ADR-008. That decision stands; this is its execution
- Judging the extracted work as bad. Much of it is careful. It is simply not
  about publishing a blog, and keeping it here has demonstrably starved the
  thing that is
