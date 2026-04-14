---
description: Review before merge — evaluate a PR or diff across correctness, style, security, and accessibility
---

Invoke the code-review skill, then adopt the code-reviewer agent persona from .claude/agents/code-reviewer.md.

For a given PR number or diff:
1. Fetch the diff: `gh pr diff <N> --repo oviney/blog`
2. Evaluate across five dimensions:
   - **Correctness** — does it do what the issue requires?
   - **Style** — SCSS variables only, no hardcoded values, follows economist-theme conventions
   - **Architecture** — does it follow existing patterns? No scope creep.
   - **Security** — no secrets, no unsafe Liquid, no new unreviewed dependencies
   - **Accessibility** — WCAG AA contrast, semantic HTML, keyboard navigable
3. Categorise findings as MUST FIX / SHOULD FIX / CONSIDER
4. Post review comment on the PR or summarise findings

Always check: does `bundle exec jekyll build` pass on the branch?
