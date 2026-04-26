---
name: documentation-and-adrs
description: Records durable decisions and workflow docs for oviney/blog. Use when updating shared docs, architectural rationale, or agent-facing guidance that future contributors will depend on.
---

# Documentation and ADRs

## Overview

Document the decisions that future humans and agents need in order to avoid repeating mistakes. In oviney/blog, that usually means updating skill docs, command docs, repo workflow guides, or `decisions.md` when an architectural or workflow choice changes.

## When to Use

- Introducing or changing an agent skill or command-layer workflow
- Recording a durable architectural or governance decision
- Updating contributor guidance that affects how work is executed
- Clarifying repo-specific commands, labels, or review expectations
- Closing a gap that would otherwise force future contributors to guess

## Where Decisions Live in This Repo

| Decision type | Preferred home |
|---|---|
| Architecture or durable repo decision | `decisions.md` |
| Agent workflow or skill behavior | `.github/skills/<name>/SKILL.md` |
| Claude slash-command behavior | `.claude/commands/<name>.md` |
| Setup or contributor workflow | `README.md`, `GETTING_STARTED.md`, or relevant root docs |
| Short operational checklist | `references/*.md` |

This repo does **not** currently use a numbered `docs/decisions/ADR-*` directory. Keep documentation aligned with the structures already in use unless an approved issue explicitly introduces a new one.

## Documentation Rules

### Document the Why

Good repo docs explain:

- why a workflow exists
- why one command is preferred over another
- why a guardrail is strict
- why a change belongs in one skill or command rather than another

### Keep Docs Executable

If a doc mentions a command, label, path, or skill name, it must be real. Documentation in this repo is operational, not aspirational.

### Prefer Small, Targeted Updates

Update only the files that truly own the decision. Do not spread the same rule across many docs unless the workflow genuinely needs multiple entry points.

## Decision Capture Pattern

Use this structure when recording a durable change:

```markdown
## Decision
[What changed]

## Context
[Why the old guidance was insufficient]

## Chosen Approach
[What the repo now expects contributors to do]

## Consequences
- [trade-off 1]
- [trade-off 2]
```

## For Skill and Command Docs

Keep the workflow crisp:

- name the lifecycle phase or use case
- point to repo-valid commands
- list anti-patterns and red flags
- end with a verification checklist

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "The code already shows it" | Workflow and governance decisions are not obvious from code alone. |
| "We can add the docs later" | Later usually means future contributors repeat the same mistake. |
| "A generic ADR template is fine" | Only if it matches how this repo actually records decisions. |
| "One wrong command in a doc is harmless" | Agents and contributors copy commands literally. |

## Red Flags

- Docs describe tooling the repo does not run
- Architectural rationale exists only in PR comments or chat history
- The same rule appears in multiple places with different wording
- A new workflow is added with no owning skill or command doc
- `decisions.md` is needed but skipped to keep the diff smaller

## Verification

After documentation work:

- [ ] The owning file for the decision was updated
- [ ] All commands, labels, and paths mentioned are real
- [ ] `bundle exec jekyll build` passes for Markdown changes
- [ ] Governance-surface docs also pass `PR_LABELS=governance-update bash scripts/check-pr-scope.sh` when applicable
- [ ] The documentation explains the why, not just the what

## Related Files

- [`../../../decisions.md`](../../../decisions.md) — durable architectural decisions
- [`../../../AGENTS.md`](../../../AGENTS.md) — ownership map and lifecycle routing
- [`../../../.claude/commands/`](../../../.claude/commands/) — command-layer entry points
- [`../../../references/accessibility-checklist.md`](../../../references/accessibility-checklist.md) — example of focused supporting documentation
