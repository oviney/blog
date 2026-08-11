# TODO — Retire the Healing Monitor and unpublish its stale dashboard

**Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)
**Date:** 2026-08-10

> **COMPLETE 2026-08-10.** All five phases shipped. `main` at `a4adb33`.
> PRs: **#1254** (retire + unpublish), **#1255** (audit retune), plus #1243/#1244/#1245
> (Dependabot, `--admin`) and #1232 (dashboard data).
> Issues closed: #1238, #1240, #1251, and 25 duplicate `triage:` issues. #1206 kept open.
> Follow-ups filed: **#1252**, **#1253**. **#1242 still needs an owner call** — see below.
>
> Two things landed differently than planned — see Deviations at the foot.

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

- [x] Open PR A with the **`protected-file-update`** label — [#1254](https://github.com/oviney/blog/pull/1254)
- [x] Merge when green — all four required checks SUCCESS; 🖼️ Visual Regression passed
      **with no baseline reseed**, confirming the landing page moved no tracked pixels
- [x] Post-deploy verified: `/dashboard/` → **200 + noindex**, title `Observability`,
      zero healing metrics; `/dashboard/agents.html` → **200**;
      `/dashboard/dashboard-data.json` → **404**
- [x] `healing-monitor.yml` absent from `main` — GitHub cannot schedule a deleted workflow

## Phase 2 — PR B: collapse the duplicate generator ✅

- [x] Branch `chore/stale-skill-issue-retune`
- [x] Remove the per-file block at `scripts/idea-triage.sh:133`; renumber signals 1/2/3
- [x] Leave `doc-audit.sh` stale-skill rollup untouched
- [x] **Scope grew — see Deviation 1:** also excluded `tasks/` and `CHANGELOG.md` from
      doc-audit Check 4
- [x] PR B merged — [#1255](https://github.com/oviney/blog/pull/1255)
- [x] **Then** bulk-closed the 24 `triage:` issues + #1250 — **25/25**
- [x] **#1206 confirmed still open**; 0 stale-skill issues remain

## Phase 3 — Dependabot (D-C) ✅

- [x] Rebased all four
- [x] `🔒 Security Audit` went green on all three bundler PRs — confirmed the failure
      was the js-yaml advisory #1247 had already fixed
- [x] `check-agent-scope` still **FAILURE** on #1243/#1245, **SUCCESS** on #1244 —
      exactly the bundler-vs-npm split predicted by #1253
- [x] `--admin --squash` merged #1243, #1244, #1245
- [x] #1242 **not merged** — changelog read, builds clean locally with 0.5.2.
      **Owner call outstanding.**

## Phase 4 — GitHub state + follow-ups ✅

- [x] Closed **#1240** — resolved by #1247; 08-10 nightly 7/7 green
- [x] Filed **[#1252](https://github.com/oviney/blog/issues/1252)** (F1, orphaned machinery)
- [x] Filed **[#1253](https://github.com/oviney/blog/issues/1253)** (F2, scope guard)
- [x] #1238 and #1251 auto-closed by PR A
- [x] **#1232 merged** after rebase — the agents dashboard is now the only dashboard,
      so keeping its data current matters more than before

## Phase 5 — Local hygiene ✅

- [x] `bundle install` — recovered the missing `json` gem
- [x] Pruned **9** stale branches. `git branch -d` refused all nine because their PRs
      were **squash-merged**, so no commit is an ancestor of `main`. Verified each head
      ref against a **MERGED** PR (#949/#950/#955/#957/#960/#961/#964/#967/#934) before
      forcing. Also removed this session's two merged branches.
- [x] **Stashes triaged — both obsolete, neither dropped.** See Deviation 2.

## Deviations

**1 — PR B grew a second fix.** `doc-audit.sh` Check 4 asserts every
`workflows/<name>.yml` string in any `.md` resolves to a real file. Check 4 reports
nothing on `main` today, so deleting `healing-monitor.yml` would have produced its
**first-ever finding — four files, every one of them correct**, because a spec that
retires a workflow necessarily names the file it deleted. Excluded `tasks/` and
`CHANGELOG.md`, which record what happened rather than describe what exists.
Same failure mode as the stale-skill duplication, which is why it belonged in PR B.
This archival also moves `spec.md` under `tasks/`, closing the last hole.

**2 — Stashes triaged, not dropped.** Both turned out obsolete, and the evidence is
worth keeping:

- `scoring-verification-baseline` held two real fixes — a Markdown title-attribute
  bug in `content-review.js` link parsing, and `rstrip('.md')` in
  `validate-posts.sh`, which strips *characters* not a suffix
  (`test-method.md` → `test-metho`). **Both are already fixed on `main`;** neither
  buggy line survives.
- `copilot-temp-before-pull` patches `_posts/new-blog-post.md`, a file that no
  longer exists.

Left in place rather than dropped — deleting them was never authorised, and the
one-liner is the owner's to run: `git stash drop stash@{1} && git stash drop stash@{0}`.

## Deferred — not this session

- **#1242** (jekyll-remote-theme 0.4.3→0.5.2) — owner call. Note `remote_theme:` is
  **commented out** at `_config.yml:37`, so the plugin loads and does nothing; the
  better question is whether it should be a dependency at all. Both `Gemfile` and
  `_config.yml` are protected, so that is an owner-only change.
- Cross-browser coverage decision (`docs/BACKLOG.md` P3) — same root cause as spec §2 D2
- `tasks/` published to production — owner-only, `_config.yml` is unbypassable
- `.featured-post` dead CSS; `.home-intro-links` margin collision
