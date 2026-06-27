# Backlog — viney.ca blog

The **local work queue for in-session / interactive Claude Code work**. This file
is the source of truth a `/goal` "pull the highest-priority task" loop reads.

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

| Pri | Task | Scope / label | Status | Ref |
|----|------|---------------|--------|-----|
| _(none)_ | Active queue drained. | | | |

---

## In review (awaiting human gate)

| Task | PR | Gate |
|------|----|------|
| _(none)_ | | |

---

## Recently shipped

| Task | Resolution | Date |
|------|------------|------|
| Anchor Rule 4 agent-label detection (epic P1b) | [#1064](https://github.com/oviney/blog/pull/1064) merged — three Rule 4 branches moved to `has_label()`; scope-guard Cases J/K pin canonical + substring-superset behaviour | 2026-06-14 |
| Post editorial-quality promoted to a CI merge gate (epic P3) | [#1050](https://github.com/oviney/blog/pull/1050) merged — errors block, warnings advisory; 24/24 posts clean at gate-on | 2026-06-13 |
| Agent-quality rubric enforced in agent-eval workflow (epic P2) | [#1049](https://github.com/oviney/blog/pull/1049) merged — scorecard comment + hard gate on scope/coverage/churn | 2026-06-13 |
| Scope-guard Case E/F stale-comment cleanup (epic P1) | [#1045](https://github.com/oviney/blog/pull/1045) merged — bug already fixed in #989; comments were misleading | 2026-06-13 |
| CI guard: agent memory-block regression check | [#1030](https://github.com/oviney/blog/pull/1030) merged | 2026-06-13 |
| Decide `SECURITY.md` fate (case collision + topic page) | Resolved by [#1038](https://github.com/oviney/blog/pull/1038) — security topic page renamed to end the `SECURITY.md` case collision | 2026-06-13 |
| Tighten `~/.claude/projects/*/` perms to 700 (#995) | Done on host (all 7 dirs → `700`); resolution comment posted, awaiting issue close | 2026-05-31 |

---

*Maintained by hand. GitHub issue numbers are for traceability, not duplication.*
