---
name: verify-defect-exists
description: Before crediting a "fix" branch, confirm the defect is actually present on origin/main — a test-only diff guarding an already-fixed bug is a regression guard, not a fix
metadata:
  type: feedback
---

When reviewing a branch framed as a single-defect fix, read the source on
`origin/main` first and confirm the defect is actually present there before
treating the diff as a fix.

**Why:** A diff can look like a fix while resolving nothing. If the bug was
already remediated on `main` (e.g. duplicate head SEO meta fixed by delegating
title/description/canonical solely to `{% seo %}` in `_layouts/default.html`),
a branch that adds only a guard test does NOT "fix the defect" — it is a forward
regression guard. Such a test also will NOT fail on `origin/main` (it passes,
because main is already clean), so it fails the "would fail on the old code"
criterion for a fix-validating test even though it is otherwise a real,
correctly-scoped guard (`toHaveCount(1)` without `.first()`).

**How to apply:** For fix-branch reviews, separate two questions: (1) does the
diff change behavior to resolve the bug? and (2) does any test demonstrate the
bug pre-fix? A test-only diff against an already-clean main answers "no" to both.
Approve it on its own merits as a regression guard if asked, but do not mark
`fixes_defect` or treat a non-failing-on-old-code test as fix-validating.
