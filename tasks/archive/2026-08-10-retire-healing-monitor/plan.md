# Plan — Retire the Healing Monitor and unpublish its stale dashboard

**Spec:** [../SPEC.md](../SPEC.md)
**Issues:** closes [#1238](https://github.com/oviney/blog/issues/1238), [#1240](https://github.com/oviney/blog/issues/1240); retunes the #1206 issue family
**Date:** 2026-08-10 · **Label:** `agent:qa-gatekeeper`

## Shape of the work

Four independent tracks. **Track 1 is the only one that writes site code**; the
rest are repo hygiene and GitHub state. Tracks 2–4 do not depend on Track 1 and
can land in any order.

| Track | Deliverable | Vehicle | Blocks anything? |
|-------|-------------|---------|------------------|
| 1 | Retire workflow + unpublish healing dashboard | PR A | no |
| 2 | Collapse the duplicate stale-skill generator | PR B | no |
| 3 | Dependabot: rebase, merge 3 patches, summarize the minor | `--admin` merges, no PR authored | no |
| 4 | Close #1240; file F1/F2 follow-ups | GitHub only | no |

## PR A — retire + unpublish

**Branch:** `qa/retire-healing-monitor`
**Label:** `protected-file-update` — required, because `ARCHITECTURE.md` is in
`PROTECTED_FILES` (`check-pr-scope.sh:49-57`) and *is* in the per-file bypass
list (`:63-66`). Per `CLAUDE.md` this must be **issue-driven**, so file the
retirement issue *before* opening the PR.

### Design decision — `/dashboard/` stays reachable

`sitemap-exclusions.spec.ts:74-83` requires `/dashboard/` to return 200 **and**
declare `noindex`. Deleting `index.html` would 404 the route and turn that test
red, so the choice is:

- ❌ delete `index.html` and edit the test — weakens a real regression guard to
  suit an unrelated change
- ✅ **replace** `index.html` with a minimal `noindex` landing page that links to
  `agents.html` — satisfies AC-3 and AC-4 with **no test edit**

Taking the second. The healing *content* and its fabricated data go; the route
survives as an honest entry point.

### File manifest (11 files — inside the 15-file Rule 2 cap)

| # | File | Action |
|---|------|--------|
| 1 | `.github/workflows/healing-monitor.yml` | **delete** |
| 2 | `dashboard/index.html` | **replace** with noindex landing page → `agents.html` |
| 3 | `dashboard/dashboard-data.json` | **delete** (frozen 2026-04-04, partly synthesized) |
| 4 | `dashboard/README.md` | rewrite — currently documents only the healing dashboard |
| 5 | `README.md` | drop the Healing Monitor badge + 2 shields endpoint badges (`:6`, `:9-10`) |
| 6 | `GETTING_STARTED.md` | `:114` "Healing dashboard" reference |
| 7 | `docs/CURRENT_STATE.md` | `:58`, `:81` |
| 8 | `ARCHITECTURE.md` | `:21`, `:65`, `:69`, `:74`, `:78`, `:80`, `:82` — needs the label |
| 9 | `docs/BACKLOG.md` | refresh "Where to pick up"; add the F1/F2 rows |
| 10 | `SPEC.md` | this effort's spec (already written) |
| 11 | `tasks/plan.md` + `tasks/todo.md` | lifecycle artifacts |

**Deliberately NOT in PR A** (→ F1): `scripts/healing-*.js`,
`scripts/dashboard-server.js`, `package.json:27-35`, `healing-metrics/`,
`healing-reports/`, `.github/badges/`. Leaving them inert for one PR is a
strictly better intermediate `main` than a 25-file PR that trips Rule 2.

### Verification

- `bundle exec jekyll build`
- `npx playwright test sitemap-exclusions.spec.ts` — **unmodified, must pass**
- `npx playwright test viewport-overflow.spec.ts` — covers `/dashboard/agents.html` (AC-5)
- confirm no scheduled `healing-monitor` run appears post-merge
- post-deploy: `curl` `/dashboard/` (200 + noindex) and `/dashboard/agents.html` (200)

## PR B — collapse the duplicate stale-skill generator

**Branch:** `chore/stale-skill-issue-retune`

Remove the per-file stale-skill block around `scripts/idea-triage.sh:133`,
leaving the `doc-audit.sh:567-621` rollup untouched. Then bulk-close the 24
`triage:` issues + #1250 with a comment pointing at the retune. **#1206 stays
open** — it is the surviving rollup and the #1175 precedent says staleness can
signal real drift.

Sequence matters: **land the script change first**, then close the issues.
Closing first just invites the next scheduled run to refile all 25.

## Track 3 — Dependabot

All four are `BEHIND` main; their `🔒 Security Audit` failure is the js-yaml
advisory **#1247 already fixed**. Rebase clears it. `check-agent-scope` will
still fail on the three bundler PRs (F2) — that is the structural block, and
per **D-C** the answer today is `--admin`, not a guard change.

1. Rebase all four
2. Re-check; expect Security Audit green, `check-agent-scope` red on the bundler three
3. `--admin --squash` merge #1243, #1244, #1245
4. **Do not merge #1242** — read its 0.4.3→0.5.2 changelog and summarize for the owner

## Risks

| Risk | Mitigation |
|------|------------|
| `/dashboard/` 404s → `sitemap-exclusions` red | Landing page keeps it 200 + noindex; run the spec before pushing |
| ARCHITECTURE.md trips Rule 1 | `protected-file-update` label + file the issue first |
| Deleting `dashboard-data.json` breaks a consumer | Only `dashboard/index.html` and `scripts/dashboard-server.js` read it; the former is replaced, the latter is F1 and local-only |
| PR A exceeds 15 files | Manifest is 11; F1 split holds it down |
| Closing 25 issues, then they refile | Land PR B first, then close |
