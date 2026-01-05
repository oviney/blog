# Blog Changelog

All notable changes to this blog are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

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
See [MIGRATION_LOG.md](./MIGRATION_LOG.md#rollback-plan) for complete rollback instructions.

### Documentation
- **Migration details**: [MIGRATION_LOG.md](./MIGRATION_LOG.md)
- **GitHub Actions setup**: [GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md)
- **Development workflow**: [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md)
- **Theme evaluation**: [THEME_EVALUATION.md](./THEME_EVALUATION.md)
