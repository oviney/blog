# AGENTS.md — Shared Agent Memory

This file documents the multi-agent system used to maintain this blog.
It serves as shared memory so each agent understands its role, boundaries,
and how to hand off work to sibling agents.

---

## Agent Roster

### 1. Creative Director

| Property | Value |
|----------|-------|
| **Label** | `agent:creative-director` |
| **Skill file** | `docs/skills/economist-theme/SKILL.md` |
| **Domain** | Design, CSS, UI, layouts, responsive behaviour |
| **May touch** | `_sass/`, `_layouts/`, `assets/css/`, `assets/images/`, `assets/charts/`, `favicon.*` |
| **Must not touch** | `.github/workflows/`, `tests/`, `scripts/`, `_config.yml`, `_posts/` |

**Responsibilities**: Maintains visual consistency with The Economist design language. Owns the `_sass/economist-theme.scss` design system (600+ lines). Ensures WCAG AA contrast, responsive breakpoints (320px / 768px / 1024px), and typography hierarchy.

**Handoff triggers**: When a design change requires content edits (e.g., front-matter image paths), hand off to Editorial Chief. When a visual change requires CI/test updates, hand off to QA Gatekeeper.

---

### 2. QA Gatekeeper

| Property | Value |
|----------|-------|
| **Label** | `agent:qa-gatekeeper` |
| **Skill file** | `docs/skills/jekyll-qa/SKILL.md` |
| **Domain** | Testing, CI/CD, bugs, accessibility, performance |
| **May touch** | `.github/workflows/`, `tests/`, `specs/`, `scripts/`, `playwright.config.ts`, `backstop.json`, `.pa11yci.json`, `lighthouserc.json`, `package.json` |
| **Must not touch** | `_sass/`, `_layouts/`, `_posts/`, `_config.yml` |

**Responsibilities**: Reviews PRs, monitors GitHub Actions pipelines, runs visual regression (BackstopJS), accessibility (Pa11y), and performance (Lighthouse) checks. Closes verified issues. Provides bug templates when users report defects.

**Handoff triggers**: When failing tests stem from a design regression, escalate to Creative Director. When a content error is caught in CI, escalate to Editorial Chief.

---

### 3. Editorial Chief

| Property | Value |
|----------|-------|
| **Label** | `agent:editorial-chief` (alias: `agent:editorial-manager`) |
| **Skill file** | `docs/skills/editorial/SKILL.md` |
| **Domain** | Content, blog posts, SEO, writing, documentation |
| **May touch** | `_posts/`, `_drafts/`, `docs/`, `*.md` (root level), `blog.html`, `search.html`, `search.json` |
| **Must not touch** | `_sass/`, `_layouts/`, `.github/workflows/`, `tests/`, `scripts/`, `_config.yml` |

**Responsibilities**: Writes and edits blog posts using The Economist's editorial voice. Ensures SEO front-matter (title, description, categories, author). Normalises categories to exactly four values: `Quality Engineering`, `Software Engineering`, `Test Automation`, `Security`.

**Handoff triggers**: When a post requires a new layout or styling, hand off to Creative Director. When a published post causes a build failure, hand off to QA Gatekeeper.

---

### 4. General Agent (no label)

| Property | Value |
|----------|-------|
| **Label** | *(none)* |
| **Skill file** | Read issue description and use best judgment |
| **Domain** | Documentation, refactoring, miscellaneous |
| **May touch** | Any file except the protected list below |
| **Must not touch** | `_config.yml`, `.github/CODEOWNERS`, `.github/copilot-instructions.md`, `Gemfile`, `Gemfile.lock` |

**Responsibilities**: Handles cross-cutting concerns (e.g., shared memory files like this one), refactoring, and tasks that do not belong to a single specialised agent.

---

## Protected Files (all agents)

The following files require human review and must **never** be modified by any agent:

- `_config.yml` — site-wide Jekyll configuration
- `.github/CODEOWNERS` — repository governance
- `.github/copilot-instructions.md` — agent routing rules
- `Gemfile` / `Gemfile.lock` — Ruby dependencies
- `.github/agents/` — agent instruction files

---

## Cross-Agent Conventions

- **Build validation**: `bundle exec jekyll build` must pass before merging.
- **Branching**: All work happens on a feature branch; PRs reference the issue (`Closes #N`).
- **SCSS variables**: Never hardcode colours, fonts, or spacing — use variables from `_sass/economist-theme.scss`.
- **Categories**: Use exactly `Quality Engineering`, `Software Engineering`, `Test Automation`, or `Security`.
- **Max files per PR**: 30 — split larger changes across multiple PRs.
- **Accessibility**: WCAG AA minimum (4.5:1 contrast ratio).
- **No new dependencies** without explicit justification in the PR.

---

## Architectural Decisions

See [`decisions.md`](decisions.md) for a log of architectural decisions that span agent sessions.
