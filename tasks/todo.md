# TODO — Bump @playwright/test to ^1.60.0 + Page-Level ARIA Snapshots (#947)

**Spec:** [../SPEC.md](../SPEC.md) · **Plan:** [plan.md](plan.md)
**Plan SHA:** `6480f00` · 5 files (0 new + 5 modified) · 1 snapshot migration + 2 rationale comments

---

## Spec amendment to confirm before BUILD
- [x] **A1** AC-4 amendment accepted by user 2026-05-17 — `auto-regression.yml` verified by inspection (no Playwright runtime; `issues: labeled` trigger only). SPEC §3 AC-4 updated in place.

## Phase 1 — Version bump
- [x] **T1** ✅ Branch `feat/playwright-1.60-aria-snapshots` created. `package.json` pinned at `^1.60.0`. `npm install` clean (`changed 3 packages, 0 vulnerabilities`). `npm ls @playwright/test` → `1.60.0`; `playwright@1.60.0`; `playwright-core@1.60.0`. Lockfile diff bounded to the 3-package subtree (matches Dependabot #959 shape). Commit `3174891`.

## Phase 2 — Snapshot migration
- [x] **T2** ✅ `homepage.spec.ts:192` migrated to `expect(page).toMatchAriaSnapshot()`. Snapshot reduced to `- banner / - main / - contentinfo` landmark-presence smoke check. Navigation deliberately excluded (collapses to hamburger button on mobile; nav coverage stays in `navigation.spec.ts`). Inline comment documents trade-offs. Verified on Desktop/Mobile/Tablet Chrome + Desktop Firefox (Safari blocked locally by missing libwoff1/libavif16; CI has them). Full homepage.spec.ts: 11/11 pass on Desktop Chrome. Commit `73d0d8f`.
- [x] **T3** ✅ Two `// element-scoped: …` rationale comments added above `navigation.spec.ts:99` (article snapshot) and `:466` (mobile-nav-open snapshot). Both tests still pass. Commit `530b611`.

## Phase 3 — Docs
- [x] **T4** ✅ SKILL.md line 40 bumped to `^1.60.0` with release-feature summary; `test.abort()` availability sub-bullet added (line 41). Commit `6943275`.

## Phase 4 — Local verification
- [x] **T5** ✅ Three Playwright shards green on 4 projects (Safari skipped locally — missing libwoff1/libavif16 system libs; CI has them): Shard 1 70/70, Shard 2 44/44, Shard 3 38/38. Full Desktop Chrome sweep 105/105. AC-8 boundary clean: 5 feature files modified (SKILL.md, package.json, package-lock.json, homepage.spec.ts, navigation.spec.ts) + 6 lifecycle files (1 SPEC.md modified, 2 new tasks/*, 3 archived #958 artifacts) — none in the protected set (`_config.yml`, `Gemfile`, `Gemfile.lock`, `.github/CODEOWNERS`, `.github/copilot-instructions.md`).

## CHECKPOINT-A — Local gate before /review
- [x] ✅ All T1–T5 ACs satisfied. Working tree clean (only `specs/copilot-skills-agents-redesign-spec.md` untracked, unrelated). No protected files touched. Branch `feat/playwright-1.60-aria-snapshots` at HEAD `6943275` ready for /review.

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
