---
description: Ship to production — commit, push, open a PR, and verify deployment on viney.ca
---

Invoke the git-operations skill.

Follow the shipping checklist:
1. Confirm `bundle exec jekyll build` passes on the branch
2. Confirm all acceptance criteria from the issue are met
3. Create a PR: `gh pr create --repo oviney/blog --title "..." --body "Closes #N"`
4. Wait for GitHub Actions to go green (CI Orchestrator + Deploy Jekyll)
5. Verify on production: `curl -sI https://www.viney.ca/ | grep HTTP`
6. Navigate to the affected URL on viney.ca and visually confirm the fix
7. Comment on the issue with production verification notes

Never merge a PR with a red CI check.
Admin-merge when needed: `gh pr merge <N> --repo oviney/blog --admin --squash --delete-branch`
