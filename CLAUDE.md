# CLAUDE.md — AI Agent Context for oviney/blog

This file provides context for AI agents (GitHub Copilot, Claude, etc.) invoked
directly in this repository. Read this first, then follow the references below.

---

## Lifecycle Backbone

For direct/local agent sessions in this repo, use the upstream `agent-skills`
lifecycle as the working backbone. In this runtime, agents should invoke the
callable local lifecycle skills first, then use the upstream-aligned reference
guides in `.github/skills/` plus any viney.ca blog skill needed for repo-specific
constraints and conventions.

Issue-assigned cloud agents still follow the label-first routing in
`.github/copilot-instructions.md`; this file describes the lifecycle backbone for
local/direct execution and command-driven workflows in the repo.

| Phase | Default backbone | Add local augmentation when needed |
|-------|------------------|------------------------------------|
| **DEFINE** | `spec` | `github-issues-workflow` if the work should become a tracked GitHub issue |
| **PLAN** | `planning-and-task-breakdown` | Add repo planning context only when issue-specific ordering or decomposition needs local guidance |
| **BUILD** | `build` | `jekyll-development`, `economist-theme`, or `editorial` depending on domain |
| **VERIFY** | `test` | `jekyll-qa` for Playwright/CI/a11y/perf validation |
| **REVIEW** | `review` | `code-review` for repo-specific review standards |
| **SHIP** | `ship` | `git-operations` for repo PR and deployment workflow |

---

## GitHub Issue Routing

For non-trivial work on oviney/blog, prefer tracked GitHub Issues:

1. Define the work with `/spec`
2. Create or identify the GitHub issue
3. Apply the correct agent label (see table below)
4. Assign to `@copilot`: `gh issue edit <N> --repo oviney/blog --add-assignee "@copilot"`
5. The cloud agent picks it up, reads the relevant skill files, and opens a PR
6. Admin-merge when appropriate: `gh pr merge <N> --repo oviney/blog --admin --squash --delete-branch`

**Reserve direct work for:** triage, orchestration, admin-merges, pipeline debugging,
and tasks that cannot be expressed cleanly as a GitHub issue.

**Governance-surface reminder:** PRs that intentionally modify `.github/skills/`
or `.github/instructions/` should carry the `governance-update` label so the repo
scope guard treats them as deliberate governance work.

---

## Local Agent Labels

| Label | Skill File | Domain |
|-------|-----------|--------|
| `agent:creative-director` | `.github/skills/economist-theme/SKILL.md` | CSS, SCSS, layouts, responsive |
| `agent:qa-gatekeeper` | `.github/skills/jekyll-qa/SKILL.md` | Tests, CI, bugs, accessibility |
| `agent:editorial-chief` | `.github/skills/editorial/SKILL.md` | Posts, drafts, SEO, writing |
| `agent:editorial-manager` | `.github/skills/editorial/SKILL.md` | Alias for editorial-chief |
| *(no label)* | `.github/skills/general/SKILL.md` | Docs, refactoring, misc |

Full roster and repo conventions: [`AGENTS.md`](AGENTS.md)  
Routing rules and hard boundaries: [`.github/copilot-instructions.md`](.github/copilot-instructions.md)

---

## Tech Stack

- **Jekyll 4.3.2** (Ruby 3.3) — static site, builds with `bundle exec jekyll build`
- **SCSS** — design system in `_sass/economist-theme.scss`, variables-only, never hardcode
- **Playwright** (TypeScript) — tests in `tests/playwright-agents/`, base URL `http://localhost:4000`
- **GitHub Actions** — CI in `.github/workflows/`, deploys to GitHub Pages on merge to `main`
- **Branch protection** — `main` requires 1 reviewer; use `--admin` to bypass as maintainer

---

## Protected Files (never modify)

`_config.yml` · `AGENTS.md` · `ARCHITECTURE.md` · `.github/CODEOWNERS` · `.github/copilot-instructions.md` · `Gemfile` · `Gemfile.lock`

---

## Key Commands

```bash
bundle exec jekyll build               # validate (run before every PR)
bundle exec jekyll serve --port 4000   # local dev server
npx playwright test                    # run all tests (requires dev server)
bash scripts/validate-posts.sh --all   # validate front matter on all posts
```
