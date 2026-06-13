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

> **Epic — Agent evals & governance gap-closure** (decomposed 2026-06-13 from
> memory `project-agent-evals`). The governance stack is ~80% built; these tasks
> close the specific gaps where governance is *claimed but not enforced*. P4/P5
> are optional/low. Scoped against existing machinery: `check-pr-scope.sh`,
> `check-agent-memory-discipline.sh` (#1030), `agent-eval.yml`, `validate-posts.sh`.

| Pri | Task | Scope / label | Status | Ref |
|----|------|---------------|--------|-----|
| ~~P1~~ | ~~Fix label-bypass substring bug.~~ **Already fixed in #989** — Rules 1–3 use `has_label()`; scope-guard Cases A–I all pass. Verified 2026-06-13. Reduced to a stale-comment cleanup in `tests/scope-guard.sh` (Cases E/F no longer say "will be GREEN once migrated"). | `agent:qa-gatekeeper` | **Done** (comment cleanup PR pending) | epic ↑ |
| P1b | _(candidate)_ **Anchor Rule 4 agent-label detection.** `check-pr-scope.sh` lines ~155–161 still use unanchored `grep -q`/`grep -qE` for agent-label detection — the only spot not on `has_label()`. Low risk (agent labels are a fixed enum) but inconsistent. | `agent:qa-gatekeeper`, `governance-update` | Not started (low) | epic ↑ |
| P2 | **Automate the agent-quality rubric.** Wire `scripts/eval-agent-pr.sh` hard thresholds (protected-file touch, code>50 LOC w/ 0 tests, >2 post-review force-pushes) into `agent-eval.yml` — post scorecard comment, hard-fail on breach. | `agent:qa-gatekeeper` | Not started | epic ↑ |
| P3 | **Promote post-quality to a CI gate.** Add `validate-post-quality.sh` (error-level only) to the `validate-editorial` job; precede with a `--all` backfill audit to fix/triage existing failures first. | `agent:qa-gatekeeper` | Not started | epic ↑ |
| P4 | _(optional)_ **Codify risk-tier policy.** Document branch protection so `risk:high` is a hard human-review block + thin CI gate failing `risk:high` PRs with no approving review. | `agent:qa-gatekeeper` | Not started (optional) | epic ↑ |
| P5 | _(optional)_ **Harden memory-guard against rephrasing.** Make `check-agent-memory-discipline.sh` marker check tolerant of heading level / synonyms, or document accepted brittleness. | `agent:qa-gatekeeper`, `governance-update` | Not started (optional) | epic ↑ |

---

## In review (awaiting human gate)

| Task | PR | Gate |
|------|----|------|
| _(none)_ | | |

---

## Recently shipped

| Task | Resolution | Date |
|------|------------|------|
| CI guard: agent memory-block regression check | [#1030](https://github.com/oviney/blog/pull/1030) merged | 2026-06-13 |
| Decide `SECURITY.md` fate (case collision + topic page) | Resolved by [#1038](https://github.com/oviney/blog/pull/1038) — security topic page renamed to end the `SECURITY.md` case collision | 2026-06-13 |
| Tighten `~/.claude/projects/*/` perms to 700 (#995) | Done on host (all 7 dirs → `700`); resolution comment posted, awaiting issue close | 2026-05-31 |

---

*Maintained by hand. GitHub issue numbers are for traceability, not duplication.*
