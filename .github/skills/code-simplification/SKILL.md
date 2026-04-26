---
name: code-simplification
description: Simplifies working code and docs without changing behavior. Use when a solution is correct but harder to read, maintain, or review than it needs to be.
---

# Code Simplification

## Overview

Simplify only after the behavior is understood and already working. In oviney/blog, simplification often applies to Jekyll templates, skill docs, shell scripts, and Playwright specs — places where small clarity improvements help future agents as much as humans.

## When to Use

- A working change feels more complex than the surrounding repo pattern
- A review calls out unnecessary indirection or overly dense wording
- A command doc or skill doc can be clearer without changing meaning
- A script or template repeats the same idea in too many places

## Principles for This Repo

### 1. Preserve Exact Behavior

Keep the same:

- rendered site behavior
- command behavior
- scope and governance rules
- verification story

If a simplification changes any of those, it is not a simplification.

### 2. Match Local Patterns

Before refactoring, read:

- one neighboring file that already does it well
- `CLAUDE.md` for repo conventions
- any file-type instructions that govern the surface

### 3. Simplify Within Scope

This repo enforces a tight PR scope. Do not turn a simplification pass into an opportunistic cleanup tour.

## What Usually Simplifies Well Here

| Surface | Good simplification move |
|---|---|
| Skill docs | shorter steps, clearer command examples, fewer duplicate warnings |
| Command docs | one unambiguous workflow with real repo commands |
| Playwright specs | clearer role-based selectors, simpler setup, better test names |
| Shell scripts | focused conditions, fewer duplicated messages, explicit exit paths |
| Templates / includes | reduce repeated markup while keeping rendered output stable |

## What Usually Does Not

- removing safeguards just because they feel verbose
- broad renames across unrelated files
- mixing simplification with new feature behavior
- replacing explicit commands with generic placeholders

## Simplification Workflow

1. Understand the current behavior and why the code or doc exists
2. Make one focused simplification at a time
3. Re-run the smallest relevant validation command
4. If the diff becomes noisy, stop and split the work

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "I will simplify adjacent files while I am here" | That is scope creep, not simplification. |
| "Shorter is always better" | Clearer is better. Some explicit repetition is healthy. |
| "It is just wording" | In command and skill docs, wording changes behavior. |
| "I do not need to verify docs-only refactors" | This repo still expects build and scope validation. |

## Red Flags

- Tests or docs need meaning changes just to make the simplification pass
- The refactor touches more files than the issue allows
- The new version is terser but harder to follow
- Repo-valid commands are replaced with generic placeholders

## Verification

After a simplification pass:

- [ ] The behavior and acceptance criteria are unchanged
- [ ] The diff stays within the intended scope
- [ ] `bundle exec jekyll build` passes when rendered or Markdown output changed
- [ ] The smallest relevant existing QA/security command was rerun
- [ ] Scope validation still passes for the branch context

## Related Files

- [`../../../.claude/commands/code-simplify.md`](../../../.claude/commands/code-simplify.md) — command-layer entry point
- [`../../../CLAUDE.md`](../../../CLAUDE.md) — repo conventions and protected files
- [`../context-engineering/SKILL.md`](../context-engineering/SKILL.md) — loading the right nearby examples before refactoring
