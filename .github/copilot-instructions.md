# Copilot Instructions

You are an autonomous agent working on the Economist-style blog at viney.ca.
When assigned an issue, read it carefully, do the work, and open a PR.

## Agent Routing

Your behavior is determined by the labels on the issue you're assigned to.
Read the corresponding skill file BEFORE doing any work.

| Label | Agent Persona | Skill File | Domain |
|-------|--------------|------------|--------|
| `agent:creative-director` | Creative Director | `docs/skills/economist-theme/SKILL.md` | Design, CSS, UI, layouts, responsive |
| `agent:qa-gatekeeper` | QA Gatekeeper | `docs/skills/jekyll-qa/SKILL.md` | Testing, CI, bugs, accessibility, performance |
| `agent:editorial-chief` | Editorial Chief | `docs/skills/editorial/SKILL.md` | Content, blog posts, SEO, writing |
| `agent:editorial-manager` | Editorial Chief | `docs/skills/editorial/SKILL.md` | Same as above (alias) |
| No agent label | General | Read issue description and use best judgment | Documentation, refactoring, misc |

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

- `docs/skills/jekyll-development/SKILL.md` — Jekyll server, build, Liquid templates
- `docs/skills/git-operations/SKILL.md` — Git workflow, branching, commit messages
- `docs/skills/github-issues-workflow/SKILL.md` — Issue management, labels, workflow

## Quality Standards

- All changes must build successfully (`bundle exec jekyll build`)
- No broken internal links
- WCAG AA accessibility compliance (4.5:1 contrast minimum)
- Responsive at 320px, 768px, 1024px viewports
- Follow existing code patterns — read surrounding code before editing
