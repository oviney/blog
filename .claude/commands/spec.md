---
description: Define what to build — create an approved spec (and issue when needed) before writing code
---

Invoke the `spec` skill first. It follows the upstream-aligned
`spec-driven-development` guide.

Begin by understanding what the user wants to build or fix. Produce a structured
spec that covers:
1. Objective and desired behaviour
2. Commands and validation steps
3. Project structure and likely files
4. Testing strategy
5. Boundaries, assumptions, and success criteria

If the work should be tracked in oviney/blog, invoke the
`github-issues-workflow` skill after the spec is clear and turn the approved spec
into a well-formed GitHub Issue with:
- Descriptive title using `feat:`, `fix:`, or `chore:`
- Clear problem statement and desired behaviour
- Testable acceptance criteria checklist
- Correct labels (type + agent label + priority)

Do not write code until the spec (and issue, if applicable) is approved.
