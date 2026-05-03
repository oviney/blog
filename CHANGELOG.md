# Blog Changelog

All notable changes to this blog are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Top Five Improvements — April 8, 2026 (last 12 hours)

1. **Editorial quality gate added to CI** (PR #668) — A new `validate-posts.sh`
   script and a `validate-editorial` CI job now run on every pull request.
   The gate rejects posts with missing required front-matter fields (`layout`,
   `title`, `date`, `author`, `categories`, `image`), broken image paths, or
   future-dated content — preventing downstream HTML-Proofer failures before
   they can reach `main`.

2. **Copilot code review required before orchestrator merges** (PR #671) — The
   CI orchestrator merge gate now refuses to merge any agent PR unless the
   `Copilot code review` check has concluded with `success`. Previously a
   `neutral`, `skipped`, or absent run would still pass the `allRunsPass`
   guard. Adding a new required check in future is a one-line change to the
   `REQUIRED_CHECKS` constant.

3. **Agent scope rules enforced as a required CI status check** (PR #663) — A
   new `check-agent-scope` job in `test-build.yml` runs `check-pr-scope.sh`
   with the PR's labels on every pull request. Agent-labelled PRs that touch
   files outside their permitted paths now fail CI with an explicit
   `VIOLATION [agent-scope/]` message instead of relying solely on a
   bypassable pre-commit hook.

4. **General Agent skill file created, completing the agent roster** (PR #669)
   — The General Agent was the only agent without a formal skill file. The new
   `.github/skills/general/SKILL.md` documents scope, protected files,
   handoff triggers, quality standards, and common pitfalls. Routing tables in
   `AGENTS.md` and `.github/copilot-instructions.md` now reference the skill
   file instead of the placeholder "use best judgment."

5. **Hotfix: 43 HTML-Proofer CI failures resolved** (PR #664) — The
   concealed-price-tag post referenced an image file
   (`concealed-price-tag-test-automation.png`) that was never created, causing
   43 image-check failures across the site on every CI run. The broken path was
   replaced with an existing, thematically appropriate asset
   (`testing-tax-shifted-costs.png`).

### Fixed - January 5, 2026
- **Issue #33**: Blog layout now matches Economist design system
  - Single-column layout with 1040px max-width (centered)
  - Typography hierarchy: titles 1.75rem, excerpts 1.0625rem
  - Economist-style date format (Jan 2nd 2026 | X min read)
  - Horizontal card layout with 48-64px vertical spacing
  - 280px images with 16:9 aspect ratio
  - Default gray gradient SVG for posts without images
  - Responsive breakpoints: 1024px, 768px, 320px
  - Commit: 60b6aac

### Changed - December 31, 2025
- **BREAKING**: Migrated from GitHub Pages automatic build to GitHub Actions custom workflow
- **BREAKING**: Upgraded Jekyll from 3.10.0 to 4.3.2
- Migrated theme from Cayman to Minimal Mistakes v4.27.3
- Updated all post layouts from `post` to `single`
- Removed `github-pages` gem dependency
- Updated Gemfile with explicit Jekyll 4.x and Minimal Mistakes plugins

### Added - December 31, 2025
- GitHub Actions workflow for Jekyll 4.x build and deployment
- Minimal Mistakes theme with author profiles, TOC, social sharing
- Playwright MCP Bridge configuration for automated browser tasks
- Author profile with bio, location, and social links
- Post defaults: reading time, related posts, social sharing buttons
- Table of contents on all posts (sticky sidebar)
- Documentation: MIGRATION_LOG.md, GITHUB_ACTIONS_SETUP.md updates
- Remote theme support via `jekyll-remote-theme`

### Deprecated - December 31, 2025
- GitHub Pages automatic build (replaced by GitHub Actions)
- Cayman theme (replaced by Minimal Mistakes)
- Local `jekyll serve` workflow (pre-commit validation sufficient)

### Configuration Changes
```yaml
# Theme
remote_theme: "mmistakes/minimal-mistakes@4.27.3"
minimal_mistakes_skin: "default"

# New plugins
plugins:
  - jekyll-include-cache  # Required for Minimal Mistakes
  - jekyll-paginate
  - jekyll-sitemap
  - jekyll-gist
  - jemoji

# Author configuration
author:
  name: "Ouray Viney"
  bio: "Quality Engineering leader with 20+ years experience"
  links: [GitHub, LinkedIn]
```

### Repository Settings Required
- **Action Required**: Change Pages source from "Deploy from a branch" to "GitHub Actions"
- Location: https://github.com/oviney/blog/settings/pages
- Can be automated with Playwright MCP Bridge (configured)

## [Previous] - Before December 31, 2025

### Theme & Build
- Jekyll 3.10.0 via github-pages gem
- Cayman theme
- GitHub Pages automatic build
- Pre-commit validation hook

### Content
- 4 blog posts published
- About page
- Software Engineering and Test Automation topic pages
- Google Analytics enabled (G-GTFG819MNS)
- AI disclosure policy documented

### Workflow
- Pre-commit hook validates Jekyll builds
- GitHub Pages automatic deployment
- Blog QA agent integration
- Git-based publishing workflow

---

## Migration Impact

### What Changed for Authors
- Post front matter now uses `layout: single` instead of `layout: post`
- Must add `author: Ouray Viney` to front matter
- Can enable/disable features per post: `toc`, `share`, `related`

### What Changed for Deployment
- Deployment method: GitHub Pages automatic → GitHub Actions workflow
- Build time: ~1-2 minutes (similar)
- Build visibility: Full logs in Actions tab (improved debugging)
- Plugin support: Limited → Unlimited (all Jekyll plugins allowed)

### What Stayed the Same
- Domain: www.viney.ca
- Git-based workflow: commit and push
- Pre-commit validation
- Deployment target: GitHub Pages CDN
- Custom domain (CNAME)
- Google Analytics tracking

---

## Notes

### Rollback Procedure
For rollback guidance, use the deployment workflow history in [`.github/workflows/jekyll.yml`](./.github/workflows/jekyll.yml) together with the current process notes in [`docs/DEVELOPMENT_WORKFLOW.md`](./docs/DEVELOPMENT_WORKFLOW.md).

### Documentation
- **Architecture overview**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Development workflow**: [docs/DEVELOPMENT_WORKFLOW.md](./docs/DEVELOPMENT_WORKFLOW.md)
- **Current platform state**: [docs/CURRENT_STATE.md](./docs/CURRENT_STATE.md)
- **Theme implementation details**: [`.github/skills/economist-theme/SKILL.md`](./.github/skills/economist-theme/SKILL.md)
