---
name: deprecation-and-migration
description: Guides safe retirement and replacement work. Use when sunsetting older skills, commands, docs, templates, or interfaces and migrating the repo to a clearer or more maintainable path.
---

# Deprecation and Migration

## Overview

In oviney/blog, migration work usually means retiring older command wording, redundant prompt layers, stale skill guidance, or superseded site and QA workflows. Treat removal as product work: know what replaces the old path, who still depends on it, and how you will prove the repo still works after the change.

## When to Use

- Replacing one workflow, skill, command, or convention with another
- Removing stale docs, duplicated guidance, or obsolete agent surfaces
- Consolidating overlapping interfaces or paths into a single supported route
- Planning a compatibility window before deleting an older behavior
- Deciding whether a legacy surface should be maintained or retired

## Decision Checklist

Before removing anything, answer:

1. What real value does the old surface still provide?
2. What is the supported replacement?
3. Which files, commands, or contributors still depend on the old behavior?
4. Can the migration be additive first, then subtractive later?
5. How will you verify that no references or workflows were broken?

If you cannot name the replacement or the verification story, you are not ready to remove the old path.

## Repo Migration Pattern

### 1. Stabilize the Replacement

Make sure the new path is already documented and usable. In this repo that often means the replacement is reflected in `CLAUDE.md`, `.github/skills/`, `.claude/commands/`, or repo validation commands.

### 2. Map Consumers

Identify every place that still points at the retiring surface: docs, command files, skill references, workflow text, templates, or tests. Do not assume a wording change is isolated.

### 3. Migrate Deliberately

Prefer staged changes:

- add the new path
- update references to point at it
- verify the repo still builds and tests
- remove the superseded path only when the branch shows no remaining consumers in scope

### 4. Verify the Removal

Use the repo's real guardrails:

```bash
bundle exec jekyll build
bash scripts/check-pr-scope.sh
PR_LABELS=governance-update bash scripts/check-pr-scope.sh
```

Add the smallest relevant QA command when the migration touches tests, browser behavior, or security-sensitive tooling:

```bash
npm run test:playwright
npm run test:a11y
npm run test:lighthouse
npm run test:security
```

## Repo-Specific Guidance

- Prefer one canonical command or workflow name over parallel aliases when possible
- Keep issue and PR guidance consistent with the active lifecycle backbone in `CLAUDE.md`
- Do not migrate protected files or broad governance surfaces unless the issue explicitly includes them
- For docs-only migrations, remove stale wording only after the new wording exists nearby and is easier to follow

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "It is only documentation, we can delete first and tidy later" | Repo docs are executable guidance for agents and contributors. Broken docs break workflows. |
| "Both paths can stay forever" | Duplicate paths create drift and confuse future agents. |
| "Nobody uses that wording anymore" | If it is still visible, someone may follow it. Verify references before removal. |
| "Migration is too small for verification" | Small removals still need build and scope proof. |

## Red Flags

- Removing a path before its replacement is documented
- Leaving mixed old and new terminology in neighboring files
- Deprecating a workflow with no real verification command
- Broad cleanup spilling outside the issue's file list
- Touching protected governance files as part of an opportunistic migration

## Verification

After a migration change:

- [ ] The replacement path is documented and usable
- [ ] In-scope references were updated consistently
- [ ] `bundle exec jekyll build` passed
- [ ] Scope validation passed with the correct label context
- [ ] Any touched QA or security surface was revalidated with the relevant existing command

## Related Files

- [`../api-and-interface-design/SKILL.md`](../api-and-interface-design/SKILL.md) — designing stable surfaces before they need deprecation
- [`../../../scripts/check-pr-scope.sh`](../../../scripts/check-pr-scope.sh) — scope and governance guardrail
- [`../../../CLAUDE.md`](../../../CLAUDE.md) — lifecycle backbone and command truth
