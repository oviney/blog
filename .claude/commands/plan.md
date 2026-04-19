---
description: Plan how to build it — break a GitHub Issue into small, atomic tasks before writing any code
---

Invoke the `planning-and-task-breakdown` skill first.

If the plan is based on a GitHub issue, read the issue with
`gh issue view <N> --repo oviney/blog` first.

Then:
1. Identify dependencies and implementation order
2. Break the work into small, verifiable tasks
3. Map each task to likely files before any code is written
4. Keep task scope within the repo's file-count guardrails
5. Insert tasks into the session SQL `todos` table for tracking

Do NOT write any code until the user confirms the plan.
