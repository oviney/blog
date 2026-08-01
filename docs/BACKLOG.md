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
| P3 | De-duplicate Jekyll builds in CI. A PR builds the site ~4 times across `test-build`, `content-validation` and `test-quality` jobs. Build once, upload `_site` as an artifact, download in dependents. | `agent:qa-gatekeeper` | Not started | — |
| P3 | Decide the fate of cross-browser coverage. Firefox and WebKit projects are now opt-in behind `PLAYWRIGHT_ALL_BROWSERS=1` because CI only ever installed chromium — 376 tests had never once run. Either install those browsers on the nightly schedule and enable the flag, or delete the projects. | `agent:qa-gatekeeper` | Not started | — |
| P3 | Hero type scale is hardcoded, not tokenised. `_sass/economist-theme.scss:1752` sets `.hero-post-title { font-size: 2.25rem }` as a literal, with the responsive overrides at `:1825` / `:1829` doing the same. `CLAUDE.md` says the design system is variables-only, never hardcode. Surfaced while planning #1191 — the hero's pixels are no longer baselined, which makes the drift slightly cheaper to leave and slightly harder to notice. Bundle into a theme pass rather than fixing alone. | `agent:creative-director` | Not started — raised in `tasks/plan.md` for #1191 | — |
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
| Decouple the **homepage** visual baseline from post publication | [#1191](https://github.com/oviney/blog/pull/1191) merged — the last page still coupled to publishing, and the one that moved on every publish. `POST_CROSS_LINKS` generalised into a per-page `volatile` selector list; the homepage names `.hero-post`, `display: none`-ed before capture. Not masked: a mask paints after layout, so a taller or shorter hero still shifts the grid and fails on a size mismatch first. **Two** baselines re-seeded, not the three predicted — Tablet and Desktop. Mobile is byte-identical because at 320×568 the hero sits below the fold, which also explains why the original probe breached the threshold on Tablet alone. Proven with a throwaway post routed through Security so it moved the topic-card counter 3 → 4: 🖼️ Visual Regression green. Coverage traded: the hero's pixels (type scale, spacing, image aspect, colour); `homepage.spec.ts:21-38` and `:174-180` still assert its structure. Residual: the topic-card post counters are now above the fold and move on publish — ~0.0002 of the frame against a 0.02 threshold, measured holding. | 2026-08-01 |
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
