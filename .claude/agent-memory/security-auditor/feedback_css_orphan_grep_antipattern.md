---
name: css-orphan-grep-antipattern
description: Verifying a deleted CSS class is orphaned requires matching class attributes in markup, not bare substring grep — repo prose is saturated with words like "homepage" and "scss"
metadata:
  type: feedback
---

When auditing a CSS/SCSS deletion, do not conclude "this class is still in use"
from a bare substring grep of the class name across the repo.

**Why:** This repo carries a very large docs/spec/tasks/skills surface
(`docs/`, `specs/`, `tasks/archive/`, `.github/skills/`, `AGENTS.md`, plus a
vendored `vendor/bundle/`). Generic tokens like `homepage`, `scss`, `main-content`
match hundreds of lines of English prose, test *names*, and archived planning
docs. During the PR #1203 audit a naive grep returned ~30 files for `homepage`
and ~30 for `scss`, all prose, and one hit in `_includes/post-card.html` that
turned out to be an HTML comment. This is the same shape as the substring-match
label-grep antipattern closed by #987 — the failure mode recurs in new domains.

**How to apply:**
- Restrict to markup that can actually carry the class: `_layouts/`, `_includes/`,
  `*.html`, and Liquid — and match the attribute form (`class="... foo ..."`),
  not the bare token.
- Exclude `_site/`, `vendor/`, `tasks/archive/`, and `docs/` from usage evidence;
  they prove nothing about live rendering.
- Check whether the deleted line was a *nested* rule or the standalone
  definition. In #1203 `.meta-separator` appeared in the deleted hunk but only as
  a rule nested inside a dead `.hero-post-meta` block; the real definition
  survived and still styles `_layouts/post.html`. Grepping the deleted hunk alone
  would have produced a false regression report.
- Confirm the SCSS still brace-balances after a large deletion; an unbalanced
  hunk is the one way a pure-deletion style PR can actually break the build.

Related: [[header-control-boundary]]
