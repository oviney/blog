---
name: planning-and-task-breakdown
description: 'Planning and task breakdown before coding. Use when starting any issue, scoping a PR, or splitting work across multiple PRs.'
version: 1.1.0
triggers:
  - Starting work on any issue
  - Scoping a PR before making changes
  - Estimating how many files a change will touch
  - Splitting a large issue into smaller PRs
---

## Context

Agents that skip planning routinely violate scope rules — touching too many files,
drifting into unrelated improvements, or bundling unrelated concerns into a single PR.
Issues #689 and #690 demonstrated this pattern: agents jumped straight into code changes
without mapping acceptance criteria to specific files first, resulting in scope explosions
and governance violations.

This skill is the root-cause fix. Every agent — regardless of domain — should run through
these steps **before writing any code**.

**Production URL**: https://www.viney.ca
**Repository**: oviney/blog
**Main branch**: `main`

## Step-by-Step Instructions

### 1. Read the issue completely

Read the title, body, acceptance criteria, labels, and every comment before doing anything
else. Identify:

- The **acceptance criteria** (explicit or implied)
- The **agent label** (determines which files you may touch)
- Any **constraints** mentioned in the issue body

### 2. List every file you expect to change

For each acceptance criterion, write down the specific file(s) that need to change.
Use this format:

```
AC 1: "Category labels use correct colour"
  → _sass/economist-theme.scss  (change $category-color variable)

AC 2: "Build passes"
  → (no file change — validation only)

AC 3: "New skill file exists"
  → .github/skills/planning/SKILL.md  (create)
```

If you cannot map a criterion to a specific file, investigate further before proceeding —
never start coding with vague scope.

### 3. Count the files

Count the total number of files in your plan.

| File count | Action |
|------------|--------|
| **1–10** | Proceed — single PR is appropriate |
| **11–15** | Review critically — can any changes be deferred to a follow-up issue? |
| **> 15** | **Stop.** Split into multiple issues/PRs before writing any code |

The CI scope-explosion check (`scripts/check-pr-scope.sh`) hard-fails above 15 files
(16+ triggers a violation). Plan for a maximum of 10 files per PR to leave margin for
unexpected additions.

### 4. Check scope rules

Before touching any file, verify it is within your agent's allowed scope:

| Agent label | MAY touch | MUST NOT touch |
|-------------|-----------|----------------|
| `agent:creative-director` | `_sass/`, `_layouts/`, `assets/css/`, `assets/images/`, `assets/charts/` | `.github/workflows/`, `tests/`, `scripts/`, `_config.yml`, `_posts/` |
| `agent:qa-gatekeeper` | `.github/workflows/`, `tests/`, `specs/`, `scripts/`, `playwright.config.ts` | `_sass/`, `_layouts/`, `_posts/`, `_config.yml` |
| `agent:editorial-chief` | `_posts/`, `_drafts/`, `docs/`, `*.md` (root), `blog.html`, `search.html` | `_sass/`, `_layouts/`, `.github/workflows/`, `tests/`, `scripts/`, `_config.yml` |
| `agent:audience-researcher` | `docs/`, `references/`, `*.md` (root) | `_posts/`, `_sass/`, `_layouts/`, `.github/workflows/`, `tests/`, `scripts/`, `_config.yml` |
| No agent label | Any non-protected file | `_config.yml`, `.github/CODEOWNERS`, `.github/copilot-instructions.md`, `Gemfile`, `Gemfile.lock` |

If a required change falls outside your scope, **stop and comment on the issue** explaining
what is needed and which agent should handle it.

### 5. Write the plan, then code

Only after steps 1–4 are complete should you create a branch and start making changes.
Commit incrementally — one logical change per commit.

## Common Pitfalls

### Pitfall 1: Jumping straight into code
**Problem**: Agent reads the issue title, guesses the fix, and starts editing files without
mapping acceptance criteria to specific changes. Result: scope creep, governance violations,
wasted review cycles.
**Solution**: Always complete steps 1–4 above before creating a branch. The plan is cheap;
rework is expensive.

### Pitfall 2: "While I'm here" improvements
**Problem**: Agent notices an adjacent issue (stale comment, inconsistent formatting, missing
test) and fixes it alongside the assigned work. Result: the PR touches files outside scope
and fails the scope check.
**Solution**: Open a new issue for unrelated improvements. Do not bundle them into the
current PR.

### Pitfall 3: Underestimating file count
**Problem**: Agent plans 8 file changes but discovers 6 more during implementation, pushing
the PR past 15 files and triggering the scope-explosion violation.
**Solution**: Include a margin in your initial count. If the plan shows 10+ files, split
proactively before starting — not after the scope check fails.

### Pitfall 4: Vague acceptance criteria
**Problem**: The issue says "improve the blog" with no specific criteria. Agent interprets
broadly and touches many files.
**Solution**: Before starting, comment on the issue asking for clarification. Map each
criterion to a concrete file change; if you cannot, the criterion is too vague to implement.

## Code Snippets/Patterns

### Planning checklist (copy into your working notes)

```markdown
## Pre-coding plan for #<issue-number>

**Acceptance criteria → file map:**
1. AC: "<criterion>" → `path/to/file` (create | edit | delete)
2. AC: "<criterion>" → `path/to/file` (edit)
3. AC: "<criterion>" → (validation only — no file change)

**File count:** N files
**Within 10-file limit?** Yes / No — if No, split plan here:
  - PR 1: ACs 1–2 (files A, B)
  - PR 2: ACs 3–4 (files C, D)

**Scope check:**
- [ ] No protected files touched
- [ ] All files within agent label scope
- [ ] No "while I'm here" extras
```
**When to use**: At the start of every issue, before creating a branch.

### Splitting a large issue

```markdown
## Split plan for #<issue-number>

Original issue has 18 file changes — splitting into 2 PRs:

### PR 1: "<focused description>" (8 files)
- `file-a.scss` — change X
- `file-b.html` — change Y
- ...

### PR 2: "<focused description>" (10 files)
- `file-c.md` — change Z
- ...

Each PR references the original issue: "Partial fix for #N"
```
**When to use**: When your file count exceeds 10.

## Related Files

- [`scripts/check-pr-scope.sh`](../../../scripts/check-pr-scope.sh) — CI scope enforcement (15-file limit, protected files, agent scope)
- [`AGENTS.md`](../../../AGENTS.md) — agent roster, scope rules, cross-agent conventions
- [`.github/skills/_template/SKILL.md`](../_template/SKILL.md) — skill file template
- [`.github/skills/general/SKILL.md`](../general/SKILL.md) — general agent skill (broadest scope)

## Success Criteria

- [ ] Acceptance criteria mapped to specific file changes before any code is written
- [ ] File count checked — within 10-file target (hard limit 15)
- [ ] No protected files in the plan
- [ ] All planned files within agent label scope
- [ ] No unrelated "while I'm here" changes included
- [ ] Plan documented in PR description or working notes

## Version History

- **1.0.0** (2026-04-12): Initial skill creation — root-cause fix for scope violations (#689, #690)
