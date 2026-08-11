---
name: review-dead-css-deletion
description: How to verify a dead-CSS/dead-code deletion PR in this repo — compiled-CSS diff plus generated-_site grep, rather than trusting a source grep
metadata:
  type: feedback
---

For any PR that deletes "orphaned" CSS from `_sass/`, prove safety with **two build-based checks**, never a source-tree grep alone.

**Why:** `_sass/` is Sass, not CSS — selectors can be composed via nesting, `@use`d across modules (`home-2026.scss` does `@use 'economist-theme' as theme`), and classes can be emitted by Liquid, includes, pagination, or kramdown attribute lists (`{: .foo}`) that a naive grep of `_layouts/` misses. A source grep also cannot tell you whether the *cascade* changed for rules that remain.

**How to apply:**

1. **Reachability** — `bundle exec jekyll build`, then grep the *generated* `_site/**/*.html` for each deleted class. This catches Liquid-generated and paginated markup. Note pagination multiplies a single source file into many outputs (`blog/index.html` → `_site/blog/page2..5/`), so a backlog note saying "used by one file" undercounts real usage.
2. **Cascade** — build `main` and the branch, diff the two compiled `_site/assets/css/styles.css`. A **purely subtractive diff (lines removed, zero added or modified)** is proof that no surviving rule changed its properties, order, or media-query nesting. Any added/changed line means a rule was rehomed — e.g. a rule orphaned out of a media query that became empty.
3. Also diff the compiled *selector sets* (`grep -oE '^[^{}]*\{'`, sort, `comm`) to confirm the removed set is exactly the intended dead families and nothing incidental.
4. Remember there is a second stylesheet, `assets/css/custom.css`, outside the Sass pipeline — grep it too.

Related: [[review-legacy-class-retention]]
