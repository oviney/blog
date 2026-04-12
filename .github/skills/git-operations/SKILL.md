---
name: git-operations
description: 'Git workflow conventions for this repo. Use when committing, branching, creating PRs, resolving merge conflicts, or pushing changes.'
version: 1.1.0
triggers:
  - Committing code changes
  - Creating feature branches
  - Pushing to remote repository
  - Checking git status
  - Reviewing uncommitted changes
  - Opening or updating pull requests
  - Resolving merge conflicts
  - Cleaning up stale branches
---

## Context

This repository uses Git for version control with a main branch deployment strategy. Changes are committed locally, pushed to GitHub, and automatically deployed via GitHub Actions.

**Repository**: oviney/blog  
**Main Branch**: `main`  
**Remote**: https://github.com/oviney/blog

**Commit Convention**: Use conventional commit format:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - CSS/design changes
- `refactor:` - Code restructuring
- `test:` - Test additions/changes
- `chore:` - Maintenance tasks

## Step-by-Step Instructions

### 1. Check Status Before Committing

```bash
cd /Users/ouray.viney/code/economist-blog-v5
git status
```

**Review**:
- Red files = unstaged (not added)
- Green files = staged (ready to commit)
- Untracked files = new files not in git

### 2. Review Changes

```bash
# View all changes
git diff

# View staged changes only
git diff --cached

# View specific file changes
git diff path/to/file
```

### 3. Stage Files

```bash
# Stage specific files
git add path/to/file1 path/to/file2

# Stage all changes in directory
git add .github/skills/

# Stage all changes
git add .
```

### 4. Commit Changes

```bash
# Standard commit
git commit -m "feat: add Claude Skills persistence architecture"

# Multi-line commit with description
git commit -m "feat: implement defect tracking dashboard" -m "- Created GitHub Projects board
- Added bug issue template
- Set up labels for priority and components"
```

**Commit Message Best Practices**:
- Start with conventional commit prefix
- Use imperative mood ("add" not "added")
- Keep first line under 72 characters
- Add detailed description in second message if needed

### 5. Push to Remote

```bash
# Push to main branch
git push origin main

# Push new branch
git push -u origin feature-branch-name
```

### 6. Verify Push

- Check GitHub Actions: https://github.com/oviney/blog/actions
- Wait for deployment (~1-2 minutes)
- Verify on production: https://www.viney.ca/

## Common Pitfalls

### Pitfall 1: Committing Without Reviewing Changes
**Problem**: Accidentally commit unwanted files or sensitive data  
**Solution**: Always run `git status` and `git diff` before committing  
**Prevention**: Use `git add` for specific files, not `git add .` blindly

### Pitfall 2: Vague Commit Messages
**Problem**: Messages like "fix stuff" or "updates" that don't explain what changed  
**Solution**: Write clear, descriptive messages following conventional commit format  
**Example**: "feat: add priority labels to bug tracker" instead of "updates"

### Pitfall 3: Forgetting to Pull Before Push
**Problem**: Push rejected because remote has changes you don't have  
**Solution**: Pull first if working with others: `git pull origin main`  
**Note**: For solo projects, this is less common

### Pitfall 4: Pushing Directly to Main Without Testing
**Problem**: Broken code deployed to production  
**Solution**: Pre-commit hook validates builds locally before commit  
**Reminder**: Never use `--no-verify` to bypass checks

### Pitfall 5: Large Binary Files
**Problem**: Accidentally committing large images, videos, or generated files  
**Solution**: Check file sizes before committing. Use [`.gitignore`](../../.gitignore) for build artifacts  
**Example**: Don't commit `_site/`, `node_modules/`, `.DS_Store`

## Code Snippets/Patterns

### Standard Commit Workflow

```bash
cd /Users/ouray.viney/code/economist-blog-v5

# Check what changed
git status
git diff

# Stage specific changes
git add .github/skills/ docs/AI_CODING_GUIDELINES.md

# Commit with descriptive message
git commit -m "feat: implement Claude Skills persistence architecture"

# Push to remote
git push origin main
```

**When to use**: Every code change

### Feature Branch Workflow

```bash
# Create and switch to new branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: implement new feature"

# Push branch to remote
git push -u origin feature/new-feature

# Create PR on GitHub, then merge
```

**When to use**: Large features that need review before merging

### PR Body Template

Every pull request must include a structured description. Use this template:

```markdown
## Summary

One-sentence description of what this PR does.

## Changes

- Bullet list of each meaningful change

## Testing

- [ ] `bundle exec jekyll build` passes
- [ ] Playwright tests pass (if applicable)
- [ ] Manually verified at target viewports (320 px, 768 px, 1024 px)

## Screenshots

(Attach before/after screenshots for any visual change)

Closes #<issue-number>
```

**Rules**:
- Always reference the issue with `Closes #N` so GitHub auto-closes it on merge
- Keep the summary line under 100 characters
- List every file category touched (posts, styles, tests, scripts)

### Rebase vs Merge

Use **rebase** to keep a clean, linear history. Use **merge** only when explicitly
required (e.g., combining long-lived branches with independent history).

```bash
# Preferred: rebase your branch onto the latest main
git fetch origin main
git rebase origin/main

# If conflicts arise during rebase
# 1. Fix the conflicting files
# 2. Stage the resolved files
git add path/to/resolved-file
# 3. Continue the rebase
git rebase --continue

# Abort a rebase if things go wrong
git rebase --abort
```

**When to use merge instead**:
- The branch has been shared with other contributors who have based work on it
- You need to preserve the full branch history for audit purposes

```bash
# Merge (only when rebase is inappropriate)
git fetch origin main
git merge origin/main
```

**Conflict resolution checklist**:
1. Run `git status` to see which files have conflicts
2. Open each file and look for `<<<<<<<`, `=======`, `>>>>>>>` markers
3. Resolve to the correct content and remove all markers
4. Stage resolved files with `git add`
5. Complete with `git rebase --continue` (rebase) or `git commit` (merge)
6. Run `bundle exec jekyll build` to verify the resolved code builds

### Branch Cleanup

Delete merged branches promptly to keep the repository tidy.

```bash
# Delete a local branch after merge
git branch -d feature/old-branch

# Delete the corresponding remote branch
git push origin --delete feature/old-branch

# Prune remote-tracking references that no longer exist
git fetch --prune
```

**Bulk cleanup** (remove all local branches already merged into main):

```bash
git checkout main
git branch --merged main | grep -v '^\*\|main' | xargs git branch -d
```

**Rules**:
- Never delete `main`
- Delete feature branches within 24 hours of merge
- Use `git branch -d` (safe delete) not `git branch -D` (force delete) unless intentional

### Zero CI Checks Recovery

When a PR shows **0 CI checks** (no status checks triggered), push an empty
commit to re-trigger the pipeline:

```bash
git commit --allow-empty -m "ci: trigger pipeline rerun"
git push
```

**Common causes of zero checks**:
- PR opened from a shallow clone that GitHub Actions cannot diff
- Branch protection rules updated after the PR was opened
- Workflow file syntax error preventing the workflow from loading
- Race condition when the PR was created immediately after a force-push

**When to use**: The PR page shows "0 checks" or "Waiting for status to be reported"
and no workflow run appears under the Actions tab for the head SHA.

### Undo Last Commit (Before Push)

```bash
# Keep changes, undo commit
git reset --soft HEAD~1

# Discard changes and commit
git reset --hard HEAD~1
```

**When to use**: Made a mistake in last commit, haven't pushed yet

### Check Commit History

```bash
# View recent commits
git log --oneline -10

# View commits with file changes
git log --stat

# View specific file history
git log --follow path/to/file
```

**When to use**: Review what was changed and when

### Stash Changes Temporarily

```bash
# Save uncommitted changes
git stash

# Apply stashed changes
git stash pop

# List all stashes
git stash list
```

**When to use**: Need to switch context without committing

## Related Files

- [`.gitignore`](../../.gitignore) - Files excluded from git
- [`.git/hooks/pre-commit`](../../.git/hooks/pre-commit) - Pre-commit validation script
- [`docs/DEVELOPMENT_WORKFLOW.md`](../DEVELOPMENT_WORKFLOW.md) - Full development workflow
- [`.github/workflows/jekyll.yml`](../../.github/workflows/jekyll.yml) - CI/CD pipeline

## Success Criteria

- [ ] Changes reviewed with `git status` and `git diff`
- [ ] Only relevant files staged
- [ ] Commit message follows conventional format
- [ ] Pre-commit hook passed (if applicable)
- [ ] Push successful
- [ ] GitHub Actions build passed
- [ ] Changes visible on production (if applicable)

## Version History

- **1.1.0** (2026-04-12): Add PR body template, rebase vs merge guidance, branch cleanup, zero CI checks recovery
- **1.0.0** (2026-01-05): Initial git operations skill creation
