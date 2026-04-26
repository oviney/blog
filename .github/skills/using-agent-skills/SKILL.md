---
name: using-agent-skills
description: Discovers and invokes agent skills for viney.ca blog. Use when starting a session or when you need to discover which skill applies to the current task. This is the meta-skill that governs how all other skills are discovered and invoked.
---

# Using Agent Skills — viney.ca Blog

## Overview

For direct/local agent work in this repo, use the upstream `agent-skills`
lifecycle as the execution backbone. Blog-specific skills still matter, but they
are augmentations layered onto the lifecycle rather than replacements for it.
This meta-skill helps you choose the callable local lifecycle skill first, then
add any repo-specific skill that sharpens execution for viney.ca.

The upstream-aligned guides live in `.github/skills/spec-driven-development/`,
`.github/skills/incremental-implementation/`, and similar folders. Treat those as
reference docs backing the callable local skills such as `spec`, `build`, `test`,
`review`, and `ship`.

For issue-assigned **Copilot cloud agent** work, stay inside this repo-authored
instruction envelope:

1. Start with repo instructions in `.github/copilot-instructions.md`
2. Apply any matching path instructions from `.github/instructions/`
3. Use `AGENTS.md` and the relevant skill files as supporting repo context

This meta-skill helps choose the right lifecycle skill inside that envelope; it does
not replace the repo or path instructions. Runtime features such as custom agents or
MCP/tool integrations are useful when available, but they are runtime-dependent and
should not be documented as guaranteed everywhere.

## Skill Discovery Flowchart

When a task arrives, identify the lifecycle phase first, then add any blog-specific augmentation:

```
Task arrives
    │
    ├── Need to define what to build? ─────────→ spec
    │   └── If it should be tracked in GitHub → github-issues-workflow
    ├── Have a spec and need tasks? ───────────→ planning-and-task-breakdown
    ├── Ready to implement? ───────────────────→ build
    │   ├── Jekyll/Liquid/content work? ──────→ jekyll-development
    │   ├── Design / CSS / layout change? ───→ economist-theme
    │   └── Writing / SEO / editorial work? ─→ editorial
    ├── Need proof or regression coverage? ───→ test
    │   └── Repo QA / Playwright / CI? ───────→ jekyll-qa
    ├── Reviewing a change? ──────────────────→ review
    │   └── Repo review conventions? ─────────→ code-review
    ├── Branching / committing / PR flow? ────→ ship
    │   └── Repo PR/ship conventions? ───────→ git-operations
    └── Issue triage / bug lifecycle? ────────→ github-issues-workflow
```

## Agent Personas

Each agent label activates a specific persona with domain constraints:

| Label | Persona | Skill | May Touch |
|-------|---------|-------|-----------|
| `agent:creative-director` | Creative Director | `economist-theme` | `_sass/`, `_layouts/`, `assets/` |
| `agent:qa-gatekeeper` | QA Gatekeeper | `jekyll-qa` | `.github/workflows/`, `tests/`, `scripts/` |
| `agent:editorial-chief` | Editorial Chief | `editorial` | `_posts/`, `_drafts/`, `*.md` |
| *(no label)* | General | best judgement | anything except protected files |

## Core Operating Behaviours

These apply at all times, across all skills:

### 1. Surface Assumptions

Before implementing anything non-trivial, state assumptions explicitly:

```
ASSUMPTIONS I'M MAKING:
1. [assumption about requirements]
2. [assumption about scope]
→ Correct me now or I'll proceed with these.
```

### 2. Skill Before Code

Never implement directly if a skill applies. Invoke the lifecycle skill first, follow its process, then add any repo-specific skill needed for this blog.

### 3. Protected Files — Never Touch

`_config.yml` · `.github/CODEOWNERS` · `.github/copilot-instructions.md` · `Gemfile` · `Gemfile.lock`

### 4. Validate Before Every PR

```bash
bundle exec jekyll build   # must pass
```

## Lifecycle Phase → Skill Mapping

| Phase | What you're doing | Skill |
|-------|------------------|-------|
| **DEFINE** | Clarify what to build | `spec` |
| **PLAN** | Break approved work into tasks | `planning-and-task-breakdown` |
| **BUILD** | Implement in slices | `build` + relevant blog skill |
| **VERIFY** | Prove it works | `test` + `jekyll-qa` when repo validation is needed |
| **REVIEW** | Review code quality | `review` + `code-review` |
| **SHIP** | Branch, commit, PR, deploy | `ship` + `git-operations` |
| **REPORT** | File or triage repo issues | `github-issues-workflow` |

## Slash Commands

| Command | Activates |
|---------|-----------|
| `/spec` | `spec` first, then `github-issues-workflow` when the outcome should be a tracked GitHub issue |
| `/plan` | `planning-and-task-breakdown` |
| `/build` | `build` + the relevant blog domain skill |
| `/test` | `test` + `jekyll-qa` |
| `/review` | `review` + `code-review` |
| `/ship` | `ship` + `git-operations` |
