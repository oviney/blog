---
description: Simplify working code or docs without changing behavior — keep the diff small, preserve repo conventions, and verify with the real local commands
---

Use the `code-simplification` reference guide for the detailed checklist.

Use this workflow after a change is correct but heavier, noisier, or harder to review than it should be.

1. Read the affected files plus one nearby example before refactoring
2. Simplify only the code or docs inside the approved scope
3. Preserve exact behavior, commands, and guardrails
4. Verify with `bundle exec jekyll build` and the smallest relevant existing repo command (`npm run test:security`, `npm run test:playwright`, `npm run test:a11y`, or `npm run test:lighthouse`)
5. Run `bash scripts/check-pr-scope.sh`, or `PR_LABELS=governance-update bash scripts/check-pr-scope.sh` when the change touches `.github/skills/` or `.github/instructions/`

Do not mix simplification with new feature behavior.
