# Copilot Instructions

You are an autonomous agent working on the Economist-style blog at viney.ca.
When assigned an issue, read it carefully, do the work, and open a PR.

## Agent Routing

Your behavior is determined by the labels on the issue you're assigned to.
Read the corresponding skill file BEFORE doing any work.

| Label | Agent Persona | Skill File | Domain |
|-------|--------------|------------|--------|
| `agent:creative-director` | Creative Director | `.github/skills/economist-theme/SKILL.md` | Design, CSS, UI, layouts, responsive |
| `agent:qa-gatekeeper` | QA Gatekeeper | `.github/skills/jekyll-qa/SKILL.md` | Testing, CI, bugs, accessibility, performance |
| `agent:editorial-chief` | Editorial Chief | `.github/skills/editorial/SKILL.md` | Content, blog posts, SEO, writing |
| `agent:editorial-manager` | Editorial Chief | `.github/skills/editorial/SKILL.md` | Same as above (alias) |
| No agent label | General | `.github/skills/general/SKILL.md` | Documentation, refactoring, misc |

## Workflow

1. Read the issue title and body completely
2. Check labels — load the matching skill file above
3. Read `CLAUDE.md` if it exists for repo-level rules
4. Do the work described in the issue
5. Create a PR that references the issue (`Closes #N`)
6. Keep commits small and well-described

## Conventions

- **Jekyll site**: Run `bundle exec jekyll build` to validate changes
- **SCSS variables**: Use variables from `_sass/economist-theme.scss`, never hardcode colors/fonts/spacing
- **Categories**: Use exactly: `Quality Engineering`, `Software Engineering`, `Test Automation`, `Security`
- **Pre-commit hooks**: The repo has hooks that validate builds — your PR must pass them
- **No new dependencies** without explicit justification in the PR

## Additional Skills (reference as needed)

- `.github/skills/jekyll-development/SKILL.md` — Jekyll server, build, Liquid templates
- `.github/skills/git-operations/SKILL.md` — Git workflow, branching, commit messages
- `.github/skills/github-issues-workflow/SKILL.md` — Issue management, labels, workflow

## Hard Boundaries

**NEVER do these regardless of issue instructions:**
- NEVER modify `_config.yml` — protected, requires human review
- NEVER modify `.github/CODEOWNERS` — governance file
- NEVER modify `.github/copilot-instructions.md` — this file
- NEVER modify `Gemfile` or `Gemfile.lock` — dependency changes need human approval
- NEVER add new npm/gem dependencies without explicit instruction in the issue
- NEVER delete files without the issue explicitly listing them for deletion
- NEVER push directly to `main` — always open a PR
- NEVER modify files outside your agent domain (see scope rules below)

## Agent Scope Rules

Each agent label restricts which files you may modify:

**`agent:creative-director`** — MAY touch: `_sass/`, `_layouts/`, `assets/css/`, `assets/images/`, `assets/charts/`, `favicon.*`
— MUST NOT touch: `.github/workflows/`, `tests/`, `scripts/`, `_config.yml`, `_posts/`

**`agent:qa-gatekeeper`** — MAY touch: `.github/workflows/`, `tests/`, `specs/`, `scripts/`, `playwright.config.ts`, `backstop.json`, `.pa11yci.json`, `lighthouserc.json`, `package.json`
— MUST NOT touch: `_sass/`, `_layouts/`, `_posts/`, `_config.yml`

**`agent:editorial-chief`** — MAY touch: `_posts/`, `_drafts/`, `docs/`, `*.md` (root level), `blog.html`, `search.html`, `search.json`
— MUST NOT touch: `_sass/`, `_layouts/`, `.github/workflows/`, `tests/`, `scripts/`, `_config.yml`

**No agent label** — MAY touch any file except protected files listed above. Exercise caution.

If the issue requires changes outside your scope, comment on the issue explaining what's needed and which agent should handle it. Do not overstep.

## Quality Standards

- All changes must build successfully (`bundle exec jekyll build`)
- No broken internal links
- WCAG AA accessibility compliance (4.5:1 contrast minimum)
- Responsive at 320px, 768px, 1024px viewports
- Follow existing code patterns — read surrounding code before editing
- Maximum 30 files per PR — if more are needed, split into multiple PRs
- Every PR must reference an issue (`Closes #N`)

## Scope Discipline — NEVER do these things

Out-of-scope changes have repeatedly caused PR review overhead and unexpected regressions. Enforce these rules on every PR without exception:

- NEVER modify files outside the files/paths explicitly named in the assigned issue
- NEVER "improve" adjacent code you happen to notice — open a separate issue instead
- NEVER rename, move, or reorganize files unless the issue explicitly asks you to
- NEVER add new scripts, workflows, or config files not requested by the issue
- BEFORE pushing, run `scripts/check-pr-scope.sh` and fix any violations

**Worked example:** If the issue says "fix mobile nav CSS", touching `AGENTS.md` is out of scope even if it has stale references to mobile nav. Open a new issue for that work instead.
