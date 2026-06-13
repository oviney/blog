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

| Pri | Task | Scope / label | Status | Ref |
|----|------|---------------|--------|-----|
| P1 | **Decide `SECURITY.md` fate.** Working tree has an uncommitted rewrite of the GitHub security-policy file into a Jekyll topic page (`layout`/`permalink` front matter + `category == 'Security'` grid). This breaks GitHub's Security-tab policy rendering. Decide: (a) `git checkout SECURITY.md` to restore the policy, or (b) move the topic-page content to a new `security.md` page so policy + landing page coexist. | `agent:creative-director` or `general` | **Needs decision** (blocked on owner) | local working-tree change |
| P2 | **CI guard: agent memory-block regression check.** Add a CI check ensuring every `.claude/agents/*.md` retains its `Never persist to memory` / `## Memory Discipline` block, so the post-#999 guardrails can't silently regress. Suggested by the security-auditor during the #997 `/ship` audit. | `agent:qa-gatekeeper`, `governance-update` | Not started | memory `reference-subagent-memory` |
| P3 | **Agent quality evals + boundary enforcement + governance policies.** Stand up evals for agent output quality, scope/boundary enforcement, and governance policy. Stated strategic next priority; likely an epic to decompose into smaller specs. | `agent:qa-gatekeeper` | Not started (epic — decompose first) | memory `project-agent-evals` |

---

## In review (awaiting human gate)

| Task | PR | Gate |
|------|----|------|
| ADR-009 — split-scope sequential issues over mixed-scope PRs (#972) | [#1027](https://github.com/oviney/blog/pull/1027) | Review / merge |
| Spec AC-verification note: prefer `grep -A` over `awk` range (#996) | [#1028](https://github.com/oviney/blog/pull/1028) | Review / merge |

---

## Recently shipped

| Task | Resolution | Date |
|------|------------|------|
| Tighten `~/.claude/projects/*/` perms to 700 (#995) | Done on host (all 7 dirs → `700`); resolution comment posted, awaiting issue close | 2026-05-31 |

---

*Maintained by hand. GitHub issue numbers are for traceability, not duplication.*
