# CLAUDE.md — AI Agent Context for oviney/blog

This file provides context for AI agents (GitHub Copilot, Claude, etc.) invoked
directly in this repository. Read this first, then follow the references below.

---

## Agent Dispatch (the right way to work)

**Do not do the work yourself.** Route it:

1. File or identify a GitHub issue
2. Apply the correct agent label (see table below)
3. Assign to `@copilot`: `gh issue edit <N> --repo oviney/blog --add-assignee "@copilot"`
4. The cloud agent picks it up, reads the skill file, opens a PR
5. Admin-merge the PR: `gh pr merge <N> --repo oviney/blog --admin --squash --delete-branch`

**Reserve direct work for:** triage, orchestration, admin-merges, pipeline debugging,
and tasks that cannot be expressed as a GitHub issue.

---

## Agent Label → Skill File

| Label | Skill File | Domain |
|-------|-----------|--------|
| `agent:creative-director` | `.github/skills/economist-theme/SKILL.md` | CSS, SCSS, layouts, responsive |
| `agent:qa-gatekeeper` | `.github/skills/jekyll-qa/SKILL.md` | Tests, CI, bugs, accessibility |
| `agent:editorial-chief` | `.github/skills/editorial/SKILL.md` | Posts, drafts, SEO, writing |
| `agent:editorial-manager` | `.github/skills/editorial/SKILL.md` | Alias for editorial-chief |
| *(no label)* | Use best judgement | Docs, refactoring, misc |

Full roster and scope rules: [`AGENTS.md`](AGENTS.md)  
Full routing rules and hard boundaries: [`.github/copilot-instructions.md`](.github/copilot-instructions.md)

---

## Tech Stack

- **Jekyll 4.3.2** (Ruby 3.3) — static site, builds with `bundle exec jekyll build`
- **SCSS** — design system in `_sass/economist-theme.scss`, variables-only, never hardcode
- **Playwright** (TypeScript) — tests in `tests/playwright-agents/`, base URL `http://localhost:4000`
- **GitHub Actions** — CI in `.github/workflows/`, deploys to GitHub Pages on merge to `main`
- **Branch protection** — `main` requires 1 reviewer; use `--admin` to bypass as maintainer

---

## Protected Files (never modify)

`_config.yml` · `.github/CODEOWNERS` · `.github/copilot-instructions.md` · `Gemfile` · `Gemfile.lock`

---

## Key Commands

```bash
bundle exec jekyll build          # validate (run before every PR)
bundle exec jekyll serve --port 4000  # local dev server
npx playwright test               # run all tests (requires dev server)
bash scripts/validate-posts.sh --all  # validate front matter on all posts
```
