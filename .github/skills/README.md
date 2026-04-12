# Skills Index

Agent skill files provide structured, step-by-step guidance for common tasks. Copilot agents automatically load the relevant skill when a matching trigger is detected.

## Available Skills

| Skill | File | When to Use |
|---|---|---|
| **Code Review** | [`code-review/SKILL.md`](code-review/SKILL.md) | Reviewing PRs, evaluating code quality, providing structured 5-axis review feedback |
| **Economist Theme** | [`economist-theme/SKILL.md`](economist-theme/SKILL.md) | Adding styles, modifying SCSS, creating layouts, ensuring design consistency, visual regression testing |
| **Jekyll Development** | [`jekyll-development/SKILL.md`](jekyll-development/SKILL.md) | Starting the Jekyll server, making content changes, modifying layouts or styles, debugging server failures |
| **QA Gatekeeper** | [`jekyll-qa/SKILL.md`](jekyll-qa/SKILL.md) | PR reviews, monitoring the CI pipeline, verifying deployments, diagnosing test failures, closing issues |
| **Git Operations** | [`git-operations/SKILL.md`](git-operations/SKILL.md) | Committing changes, creating feature branches, pushing to remote, reviewing uncommitted work |
| **GitHub Issues Workflow** | [`github-issues-workflow/SKILL.md`](github-issues-workflow/SKILL.md) | Reporting bugs, triaging defects, tracking work through the Agile lifecycle |

## Template

To create a new skill, copy [`_template/SKILL.md`](_template/SKILL.md) into a new subdirectory and fill in the front matter and sections.

## Usage

Skills are referenced in the Copilot global instructions (`.github/copilot-instructions.md` or equivalent). The agent roster maps each domain to the relevant skill file:

| Domain | Agent | Skill |
|---|---|---|
| Design / CSS / UI | Creative Director | `economist-theme/SKILL.md` |
| Testing / CI / Bugs | QA Gatekeeper | `jekyll-qa/SKILL.md` |
| Writing / Posts | Editorial Chief | *(see editorial agent docs)* |
| Planning / GitHub Issues | Flow Orchestrator | *(see sprint-orchestrator docs)* |

See [`docs/agents/ROSTER.md`](../agents/ROSTER.md) for the full agent roster.
