---
description: Review before merge — evaluate a PR or diff across correctness, readability, architecture, security, and performance
---

Invoke `review` first. This workflow is backed by the upstream-aligned
`code-review-and-quality` guide, then add the local `code-review` skill.

For a given PR number or diff:
1. Fetch the diff: `gh pr diff <N> --repo oviney/blog`
2. Evaluate across five dimensions:
   - **Correctness** — does it do what the issue requires?
   - **Readability** — are naming, structure, and surrounding patterns easy to follow?
   - **Architecture** — does it follow existing patterns? No scope creep.
   - **Security** — no secrets, no unsafe Liquid, no new unreviewed dependencies
   - **Performance** — no obvious regressions in runtime, asset size, or CI cost
3. Layer in repo-specific checks where relevant (for example SCSS variables, WCAG AA, or agent-scope rules)
4. Summarise findings using the repo's 5-axis review format

Always check: does `bundle exec jekyll build` pass on the branch?
