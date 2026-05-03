---
name: general
description: 'General-purpose agent for cross-cutting tasks. Use when working on documentation, refactoring, shared config, AGENTS.md, decisions.md, or anything that does not belong to a specialised agent.'
version: 1.1.1
triggers:
  - No agent label on the issue
  - Cross-cutting or repo-wide change
  - Documentation update (not a blog post)
  - Refactoring or code cleanup
  - Shared config or tooling change
---

## Context

The General Agent handles issues that do not fall within the scope of any specialised agent.
It has the widest file access of all agents but operates with the strictest caution — every
change must be intentional, minimal, and fully validated.

**Production URL**: https://www.viney.ca  
**Repository**: oviney/blog  
**Main branch**: `main`

**Typical work:**
- Updating shared memory files (`AGENTS.md`, `decisions.md`, `CHANGELOG.md`)
- Refactoring scripts or workflows across agent domains
- Answering cross-cutting architectural questions
- Bootstrapping new infrastructure (new skill files, new workflows, new templates)

**When to hand off:**
- Issue touches only CSS/SCSS/layouts → hand off to Creative Director (`agent:creative-director`)
- Issue touches only tests/CI/accessibility → hand off to QA Gatekeeper (`agent:qa-gatekeeper`)
- Issue touches only blog posts/drafts/SEO → hand off to Editorial Chief (`agent:editorial-chief`)
- Issue is reader-journey / audience-fit / usability research → hand off to Audience Researcher (`agent:audience-researcher`)

## Step-by-Step Instructions

1. **Read the issue completely** — understand scope before touching any file.

2. **Identify affected files** — list every file you expect to change and confirm none are protected (see below).

3. **Create a feature branch**:
   ```bash
   git checkout -b docs/<short-description>
   # or: refactor/<short-description> | chore/<short-description>
   ```

4. **Make the smallest possible change** that fully satisfies the acceptance criteria.
   - Docs-only changes: create or edit Markdown files; no code changes required.
   - Refactoring: preserve all existing behaviour; add or update tests if the codebase has them.

5. **Validate the build**:
   ```bash
   bundle exec jekyll build
   ```
   The build **must** pass before opening a PR.

6. **Run scope check**:
   ```bash
   bash scripts/check-pr-scope.sh
   ```

7. **Commit with a conventional message**:
   ```
   docs: create general agent skill file
   refactor: extract shared utility function
   chore: update AGENTS.md general agent row
   ```

8. **Open a PR** that references the issue (`Closes #N`).

## Protected Files (never modify)

These files require human review. No agent — including the General Agent — may modify them:

| File | Reason |
|------|--------|
| `_config.yml` | Site-wide Jekyll configuration |
| `.github/CODEOWNERS` | Repository governance |
| `.github/copilot-instructions.md` | Agent routing rules |
| `Gemfile` / `Gemfile.lock` | Ruby dependency lockfile |
| `.github/agents/` | Agent automation internals |

## Agent Scope

**MAY touch**: any file not in the protected list above.

**Must exercise caution with**:
- `.github/workflows/` — workflow changes affect CI for everyone; test locally first
- `scripts/` — shell scripts run in CI; validate with `bash -n <script>` before committing
- `package.json` — dependency changes need explicit justification
- `_layouts/` — layout changes affect every page; visual-regression risk

**Must not overstep**: if a change belongs clearly to another agent domain, open a new issue
with the correct label instead of making the change yourself.

## Quality Standards

- `bundle exec jekyll build` must pass — no exceptions
- No broken internal links
- Markdown files must be valid (no unclosed front matter, no broken Liquid tags)
- Shell scripts must pass `bash -n <script>` (syntax check)
- PRs must be scoped to ≤ 30 files; split larger changes into multiple PRs
- Every PR must reference an issue (`Closes #N`)
- No new dependencies without explicit justification in the PR description

## Common Pitfalls

### Pitfall 1: Modifying protected files
**Problem**: Agent accidentally edits `_config.yml` or `Gemfile`.  
**Solution**: Check the protected file list above before every commit. Use `git diff --name-only` to review staged changes.

### Pitfall 2: Scope creep
**Problem**: While fixing one thing, the agent "improves" adjacent code.  
**Solution**: Make only the change described in the issue. Open separate issues for unrelated improvements.

### Pitfall 3: Breaking the build with Markdown changes
**Problem**: Malformed YAML front matter in a new `.md` file causes `jekyll build` to fail.  
**Solution**: Always run `bundle exec jekyll build` after creating or editing any Markdown file.

### Pitfall 4: Forgetting to update all references
**Problem**: A new skill file is created but routing tables in `AGENTS.md`, `CLAUDE.md`, or `.github/copilot-instructions.md` are not updated.  
**Solution**: Search for every location that lists skill files before opening the PR:
```bash
rg "agent:|planning-and-task-breakdown|github-issues-workflow|jekyll-qa|editorial|economist-theme" AGENTS.md CLAUDE.md .github/skills .github/copilot-instructions.md
```

## Related Files

- [`AGENTS.md`](../../../AGENTS.md) — agent roster and cross-agent conventions
- [`CLAUDE.md`](../../../CLAUDE.md) — repo-level AI agent context
- [`.github/copilot-instructions.md`](../../copilot-instructions.md) — agent routing rules
- [`decisions.md`](../../../decisions.md) — architectural decision log
- [`.github/skills/_template/SKILL.md`](./../_template/SKILL.md) — skill file template

## Success Criteria

- [ ] Feature branch created from latest `main`
- [ ] Only files listed in the issue acceptance criteria are modified
- [ ] No protected files touched
- [ ] `bundle exec jekyll build` passes
- [ ] `bash scripts/check-pr-scope.sh` passes
- [ ] PR references the issue (`Closes #N`)
- [ ] PR description explains what changed and why

## Version History

- **1.1.0** (2026-04-26): Removed references to nonexistent `.github/agents/` files and expanded the routing-update check to include `CLAUDE.md`
- **1.0.0** (2026-04-08): Initial skill creation — scope, protected files, quality standards, branching convention
