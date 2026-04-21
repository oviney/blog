---
description: Ship to production — commit, push, open a PR, and verify deployment on viney.ca
---

Invoke `ship` first. This workflow is backed by the upstream-aligned
`git-workflow-and-versioning` guide, then `git-operations`.

Follow the shipping checklist:
1. Confirm `bundle exec jekyll build` passes on the branch
2. Confirm all acceptance criteria from the issue are met
3. Create a PR using the structured repo template from `.github/skills/git-operations/SKILL.md` (include `Closes #N`)
4. If the PR changes `.github/skills/` or `.github/instructions/`, add the `governance-update` label immediately after opening it
5. If governance checks started before that label was present, push an empty commit so CI reruns with the updated PR labels
6. Wait for the PR checks to go green
7. Merge the PR: `gh pr merge <N> --repo oviney/blog --squash --delete-branch`
8. Watch the post-merge workflows on `main` (for example `CI Orchestrator` and `Deploy Jekyll site to Pages`)
9. Verify on production: `curl -sI https://www.viney.ca/ | grep HTTP`
10. Navigate to the affected URL on viney.ca and visually confirm the fix
11. Comment on the issue with production verification notes

Never merge a PR with a red CI check.
Admin-merge only when needed: `gh pr merge <N> --repo oviney/blog --admin --squash --delete-branch`
