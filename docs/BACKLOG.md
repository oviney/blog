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

> **Epic — Visual-quality gate hardening** — **Gaps A, C, D, E shipped; Gap B in review.**
> Driven by [`docs/agents/visual-quality-review.goal.md`](agents/visual-quality-review.goal.md)
> and the 20-defect Phase-0 catalog in [`docs/agents/visual-audit-findings.md`](agents/visual-audit-findings.md).
> This epic was never tracked here — it ran entirely through GitHub Issues/PRs
> while this file read "Active queue drained." Recorded now so the local queue
> reflects reality. Gap B (#1138) is the last open gap.

| Pri | Task | Scope / label | Status | Ref |
|----|------|---------------|--------|-----|
| P2 | Decouple category visual baselines from post publication — full-page `toHaveScreenshot` on `/security/`, `/software-engineering/`, `/test-automation/` re-baselines on **every** publish, so the gate bills a rebaseline as the price of shipping content. Clip to header + first grid row, or mask the card grid. | `agent:qa-gatekeeper` | Not started — surfaced by the #1138 failure | — |
| P2 | Fix the orchestrator's duplicate-PR closer. `.github/workflows/orchestrator.yml:144` maps PRs to issues with `/(?<![/\w])#(\d+)/g`, matching **any** bare `#NNN` in a body, not just closing keywords. Two open PRs that merely mention the same issue are treated as duplicates and the lower-commit one is auto-closed. Closed #1171, #1172 and #1174 in one session. Restrict to closing keywords (`clos(e|es|ed)`, `fix(es|ed)`, `resolve(s|d)`). | `governance-update` | Not started | — |
| P3 | De-duplicate Jekyll builds in CI. A PR builds the site ~4 times across `test-build`, `content-validation` and `test-quality` jobs. Build once, upload `_site` as an artifact, download in dependents. | `agent:qa-gatekeeper` | Not started | — |
| P3 | Decide the fate of cross-browser coverage. Firefox and WebKit projects are now opt-in behind `PLAYWRIGHT_ALL_BROWSERS=1` because CI only ever installed chromium — 376 tests had never once run. Either install those browsers on the nightly schedule and enable the flag, or delete the projects. | `agent:qa-gatekeeper` | Not started | — |
| P3 | ADR: adopt / defer / hybrid on `.github/agents/*.agent.md` native custom agents vs `agent:*` label routing. Decision only — avoid two competing routing systems. | `governance-update` | Not started | [#1110](https://github.com/oviney/blog/issues/1110) |
| — | Real newsletter signup (BLOG-005). **Blocked:** `ROADMAP.md:71` lists email subscription as Out of Scope; owner must move it in-scope first. | `enhancement` | Blocked on owner decision | [#1063](https://github.com/oviney/blog/issues/1063) |
| — | Publish decision on `_review/review-queue-throughput-tax-42d2fbb4.md`. Assets present; carries the same B-017 slop tells cleared from the flaky-tests post in #1168 (2 spaced em-dashes, one "not merely", 4 doubled blank lines after headings). | `agent:editorial-chief` | Awaiting editorial review | — |

---

## In review (awaiting human gate)

| Task | PR | Gate |
|------|----|------|
| Remediate the `brace-expansion` advisory; drop the allowlist exception | [#1170](https://github.com/oviney/blog/pull/1170) | Merge — **land first**, it unreds the 🔒 Security Audit check on every other open PR |
| Bump `@playwright/test` 1.61.1 → 1.62.0 | [#1162](https://github.com/oviney/blog/pull/1162) | Merge — rebase onto #1170 first |
| Close Gap B — visual coverage for uncovered page types | [#1138](https://github.com/oviney/blog/pull/1138) | Merge — needs a rebase onto #1170 + #1162, then a baseline re-seed (see note below) |
| Refresh agent observability dashboard data | [#1167](https://github.com/oviney/blog/pull/1167) | Merge — automated data refresh, no checks configured |

> **Gap B (#1138) sequencing.** Its two red category baselines are stale by 23px
> because the flaky-tests post published into those categories on 2026-07-24,
> after the baselines were seeded. Re-seed **after** #1162 lands — Playwright
> 1.62 ships a newer bundled Chromium, so seeding first would only force a
> second re-seed.

---

## Recently shipped

| Task | Resolution | Date |
|------|------------|------|
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
