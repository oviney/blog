# Backlog — viney.ca blog

The **local work queue for in-session / interactive Claude Code work**. This file
is the source of truth for a "pull the highest-priority task" session — read it
first, take the top **Active** row, run it through `spec → plan → build → ship`.

> There is no `/goal` skill in this repo. Earlier wording here implied one; the
> loop is the convention described under **How to use**, driven by the callable
> lifecycle skills in `.claude/commands/` (`/spec`, `/plan`, `/build`, `/test`,
> `/review`, `/ship`).

## Why a local file (not GitHub Issues)

Querying GitHub Issues every session is token-expensive: of ~22 open issues, ~86%
are auto-generated reports (Content Review, Agent Activity, ROI, Rework, Metrics).
Pulling a task means `gh issue list` (all of them) + `gh issue view` per candidate,
every session. This file is **one `Read`, zero noise, one round-trip.**

**GitHub Issues remain the system of record for Copilot _cloud_ agents** (async,
label-routed work). This backlog is for *local* execution. When you hand a backlog
item to a cloud agent, mirror it to an Issue and link the number here — don't
duplicate the queue.

## How to use

- Tasks are listed **highest-priority first** within each section.
- Pull the top unchecked **Active** task; run it through `spec → plan → build → ship`.
- Stop at human-review / verification gates (PR open, decision needed).
- When merged, move the item to **Recently shipped** with its PR number.
- Do **not** add auto-generated GitHub noise here. This file is curated by hand.
- Keep it short. If it grows tooling, that's a smell — match complexity to scale.

---

## Active (priority order)

> **Epic — Agent evals & governance gap-closure** — **CLOSED 2026-06-13 at P1–P3.**
> The governance stack was ~80% built; the epic closed the real enforcement gaps:
> P1 was already fixed in #989 (verified; reduced to a comment cleanup, #1045),
> P2 shipped in #1049, P3 in #1050. Optional polish **P4** (risk-tier branch-protection
> policy) and **P5** (memory-guard rephrasing-hardening) were **cut** as low-value —
> match complexity to scale. The lone survivor (Rule 4 anchor) shipped in #1064.

> **Epic — Visual-quality gate hardening** — **CLOSED 2026-08-01. All five gaps shipped.**
> Driven by [`docs/agents/visual-quality-review.goal.md`](agents/visual-quality-review.goal.md)
> and the 20-defect Phase-0 catalog in [`docs/agents/visual-audit-findings.md`](agents/visual-audit-findings.md).
> This epic was never tracked here — it ran entirely through GitHub Issues/PRs
> while this file read "Active queue drained." Gap B, the last one open, merged
> in #1138. What the epic left behind was baseline *stability*, not coverage:
> #1186 decoupled the category pages from publication and #1191 the homepage.
> **No page's baseline now moves when an article ships.**

| Pri | Task | Scope / label | Status | Ref |
|----|------|---------------|--------|-----|
| P1 | **Restructure the PR test gate around signal, not volume.** Spec at [`SPEC.md`](../SPEC.md). The gate costs 13.3 billable job-min and ~5 min wall-clock per PR, rebuilds Jekyll 4× per run, and in seven months caught **one** real product regression while 52% of commits touching `tests/` were repair work. Four streams: **A** finish `redesign/home-2026` ✅ **shipped in #1193**; **B** delete `responsive.spec.ts` + `content-edge-cases.spec.ts` (36% of the suite by volume, built on `expect(count).toBeGreaterThanOrEqual(0)`-shaped assertions that cannot fail) and the 8 conditional `test.skip()`s in `navigation.spec.ts`; **C** fix the generator — `.github/instructions/tests.instructions.md` §"Defensive Patterns" actively instructs agents to swallow failures; **D** one `page-contract.spec.ts` + visual, replacing 3 shards, full suite to nightly. **Read Stream A's outcome note before starting D** — §2 called the branch "5:0 rot" but it was 1 rot + 3 real defects, so "red gate ⇒ stale tests" is not a safe premise. **B's remaining half is `content-edge-cases.spec.ts` only** — now the sole carrier of the `nuclear healing` / `ultra-permissive` pattern (12 `catch` blocks); every other marker in §2 is gone. Decide prune-vs-delete for it explicitly: D2 argued deletion, but #1194 *repaired* `responsive.spec.ts` and met both measurable criteria, so the repair path is viable. | `agent:qa-gatekeeper`; **C** also `governance-update` | A ✅ #1193 · B ⚠️ partial #1194 · C ✅ #1195 · **D not started** | [`SPEC.md`](../SPEC.md) |
| P3 | De-duplicate Jekyll builds in CI. A PR builds the site ~4 times across `test-build`, `content-validation` and `test-quality` jobs. Build once, upload `_site` as an artifact, download in dependents. **Partly absorbed by P1 Stream D**, which fixes `test-quality.yml` only — `test-build.yml` and `content-validation.yml` remain. | `agent:qa-gatekeeper` | Not started | — |
| P3 | **Remove the legacy homepage CSS the 2026 redesign orphaned.** #1193 replaced `.homepage` with `.home-2026` but left the old rules in place ("untouched and inert"). 35 dead rule openers in `_sass/economist-theme.scss` across two bands — `.hero-post*` / `.home-recent*` at ~`:1715-1845` (including the responsive overrides at `:1824-1840`) and `.homepage` / `.home-focus*` / `.home-bio*` / `.home-intro*` at ~`:2291-2510`. Verified unreferenced by any template, spec or include. **One exception — keep `.home-intro-links`**: still used by `blog/index.html:13`. Needs its own PR: deleting live CSS wants the visual gate green across all 10 baselines, not just the homepage. | `agent:creative-director` | Not started | — |
| P3 | Decide the fate of cross-browser coverage. Firefox and WebKit projects are now opt-in behind `PLAYWRIGHT_ALL_BROWSERS=1` because CI only ever installed chromium — 376 tests had never once run. Either install those browsers on the nightly schedule and enable the flag, or delete the projects. | `agent:qa-gatekeeper` | Not started | — |
| ~~P3~~ | ~~Hero type scale is hardcoded, not tokenised (`.hero-post-title` at `_sass/economist-theme.scss:1752`, `:1825`, `:1829`).~~ **Retired 2026-08-02 — the target is now dead code.** #1193 deleted `.hero-post` from `index.md`, so all three rules are unreachable. Tokenising them would be work on CSS that should simply be deleted; folded into the legacy-homepage-CSS removal row above. The underlying "variables-only" concern is live but belongs to a real theme pass. | `agent:creative-director` | Retired — superseded by the row above | — |
| P3 | ADR: adopt / defer / hybrid on `.github/agents/*.agent.md` native custom agents vs `agent:*` label routing. Decision only — avoid two competing routing systems. | `governance-update` | Not started | [#1110](https://github.com/oviney/blog/issues/1110) |
| — | Real newsletter signup (BLOG-005). **Blocked:** `ROADMAP.md:71` lists email subscription as Out of Scope; owner must move it in-scope first. | `enhancement` | Blocked on owner decision | [#1063](https://github.com/oviney/blog/issues/1063) |
| — | Publish decision on `_review/review-queue-throughput-tax-42d2fbb4.md`. Assets present; carries the same B-017 slop tells cleared from the flaky-tests post in #1168 (2 spaced em-dashes, one "not merely", 4 doubled blank lines after headings). | `agent:editorial-chief` | Awaiting editorial review | — |

---

## In review (awaiting human gate)

*(empty — the four PRs listed here have all merged; see **Recently shipped**.)*

---

## Recently shipped

| Task | Resolution | Date |
|------|------------|------|
| PR-gate P1 **Stream C** — fix the generator that produces unfailable tests | [#1195](https://github.com/oviney/blog/pull/1195) merged — `.github/instructions/tests.instructions.md` §"Defensive Patterns" had been instructing every agent touching `tests/**` to wrap interactions in `try/catch` and `console.log` skipped steps "rather than throwing". That file is *why* the Stream B defects kept being regenerated; fixing the tests without fixing it rebuilds them. | 2026-08-02 |
| PR-gate P1 **Stream B** (partial) — delete assertions that cannot fail | [#1194](https://github.com/oviney/blog/pull/1194) merged — 9 tests cut from `responsive.spec.ts` (671→148 lines changed), including `expect(validSpacingCount).toBeGreaterThanOrEqual(0)` (a count is never negative) and typography bounds like "font size between 8px and 50px". All 8 conditional `test.skip()`s gone from `navigation.spec.ts`. Suite-wide `toBeGreaterThanOrEqual(0)` count is now **0**. `docs/TEST_TRACEABILITY.md` corrected — it had claimed REQ-CONTENT-01/02, REQ-NAV-02 and REQ-PERF-01 coverage that the deleted tests never actually provided. **Not complete:** `content-edge-cases.spec.ts` untouched, and `responsive.spec.ts` was repaired rather than deleted (a deviation from D2 that worked). | 2026-08-02 |
| **2026 homepage redesign** — editorial front page (lead story + topic index) | [#1193](https://github.com/oviney/blog/pull/1193) merged, deployed, production smoke green. `.homepage` → `.home-2026`: positioning band, credibility strip, lead story + "More from the blog" rail, topic index, author block. Also **P1 Stream A** of [`SPEC.md`](../SPEC.md). Shipped with three defects the branch was red for beyond the expected stale-test churn: (1) the theme's **unscoped** `article > p:first-of-type::first-letter` drop-cap (`economist-theme.scss:1416`) matched the new `<article>` wrappers, rendering a 10.4px kicker's first letter at **48px** at ≤768px — caught by rendering the page, not by any spec; (2) `$h26-faint` at **3.71:1** failed pa11y WCAG2AA on 14 elements; (3) the `visual-snapshot.spec.ts` homepage config still named `.hero-post`/`.topic-grid`, both deleted, so the mask matched nothing and the baseline silently re-coupled to publication, undoing #1186/#1191 — now `volatile: ['.h26-news']` with `listing` dropped, which buys a stable **full-page** capture (more coverage than the viewport crop it replaced, and all three baselines now move together). The two `"Source:"` teaser guards had gone *unguarded* rather than red, failing on their own "expected at least one teaser card" precondition. Homepage `<h1>` is now the positioning headline, not the newest post's title — it no longer changes on every publish. | 2026-08-02 |
| Decouple the **homepage** visual baseline from post publication | **⚠️ Config superseded by #1193 — see the row above; the homepage now uses `volatile: ['.h26-news']` with no `listing`. The reasoning below still holds; only the selectors changed.** [#1191](https://github.com/oviney/blog/pull/1191) merged — the last page still coupled to publishing, and the one that moved on every publish. `POST_CROSS_LINKS` generalised into a per-page `volatile` selector list; the homepage names `.hero-post`, `display: none`-ed before capture. Not masked: a mask paints after layout, so a taller or shorter hero still shifts the grid and fails on a size mismatch first. **Two** baselines re-seeded, not the three predicted — Tablet and Desktop. Mobile is byte-identical because at 320×568 the hero sits below the fold, which also explains why the original probe breached the threshold on Tablet alone. Proven with a throwaway post routed through Security so it moved the topic-card counter 3 → 4: 🖼️ Visual Regression green. Coverage traded: the hero's pixels (type scale, spacing, image aspect, colour); `homepage.spec.ts:21-38` and `:174-180` still assert its structure. Residual: the topic-card post counters are now above the fold and move on publish — ~0.0002 of the frame against a 0.02 threshold, measured holding. | 2026-08-01 |
| Decouple the category visual baselines from post publication | [#1186](https://github.com/oviney/blog/pull/1186) merged — the three category pages carry `listing: true`, the flag home and `/blog/` already had, so the capture is viewport-pinned with `.topic-grid` masked. Masking alone would not have done it: a mask paints after layout, so a taller grid still fails on a size mismatch first. Nine baselines re-seeded in CI, nothing else moved. Proven with a throwaway post published into Security (3 → 4 cards): all nine category snapshots held. `/search/` stays full-page — no `.topic-grid`, results render client-side. | 2026-08-01 |
| Orchestrator auto-closed PRs that merely mentioned the same issue | [#1183](https://github.com/oviney/blog/pull/1183) merged — issue refs now come from GitHub's closing keywords (`/\b(?:close[sd]?\|fix(?:e[sd])?\|resolve[sd]?)\b[\s:]+#(\d+)\b/gi`) instead of any bare `#NNN`. Fixes all three consumers of `issueRefMap`, not just duplicate detection: the stall handler re-opens a closed PR's "source" issues and the dispatch guard treats an issue as already-worked, and both mean "the issue this PR exists to close". Two-sided proof on throwaway PRs 1184/1185 — prose mentions produced no duplicate close, `Closes #1110` on the same pair did. It is again safe to write issue numbers normally in PR bodies. | 2026-08-01 |
| Security advisory + Playwright bump + Gap B + dashboard refresh (the four PRs parked in **In review**) | [#1170](https://github.com/oviney/blog/pull/1170), [#1162](https://github.com/oviney/blog/pull/1162), [#1167](https://github.com/oviney/blog/pull/1167) and [#1138](https://github.com/oviney/blog/pull/1138) all merged in the planned order. Gap B closed the visual epic. | 2026-08-01 |
| Refresh the two >90-day-stale skill files | [#1175](https://github.com/oviney/blog/pull/1175) merged — both carried real drift, not just an expired clock: code-review listed 3 of 5 protected files, economist-theme's visual-testing section predated the blocking pixel gate. Issues #1140/#1142/#1166 closed. | 2026-07-31 |
| CI: make the visual and Playwright gates actually block | Branch protection `required_status_checks` now lists `build`, `🔒 Security Audit`, `🖼️ Visual Regression` and the three `🎭 Playwright Shard N/3` checks (was only the first two). Names read off a completed run rather than typed. Push-only checks (`deploy`, `Orchestrator Run`, `Post-deploy smoke suite`) deliberately excluded — requiring those would deadlock every PR. | 2026-08-01 |
| CI: Playwright gate dropped 66% of the suite and passed regardless | [#1176](https://github.com/oviney/blog/pull/1176) merged — shards shared a change-derived grep instead of hardcoded ones (322→full selected set), `continue-on-error` removed so failures block, dead `playwright-partial` job deleted, shard results merged properly, Firefox/WebKit made opt-in after never once running | 2026-08-01 |
| CI: five failures the non-blocking gate was hiding | [#1177](https://github.com/oviney/blog/pull/1177) merged — dashboard 320px canvas overflow (P3 #13 regressed), plus 4 stale tests, two of which asserted the old defective behaviour that #1103/#1123 had deliberately fixed | 2026-08-01 |
| Visual epic Gap A — no blocking pixel gate existed at all | [#1119](https://github.com/oviney/blog/pull/1119) merged — blocking Playwright `toHaveScreenshot` gate at 3 viewports; BackstopJS retired (contributor docs followed in [#1136](https://github.com/oviney/blog/pull/1136)) | 2026-07-02 |
| Visual epic Gap E — container width never asserted against its design token | [#1131](https://github.com/oviney/blog/pull/1131) merged — listing width asserted against the 1040px token | 2026-07-01 |
| Visual epic Gap D — no content/markup-quality assertions on built HTML | [#1130](https://github.com/oviney/blog/pull/1130) merged | 2026-07-01 |
| Visual epic Gap C — no viewport-overflow assertion anywhere | [#1122](https://github.com/oviney/blog/pull/1122) merged — 320/390px overflow guard; fixed the live dashboard sideways-scroll | 2026-06-30 |
| Visual epic — Phase-0 defect catalog (20 confirmed defects) | [#1094](https://github.com/oviney/blog/pull/1094) merged; individual fixes in #1097, #1098, #1102, #1103, #1104, #1123, #1125, #1132 | 2026-06-27 |
| Handoff Packet convention in `AGENTS.md` | [#1137](https://github.com/oviney/blog/pull/1137) merged; issue [#1109](https://github.com/oviney/blog/issues/1109) closed as stale-open 2026-07-31 | 2026-07-13 |
| Anchor Rule 4 agent-label detection (epic P1b) | [#1064](https://github.com/oviney/blog/pull/1064) merged — three Rule 4 branches moved to `has_label()`; scope-guard Cases J/K pin canonical + substring-superset behaviour | 2026-06-14 |
| Post editorial-quality promoted to a CI merge gate (epic P3) | [#1050](https://github.com/oviney/blog/pull/1050) merged — errors block, warnings advisory; 24/24 posts clean at gate-on | 2026-06-13 |
| Agent-quality rubric enforced in agent-eval workflow (epic P2) | [#1049](https://github.com/oviney/blog/pull/1049) merged — scorecard comment + hard gate on scope/coverage/churn | 2026-06-13 |
| Scope-guard Case E/F stale-comment cleanup (epic P1) | [#1045](https://github.com/oviney/blog/pull/1045) merged — bug already fixed in #989; comments were misleading | 2026-06-13 |
| CI guard: agent memory-block regression check | [#1030](https://github.com/oviney/blog/pull/1030) merged | 2026-06-13 |
| Decide `SECURITY.md` fate (case collision + topic page) | Resolved by [#1038](https://github.com/oviney/blog/pull/1038) — security topic page renamed to end the `SECURITY.md` case collision | 2026-06-13 |
| Tighten `~/.claude/projects/*/` perms to 700 (#995) | Done on host (all 7 dirs → `700`); resolution comment posted, awaiting issue close | 2026-05-31 |

---

*Maintained by hand. GitHub issue numbers are for traceability, not duplication.*
