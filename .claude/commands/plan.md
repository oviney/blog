---
description: Plan how to build it — break a GitHub Issue into small, atomic tasks before writing any code
---

Invoke the planning skill.

Read the GitHub Issue number the user provides (or ask for it). Then:
1. Fetch the issue with `gh issue view <N> --repo oviney/blog`
2. Identify which agent label applies and which skill file to read
3. Break the work into atomic tasks (each task = one logical change, one commit)
4. Present the task list with estimated effort (S/M/L) before starting
5. Insert tasks into the session SQL todos table for tracking

Do NOT write any code until the user confirms the plan.
