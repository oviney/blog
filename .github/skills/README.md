# Skills Index

For direct/local agent work in this repo, the upstream `agent-skills` lifecycle
is the working backbone, with viney.ca blog skills layered on top where
repo-specific guidance is helpful.

Issue-assigned cloud agents still follow `.github/copilot-instructions.md`.
The upstream-aligned files in this directory are reference guides; the callable
skills in this environment are the local lifecycle skills such as `spec`,
`planning-and-task-breakdown`, `build`, `test`, `review`, and `ship`.

## Lifecycle Backbone

| Phase | Callable skill | Reference file | Notes |
|---|---|---|---|
| Define | **`spec`** | [spec-driven-development/SKILL.md](spec-driven-development/SKILL.md) | Define objective, commands, testing strategy, boundaries, and success criteria before code |
| Plan | **`planning-and-task-breakdown`** | [planning/SKILL.md](planning/SKILL.md) | Local file path retained for repo-specific planning context when needed |
| Build | **`build`** | [incremental-implementation/SKILL.md](incremental-implementation/SKILL.md) | Implement in thin, testable slices |
| Verify | **`test`** | [test-driven-development/SKILL.md](test-driven-development/SKILL.md) | Prove behavior with tests instead of assumptions |
| Review | **`review`** | [code-review-and-quality/SKILL.md](code-review-and-quality/SKILL.md) | Review across correctness, readability, architecture, security, and performance |
| Ship | **`ship`** | [git-workflow-and-versioning/SKILL.md](git-workflow-and-versioning/SKILL.md) | Keep work on short-lived branches with atomic commits |
| Discovery | **`using-agent-skills`** | [using-agent-skills/SKILL.md](using-agent-skills/SKILL.md) | Route work to the right lifecycle skill, then add blog-specific augmentations |

## Blog Augmentations

These skills remain valuable because they encode repo-specific workflows, constraints, and quality gates:

| Domain | Skill | File | Use for |
|---|---|---|---|
| Issue workflow | **GitHub Issues Workflow** | [github-issues-workflow/SKILL.md](github-issues-workflow/SKILL.md) | Filing, triaging, labeling, and tracking work on oviney/blog |
| Jekyll implementation | **Jekyll Development** | [jekyll-development/SKILL.md](jekyll-development/SKILL.md) | Dev server, Liquid, content/layout validation |
| QA and deployment checks | **Jekyll QA** | [jekyll-qa/SKILL.md](jekyll-qa/SKILL.md) | Playwright, CI, accessibility, deployment verification |
| Design system | **Economist Theme** | [economist-theme/SKILL.md](economist-theme/SKILL.md) | SCSS, layouts, responsive design, Economist-style UI |
| Editorial workflow | **Editorial** | [editorial/SKILL.md](editorial/SKILL.md) | Posts, SEO, writing, and content standards |
| Repo review conventions | **Code Review** | [code-review/SKILL.md](code-review/SKILL.md) | Blog-specific review expectations layered onto the upstream review skill |
| Repo git workflow | **Git Operations** | [git-operations/SKILL.md](git-operations/SKILL.md) | PR templates, issue linkage, and branch/PR conventions for this repo |
| Cross-cutting repo work | **General** | [general/SKILL.md](general/SKILL.md) | Shared docs, refactors, and misc repo-wide changes |
| Repo planning guardrails | **Planning** | [planning/SKILL.md](planning/SKILL.md) | Local file-count and scope-discipline rules for issue-driven work |

## Command Layer

The slash-command files under `.claude/commands/` map the user-facing workflow to this backbone:

- `/spec` → `spec` + `github-issues-workflow` when tracked repo work is needed
- `/plan` → `planning-and-task-breakdown`
- `/build` → `build` + the relevant blog domain skill
- `/test` → `test` + `jekyll-qa`
- `/review` → `review` + repo review conventions
- `/ship` → `ship` + `git-operations`

## Template

To create a new local skill, copy [_template/SKILL.md](_template/SKILL.md) into a new subdirectory and fill in the front matter and sections.
