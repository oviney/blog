---
name: idea-refine
description: Refines rough ideas into issue-ready direction. Use when a request is still fuzzy and needs sharper scope, assumptions, acceptance criteria, or a clearer path into `/spec`, planning, or implementation.
version: 1.0.1
triggers:
  - A request is promising but underspecified
  - Multiple solution directions need narrowing
  - Acceptance criteria need to be sharpened before work starts
---

# Idea Refine

## Overview

Use this skill before code when the real problem, user value, or implementation boundary is still vague. In oviney/blog, the goal is usually not a long brainstorming artifact; it is a sharper issue, a cleaner `/spec`, or a concise implementation brief that fits the repo's command and scope rules.

## When to Use

- A feature or workflow idea is promising but underspecified
- Multiple directions are possible and trade-offs are unclear
- An issue needs better acceptance criteria before work begins
- A proposed change feels too broad and needs a tighter first slice
- You need to surface assumptions before planning or implementation

## Repo-Friendly Refinement Flow

### 1. Frame the Problem

Turn the raw request into a crisp problem statement:

- who is affected?
- what outcome matters?
- what repo surface is actually in play?
- what does success look like here?

### 2. Explore a Few Real Directions

Generate a small set of viable directions, not a giant list. Ground them in repo reality:

- existing lifecycle skills and command flow
- current file ownership and scope rules
- real validation commands from `CLAUDE.md` and `package.json`
- nearby patterns already present in the repo

### 3. Converge Into a Buildable Slice

End with a concrete output that can move into `/spec`, issue text, or an implementation brief:

- recommended direction
- in-scope files or surfaces
- assumptions to validate
- explicit non-goals
- acceptance criteria
- verification commands

## Artifact Rule for This Repo

Do not create a new planning Markdown file unless the user explicitly asks for it. In most cases, the refined output should live in the conversation, a GitHub issue, or a PR description.

## Helpful Output Shape

```text
Problem
Recommended direction
Assumptions to validate
First slice / non-goals
Acceptance criteria
Verification commands
```

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "We can figure out scope while coding" | Fuzzy scope causes branch sprawl and invalid command choices. |
| "More ideas are always better" | A few grounded directions beat a long list of shallow options. |
| "It is only docs, so constraints do not matter" | Governance docs and prompt layers change real behavior in this repo. |
| "We should save a brainstorm file by default" | Repo instructions prefer lightweight artifacts unless a file is explicitly requested. |

## Red Flags

- No target user, outcome, or success criteria
- Acceptance criteria that do not map to real files or commands
- Idea exploration that ignores protected files or scope guardrails
- Jumping into implementation before naming non-goals
- Invented commands or files in the proposed path

## Verification

After refining an idea:

- [ ] The problem statement is specific
- [ ] The recommended direction fits the repo's lifecycle and scope rules
- [ ] Non-goals are explicit
- [ ] Acceptance criteria map to real files and commands
- [ ] The next step is clear: `/spec`, planning, implementation, or defer

## Related Files

- [`../../../CLAUDE.md`](../../../CLAUDE.md) — lifecycle backbone and command truth
- [`../context-engineering/SKILL.md`](../context-engineering/SKILL.md) — loading the right local evidence before choosing a direction
- [`../planning/SKILL.md`](../planning/SKILL.md) — decomposing the chosen direction into slices
