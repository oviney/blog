---
name: using-agent-skills
description: Discovers and invokes agent skills for viney.ca blog. Use when starting a session or when you need to discover which skill applies to the current task. This is the meta-skill that governs how all other skills are discovered and invoked.
---

# Using Agent Skills — viney.ca Blog

## Overview

This blog uses a skill-driven execution model. Each skill encodes the workflow a senior engineer follows for a specific type of task. This meta-skill helps you discover and apply the right skill for your current task.

## Skill Discovery Flowchart

When a task arrives, identify the phase and apply the corresponding skill:

```
Task arrives
    │
    ├── Reporting a bug or incident? ──────────→ github-issues-workflow
    ├── Writing or editing content? ───────────→ editorial
    │   └── New post, draft, SEO fix, etc.
    ├── Design / CSS / layout change? ─────────→ economist-theme
    │   └── SCSS, responsive, typography, UI
    ├── Test / CI / QA work? ──────────────────→ jekyll-qa
    │   └── Playwright, pa11y, Lighthouse, CI
    ├── Jekyll build / dev server / Liquid? ───→ jekyll-development
    ├── Git workflow / branching / PR? ────────→ git-operations
    ├── Planning a sprint or backlog? ─────────→ planning
    ├── Code review? ──────────────────────────→ code-review
    └── Cross-cutting / infra / general? ──────→ github-issues-workflow + best judgement
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

Never implement directly if a skill applies. Invoke the skill first, follow its process, then implement.

### 3. Protected Files — Never Touch

`_config.yml` · `.github/CODEOWNERS` · `.github/copilot-instructions.md` · `Gemfile` · `Gemfile.lock`

### 4. Validate Before Every PR

```bash
bundle exec jekyll build   # must pass
```

## Lifecycle Phase → Skill Mapping

| Phase | What you're doing | Skill |
|-------|------------------|-------|
| **REPORT** | Bug found, incident, production issue | `github-issues-workflow` |
| **PLAN** | Sprint planning, backlog grooming | `planning` |
| **BUILD** | Jekyll templates, SCSS, Liquid | `jekyll-development` + `economist-theme` |
| **WRITE** | Blog posts, drafts, SEO | `editorial` |
| **TEST** | Playwright, CI, a11y, performance | `jekyll-qa` |
| **REVIEW** | PR review, code quality | `code-review` |
| **SHIP** | Branch, commit, PR, deploy | `git-operations` |

## Slash Commands

| Command | Activates |
|---------|-----------|
| `/spec` | `github-issues-workflow` — file a well-formed issue |
| `/plan` | `planning` — break work into tasks |
| `/build` | `jekyll-development` — start dev server and build |
| `/test` | `jekyll-qa` — run test suite |
| `/review` | `code-review` — review a PR or diff |
| `/ship` | `git-operations` — commit, push, open PR |
