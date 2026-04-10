# AGENTS.md — Shared Agent Memory

This file documents the multi-agent system used to maintain this blog.
It serves as shared memory so each agent understands its role, boundaries,
and how to hand off work to sibling agents.

---

## Setup & Development

```bash
# Install dependencies
bundle install
npm install

# Build the site (validation — run before every PR)
bundle exec jekyll build

# Start dev server (local preview at http://localhost:4000)
bundle exec jekyll serve --port 4000

# Run Playwright tests (requires dev server running)
npx playwright test

# Run a single test file
npx playwright test tests/playwright-agents/navigation.spec.ts

# Run tests for a specific viewport
npx playwright test --project="Mobile Chrome"

# Validate blog posts (staged files only)
bash scripts/validate-posts.sh

# Validate all posts
bash scripts/validate-posts.sh --all
```

**Tech stack:** Jekyll (Ruby), SCSS, Vanilla JS, Playwright (TypeScript), GitHub Actions, GitHub Pages

---

## Agent Roster

### 1. Creative Director

| Property | Value |
|----------|-------|
| **Label** | `agent:creative-director` |
| **Skill file** | `.github/skills/economist-theme/SKILL.md` |
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
| **Skill file** | `.github/skills/jekyll-qa/SKILL.md` |
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
| **Skill file** | `.github/skills/editorial/SKILL.md` |
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
| **Skill file** | `.github/skills/general/SKILL.md` |
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

---

## Documentation Ownership Map

Every documentation file has an explicit owner and a review cadence.
Ownership means the agent is responsible for keeping the file accurate and up to date.
The automated doc-audit workflow (`.github/workflows/doc-audit.yml`) flags stale or broken
docs and assigns issues to the appropriate owner.

| File / Path | Owner | Review cadence |
|---|---|---|
| `AGENTS.md` | General Agent | On any agent/workflow change |
| `CLAUDE.md` | General Agent | On any skill file or routing change |
| `decisions.md` | General Agent | On any architectural decision |
| `.github/skills/economist-theme/SKILL.md` | Creative Director | On any design-system change |
| `.github/skills/jekyll-qa/SKILL.md` | QA Gatekeeper | On any CI/testing change |
| `.github/skills/editorial/SKILL.md` | Editorial Chief | On any content-workflow change |
| `.github/skills/general/SKILL.md` | General Agent | On any scope/workflow change |
| `.github/skills/git-operations/SKILL.md` | General Agent | On any git-workflow change |
| `.github/skills/github-issues-workflow/SKILL.md` | General Agent | On any issue-workflow change |
| `.github/skills/jekyll-development/SKILL.md` | QA Gatekeeper | On any dev-server change |
| `docs/` | Editorial Chief | Monthly |
| `README.md`, `GETTING_STARTED.md` | General Agent | On any setup change |
| `CHANGELOG.md` | General Agent | On every sprint |
| `ARCHITECTURE.md` | General Agent | On any structural change |

### Doc-Audit Automation

The `.github/workflows/doc-audit.yml` workflow runs every Monday at 08:00 UTC and performs:

**Structural checks:**
- All internal Markdown links in `*.md` files resolve to existing files
- All `bash` / `sh` code blocks in skill files reference known commands (`gh`, `bundle`, `npx`, `npm`, `git`, `bash`, `node`, `ruby`, `python3`, `jq`, `curl`)
- All file paths explicitly referenced in docs (`` `path/to/file` `` patterns) exist in the repo
- All workflow files referenced in docs exist in `.github/workflows/`

**Staleness checks:**
- Skill files not updated in > 90 days → flag for human review
- `AGENTS.md` agent roster labels match actual GitHub labels in the repo

When a check fails, the workflow files a GitHub issue with label `doc-debt` and `P2:medium`
so the correct owner can address it promptly.
