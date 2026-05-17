# TODO — Bump @playwright/test to ^1.60.0 + Page-Level ARIA Snapshots (#947)

**Spec:** [../SPEC.md](../SPEC.md) · **Plan:** [plan.md](plan.md)
**Plan SHA:** `6480f00` · 5 files (0 new + 5 modified) · 1 snapshot migration + 2 rationale comments

---

## Spec amendment to confirm before BUILD
- [x] **A1** AC-4 amendment accepted by user 2026-05-17 — `auto-regression.yml` verified by inspection (no Playwright runtime; `issues: labeled` trigger only). SPEC §3 AC-4 updated in place.

## Phase 1 — Version bump
- [ ] **T1** Branch `feat/playwright-1.60-aria-snapshots` from clean `main`; edit `package.json` to `"@playwright/test": "^1.60.0"`; `npm install`; confirm `npm ls @playwright/test` reports `1.60.x`; confirm `package-lock.json` diff is bounded to the `@playwright/test` subtree.

## Phase 2 — Snapshot migration
- [ ] **T2** Rewrite `homepage.spec.ts:192` snapshot to `expect(page).toMatchAriaSnapshot(...)`; update test title to "Homepage page-level landmarks…"; `--update-snapshots` against live Jekyll server; manually review regenerated snapshot for dynamic-content drift, add `/.+/` placeholders as needed; re-run twice without `--update-snapshots` to confirm stability.
- [ ] **T3** Add two `// element-scoped: …` rationale comments above `navigation.spec.ts:96` and `:460`; do not modify the snapshot literals; re-run nav spec to confirm comments are benign.

## Phase 3 — Docs
- [ ] **T4** Edit `.github/skills/jekyll-qa/SKILL.md` line 40: `@playwright/test ^1.59.1` → `^1.60.0`; add `test.abort()` availability sub-bullet referencing #947.

## Phase 4 — Local verification
- [ ] **T5** `bundle exec jekyll serve` running; run shards 1, 2, 3 individually; run full `npx playwright test`; confirm AC-8 boundary — `git diff --name-only main...HEAD` returns exactly the 5 expected files.

## CHECKPOINT-A — Local gate before /review
- [ ] All T1–T5 ACs satisfied. Stable working tree. No protected files touched.

## Phase 5 — /review pass
- [ ] **T6** Code-reviewer agent brief: AC-3 rationale (2-of-3 element-scoped), page-level snapshot stability, AC-4 amendment, `test.abort()` documented-but-unused.
- [ ] **T7** Apply review revisions; commit. Hard rule: if revisions push the diff beyond 5 files, escalate to spec amendment rather than expand scope silently.

## Phase 6 — Ship
- [ ] **T8** `git push -u origin feat/playwright-1.60-aria-snapshots`; `gh pr create` with snapshot-diff narrative, AC-7 content (rationale + #959 supersedure + #944 unblock), `agent:qa-gatekeeper` label; **then** close Dependabot PR #959 with supersede comment.
- [ ] **T9** CI green — zero Playwright-shaped retries; one puppeteer Chrome-cache retry tolerated per #958 pattern (and only if stack matches).
- [ ] **T10** `gh pr merge --admin --squash --delete-branch` once green; `git switch main && git pull`; archive lifecycle artifacts under `tasks/archive/2026-05-17-playwright-1.60-947/`.

---

## Acceptance criteria checklist (mirrors SPEC §3)

- [ ] **AC-1** `package.json` pins `@playwright/test ^1.60.0`
- [ ] **AC-2** `package-lock.json` regenerated, `npm ls @playwright/test` reports `1.60.x`
- [ ] **AC-3** `homepage.spec.ts:192` migrated to page-level; `navigation.spec.ts:96` + `:460` carry `// element-scoped:` rationale comments
- [ ] **AC-4** *(amended)* `test-quality.yml` passes green on a single PR run; `auto-regression.yml` verified by inspection (no Playwright runtime)
- [ ] **AC-5** `npx playwright test` exits `0` locally with live Jekyll server
- [ ] **AC-6** `.github/skills/jekyll-qa/SKILL.md` line 40 → `^1.60.0` + `test.abort()` availability note
- [ ] **AC-7** PR description records snapshot rationale, #959 closure, #944 unblock
- [ ] **AC-8** `git diff --name-only main...HEAD` returns exactly 5 files (no protected-file diffs)
