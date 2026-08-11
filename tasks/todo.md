# TODO — Retire the Healing Monitor and unpublish its stale dashboard

**Spec:** [../SPEC.md](../SPEC.md) · **Plan:** [plan.md](plan.md)
**Date:** 2026-08-10 · **Status:** awaiting owner sign-off before Phase 1

> Decisions D-A…D-D are settled (SPEC §6). Nothing below needs another round trip.

## Phase 0 — Groundwork

- [x] Fast-forward `main` (130 commits behind → current)
- [x] `bundle install` — recovers the missing `json (2.20.0)` gem
- [x] Confirm the handoff in `docs/BACKLOG.md` still holds
- [x] Write SPEC / plan / todo
- [x] **Owner sign-off on this plan**
- [x] File the retirement issue — [#1251](https://github.com/oviney/blog/issues/1251)

## Phase 1 — PR A: retire + unpublish

- [x] Branch `qa/retire-healing-monitor` off `main`
- [x] Delete `.github/workflows/healing-monitor.yml`
- [x] Replace `dashboard/index.html` with a `noindex` landing page → `agents.html`
- [x] Delete `dashboard/dashboard-data.json`
- [x] Rewrite `dashboard/README.md`
- [x] `README.md` — drop 3 healing badges (`:6`, `:9-10`)
- [x] `GETTING_STARTED.md:114`
- [x] `docs/CURRENT_STATE.md:43,58,81` — `:43` was a workflow-table row the plan missed
- [x] `ARCHITECTURE.md:21,65,69,74,78,80,82`
- [x] `docs/BACKLOG.md` — refresh "Where to pick up", add F1/F2 rows
- [x] Verify file count ≤ 15 — **13**

### Checkpoint A — verification gate (AC-1, AC-3, AC-4, AC-5, AC-11) ✅

- [x] `bundle exec jekyll build` succeeds
- [x] `npx playwright test sitemap-exclusions.spec.ts` passes **unmodified** — 4/4,
      including "dashboard pages that stay reachable are non-indexable", the test a
      naive delete would have turned red
- [x] `viewport-overflow.spec.ts` + `page-chrome-invariant.spec.ts` — 24/24 across
      Desktop + Mobile Chrome
- [x] Built `_site/dashboard/index.html` has `noindex` and zero healing metrics,
      `dashboard-data.json` and Chart.js references
- [x] `_site/dashboard/agents.html` unchanged vs `main`

- [ ] Open PR A with the **`protected-file-update`** label, `Closes #1238`
- [ ] Merge when green
- [ ] Post-deploy: `/dashboard/` → 200 + noindex; `/dashboard/agents.html` → 200
- [ ] Confirm no scheduled `healing-monitor` run fires after the merge

## Phase 2 — PR B: collapse the duplicate generator

- [ ] Branch `chore/stale-skill-issue-retune`
- [ ] Remove the per-file block at `scripts/idea-triage.sh:133`
- [ ] Leave `doc-audit.sh:567-621` rollup untouched
- [ ] Dry-run `idea-triage.sh` — confirm zero stale-skill issues proposed
- [ ] Open PR B, merge when green
- [ ] **Then** bulk-close the 24 `triage:` issues + #1250, referencing the retune
- [ ] Confirm **#1206 stays open**

## Phase 3 — Dependabot (D-C)

- [ ] Rebase #1242, #1243, #1244, #1245
- [ ] Confirm `🔒 Security Audit` goes green (js-yaml cleared by #1247)
- [ ] `--admin --squash` merge #1243, #1244, #1245
- [ ] Read #1242's 0.4.3→0.5.2 changelog; **summarize for the owner, do not merge**

## Phase 4 — GitHub state + follow-ups

- [ ] Close **#1240** — resolved by #1247; 08-10 nightly 7/7 green
- [ ] File **F1** — remove orphaned healing machinery (scripts, npm scripts, `healing-metrics/`, badges)
- [ ] File **F2** — scope guard blocks every bundler Dependabot PR (`check-pr-scope.sh:49-66`)
- [ ] Rebase or close **#1232** (dashboard refresh, `BEHIND`)

## Phase 5 — Local hygiene (no PR)

- [ ] Prune 9 local branches whose upstream is `gone`
- [ ] Triage 2 stashes: `scoring-verification-baseline`, `copilot-temp-before-pull`

## Deferred — not this session

- Cross-browser coverage decision (`docs/BACKLOG.md` P3) — same root cause as SPEC §2 D2
- `tasks/` published to production — owner-only, `_config.yml` is unbypassable
- `.featured-post` dead CSS; `.home-intro-links` margin collision
