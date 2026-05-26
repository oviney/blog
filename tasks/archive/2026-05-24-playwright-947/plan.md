# Plan — Bump @playwright/test to ^1.60.0 + Page-Level ARIA Snapshots (#947)

**Spec:** _(archived)_
**Issue:** [#947](https://github.com/oviney/blog/issues/947)
**Date:** 2026-05-17
**Lifecycle phase:** PLAN
**Plan SHA:** `6480f00`

---

## Anchors confirmed at this SHA

- **Current pin:** `package.json` line referencing `"@playwright/test": "^1.59.1"` (devDependencies section).
- **ARIA-snapshot call-sites:** exactly 3, audited via `grep -rn "toMatchAriaSnapshot" tests/`.
  - `tests/playwright-agents/homepage.spec.ts:192` — `page.locator('main').first()` → **migrate to page-level** (per SPEC §1 table).
  - `tests/playwright-agents/navigation.spec.ts:96` — `page.locator('main article').first()` → **keep element-scoped**, add rationale comment.
  - `tests/playwright-agents/navigation.spec.ts:460` — `page.locator('#site-navigation')` → **keep element-scoped**, add rationale comment.
- **Skill doc edit point:** `.github/skills/jekyll-qa/SKILL.md:40` reads `` - `@playwright/test ^1.59.1` ``. Surrounding lines 41-43 list `pa11y-ci`, `lighthouse`, `lodash override` — the `test.abort()` note belongs after line 40 as a sub-bullet.
- **Open Dependabot PR #959** mutates exactly `package.json` (+1/-1) and `package-lock.json` (+12/-12). CI is **green** on its current head. We will close it as part of T8 once our PR opens — not earlier (per SPEC §10 "ask first / never do" — closing late avoids a window with no PR open for the bump).
- **No `tests/playwright-agents/footer.spec.ts` exists** — `ls tests/playwright-agents/*footer*` returns nothing. SPEC §1 already records this. No new file is added by this PR.
- **`.github/workflows/auto-regression.yml`** triggers on `issues: labeled` (line 3-5) and does **not** run `npm ci` or `npx playwright test` (only `git add tests/playwright-agents/regression/` at line 147). See **Spec Amendment Proposal** below.

---

## Spec Amendment Proposal — AC-4 (raise before BUILD)

**SPEC §3 AC-4 currently reads:** *"`.github/workflows/test-quality.yml` AND `.github/workflows/auto-regression.yml` pass green on a single PR run."*

**Problem:** `auto-regression.yml` triggers exclusively on `issues: labeled` events (specifically when `production` or `bug` is applied to an issue already carrying the other label). It does not run on `pull_request` or `push` — it physically cannot fire on this PR. It also does not install or invoke Playwright; it only generates new test scaffolding files and commits them. The Playwright minor bump has **zero runtime impact** on this workflow.

**Proposed amendment to AC-4:** *"`.github/workflows/test-quality.yml` passes green on a single PR run. `auto-regression.yml` is verified by inspection (it does not install or run Playwright at runtime; it only writes test files that depend on the lockfile-installed version, which is exercised by test-quality.yml shards). No retry tolerated for Playwright-shaped failures; one retry tolerated for the puppeteer Chrome-cache flake pattern from #958."*

**Decision needed before BUILD:** confirm this amendment, or specify an alternate verification path (e.g., labeling a sentinel issue post-merge to fire the workflow once). My recommendation: accept the amendment — adding `workflow_dispatch` to `auto-regression.yml` would be scope creep, and labeling a sentinel issue produces a real PR that we'd then have to clean up.

---

## Context

5 files net at most (per SPEC AC-8): `package.json`, `package-lock.json`, `tests/playwright-agents/homepage.spec.ts`, `tests/playwright-agents/navigation.spec.ts`, `.github/skills/jekyll-qa/SKILL.md`. Well under the 15-file scope-explosion limit; **no `bulk-content` label needed**.

The risk profile is dominated by **snapshot drift on the migrated test**. Element-scoped `main` snapshot today is 22 lines; page-level will include `banner`, `navigation`, and `contentinfo` landmarks above and below the existing `main` block. The exact text is something Playwright generates via `--update-snapshots` and we review. The plan accommodates a non-trivial diff in `homepage.spec.ts:192` — that's the expected outcome, not a regression.

There is no separate baseline file to manage; ARIA snapshots are **inline template literals** in the spec file. `--update-snapshots` rewrites the literal in place. Git diff carries the entire change.

The migration is one-directional (page-level is strictly more inclusive than element-scoped); if the new snapshot is unstable we narrow it back rather than reverting the API form.

---

## Dependency graph

```
T1 (bump @playwright/test ^1.60.0 in package.json + regenerate package-lock.json)
  │
  ├──► T2 (homepage.spec.ts:192 → page-level snapshot, regenerate baseline, review diff)
  │       │
  │       ▼
  │     (proves the new API works against a live Jekyll server)
  │
  ▼
T3 (navigation.spec.ts:96 + :460 → add `// element-scoped: …` rationale comments)
  │
  ▼
T4 (.github/skills/jekyll-qa/SKILL.md line 40 → ^1.60.0 + test.abort() note)
  │
  ▼
T5 (local full sweep: npx playwright test against bundle exec jekyll serve; AC-8 boundary check)
  │
  ▼
CHECKPOINT-A — local gate (all 5 files modified within scope, full Playwright suite green locally)
  │
  ▼
T6 (/review via code-reviewer agent — focus on snapshot diff legibility, AC-3 rationale soundness)
  │
  ▼
T7 (apply review revisions; commit)
  │
  ▼
T8 (push branch; close Dependabot PR #959 with supersede comment; open PR with snapshot-diff narrative + AC-7 narrative)
  │
  ▼
T9 (CI passes — test-quality.yml all shards green; one puppeteer-cache retry tolerated, zero Playwright-shaped retries)
  │
  ▼
T10 (admin-merge after CI green; sync local main)
```

T1 is the prerequisite for everything (the new API surface only exists post-bump). T2 is the only behavior-changing edit; the rest is documentation + comments. T5 is the local gate. T6 is the lifecycle review-phase requirement. There is no post-merge verification task — unlike #958 (which needed real-CI cache logs), all #947 ACs are observable on the PR itself.

---

## Phase 1 — Version bump

### T1 — Bump `@playwright/test` to `^1.60.0`

**ACs satisfied:** AC-1 (pin), AC-2 (lockfile regen)
**Touches:** `package.json`, `package-lock.json`

**Steps:**

1. From a clean working tree, branch off `main`: `git switch -c feat/playwright-1.60-aria-snapshots`. (Branch name follows the prefix convention of recent PRs: `feat/…`, `chore/…`.)
2. Edit `package.json`: change the `"@playwright/test": "^1.59.1"` line to `"@playwright/test": "^1.60.0"`. Do not touch any other field.
3. Run `npm install` (not `npm ci` — the lockfile is mid-regeneration). Confirm `node_modules/@playwright/test/package.json` reports `"version": "1.60.x"`.
4. Run `npm ls @playwright/test` → expect a `1.60.x` line. No `UNMET` or peer-dep warnings introduced.
5. Verify the lockfile diff is bounded: `git diff --stat package-lock.json` should show changes confined to `@playwright/test` and its hoisted deps (playwright core, playwright-core). Any drift outside that subtree gets investigated before T2 — a broader lockfile rewrite indicates an npm version mismatch with whoever last regenerated the lockfile, and we'd want a clean `--prefer-offline` re-install to match.

**Verify (mechanical):**
- `grep -c '"@playwright/test": "\^1.60' package.json` → `1`
- `npm ls @playwright/test 2>&1 | grep -c '1\.60\.'` → `≥ 1`
- `git diff --stat | head -3` reports two files: `package.json` (+1/-1), `package-lock.json` (modest diff).

---

## Phase 2 — Snapshot migration

### T2 — Migrate `homepage.spec.ts:192` to page-level snapshot

**ACs satisfied:** AC-3 (full)
**Touches:** `tests/playwright-agents/homepage.spec.ts`

**Steps:**

1. Open `tests/playwright-agents/homepage.spec.ts` to the "Homepage main landmark matches ARIA smoke snapshot" test (line ~188-216).
2. Replace `await expect(page.locator('main').first()).toMatchAriaSnapshot(...)` with `await expect(page).toMatchAriaSnapshot(...)`.
3. Update the test title to reflect the new scope: `'Homepage page-level landmarks match ARIA smoke snapshot'` (so a future reader knows the scope is page, not `main`). Tag preservation: do not change `@content @navigation Homepage Redesign @REQ-CONTENT-01 @REQ-VISUAL-01` — those tags are how the shard 1 selector finds this test.
4. Start `bundle exec jekyll serve --config _config.yml,_config_dev.yml` in a background terminal (port 4000). Wait for `Server running... press ctrl-c to stop.`
5. Run `npx playwright test tests/playwright-agents/homepage.spec.ts -g "page-level landmarks" --update-snapshots`. This rewrites the inline template literal in place with the page's full accessibility tree.
6. **Manual diff review** of the regenerated snapshot — this is the load-bearing human-judgment step:
   - Should include `banner` (header), `navigation` (already in the old snapshot's parent), original `main` block, `contentinfo` (footer), and possibly `complementary` if newsletter landmark spans outside `main`.
   - Watch for dynamic content leaking in: build-date footers, copyright year, post-count badges, anything keyed on `site.time`. Replace each with the existing `/.+/` regex placeholder pattern (already used at line 194-196 for the heading).
   - Watch for screen-reader-only text becoming visible in the snapshot — accessibility tree includes `aria-label` content, so a label like `aria-label="Skip to main content"` will appear as `link "Skip to main content"`.
7. Re-run without `--update-snapshots` to confirm stability: `npx playwright test tests/playwright-agents/homepage.spec.ts -g "page-level landmarks"`. Must exit `0` with no diff prompt.

**Verify (mechanical):**
- `grep -c "expect(page).toMatchAriaSnapshot" tests/playwright-agents/homepage.spec.ts` → `1`
- `grep -c "expect(page.locator('main').first()).toMatchAriaSnapshot" tests/playwright-agents/homepage.spec.ts` → `0`
- Test passes against a live server, without `--update-snapshots`, on two consecutive runs (proves the snapshot is stable, not a one-shot capture).

**Risk:** if the page-level snapshot picks up unstable content that resists `/.+/` placeholders, narrow it back — keep the `expect(page)` form but use a `boxes: false` option or wrap a single template literal with strategic `/.*/` placeholders. **Do not revert to element-scoped.** If narrowing fails, escalate to spec amendment (the migration would then move to follow-up work).

---

### T3 — Annotate the two element-scoped sites with `// element-scoped:` rationale

**ACs satisfied:** AC-3 (rationale-comment portion)
**Touches:** `tests/playwright-agents/navigation.spec.ts`

**Steps:**

1. Above the snapshot at `navigation.spec.ts:96`, insert a one-line comment:
   `// element-scoped: deliberately narrow to the article landmark — page-level would balloon the snapshot with site chrome (#947).`
2. Above the snapshot at `navigation.spec.ts:460`, insert a one-line comment:
   `// element-scoped: mobile-nav-open assertion checks the nav landmark in its open state; page-level would dilute the assertion (#947).`
3. Do not modify the snapshot template literals themselves.

**Verify (mechanical):**
- `grep -cE "^\s*// element-scoped:" tests/playwright-agents/navigation.spec.ts` → `2`
- `npx playwright test tests/playwright-agents/navigation.spec.ts -g "ARIA smoke snapshot"` still passes (the comments are no-ops at runtime; this just guards against accidental edits).

---

## Phase 3 — Docs

### T4 — Update `.github/skills/jekyll-qa/SKILL.md`

**ACs satisfied:** AC-6
**Touches:** `.github/skills/jekyll-qa/SKILL.md`

**Steps:**

1. Open `.github/skills/jekyll-qa/SKILL.md`. Locate line 40: `` - `@playwright/test ^1.59.1` ``.
2. Replace the version: `` - `@playwright/test ^1.60.0` `` (bumped from ^1.59.1 in #947 — adds page-level `expect(page).toMatchAriaSnapshot()`, `test.abort()`, HAR-on-tracing, `locator.drop()`)
3. Below this line, add a sub-bullet:
   `` - `test.abort()` (Playwright 1.60+) is available for "tests must not call X" guardrails (issue #947) ``
4. Do not edit any other line, do not introduce trailing whitespace, do not reflow surrounding bullets.

**Verify (mechanical):**
- `grep -n '@playwright/test \^1' .github/skills/jekyll-qa/SKILL.md` → exactly one match, reading `^1.60.0`.
- `grep -n 'test.abort()' .github/skills/jekyll-qa/SKILL.md` → at least one match referencing #947.
- `git diff --stat .github/skills/jekyll-qa/SKILL.md` → small diff, single hunk.

---

## Phase 4 — Local verification

### T5 — Full Playwright sweep + scope-guard boundary check

**ACs satisfied:** AC-4 (test-quality side, see Spec Amendment Proposal above), AC-5 (full local sweep), AC-8 (file boundary)
**Touches:** none (read-only verification)

**Steps:**

1. With `bundle exec jekyll serve --config _config.yml,_config_dev.yml` still running on `:4000`:
   - `npm run test:playwright:shard1` — Navigation & Mobile (covers the `navigation.spec.ts` element-scoped snapshots)
   - `npm run test:playwright:shard2` — Content, Search & Links (covers the migrated `homepage.spec.ts` snapshot, since `homepage.spec.ts` carries `@REQ-CONTENT-01`)
   - `npm run test:playwright:shard3` — Accessibility, Visual & Performance
2. Full sweep as a tiebreaker: `npx playwright test`. Must exit `0`.
3. AC-8 boundary check: `git diff --name-only main...HEAD` returns **only**:
   ```
   .github/skills/jekyll-qa/SKILL.md
   package-lock.json
   package.json
   tests/playwright-agents/homepage.spec.ts
   tests/playwright-agents/navigation.spec.ts
   ```
   5 files exactly. Zero entries under `_config.yml`, `Gemfile`, `Gemfile.lock`, `.github/CODEOWNERS`, `.github/copilot-instructions.md`.
4. **No new files created.** `git status --short` shows only `M` markers (and the existing untracked `specs/copilot-skills-agents-redesign-spec.md`, unrelated).

---

### CHECKPOINT-A — Local gate before /review

**Gate criteria (all must be true before T6):**

- [ ] T1: `package.json` pinned at `^1.60.0`; `npm ls @playwright/test` reports `1.60.x`.
- [ ] T2: `homepage.spec.ts:192` uses `expect(page).toMatchAriaSnapshot` and passes twice consecutively without `--update-snapshots`.
- [ ] T3: Two `// element-scoped:` rationale comments present in `navigation.spec.ts`.
- [ ] T4: `SKILL.md` line ~40 reads `^1.60.0`; `test.abort()` note recorded.
- [ ] T5: All three Playwright shards pass; full sweep passes; AC-8 boundary is exactly the 5 expected files.

---

## Phase 5 — REVIEW

### T6 — `/review` via code-reviewer agent

**ACs satisfied:** lifecycle requirement (not a specific spec AC)
**Touches:** none (read-only review)

**Brief the reviewer on:**
- The AC-3 judgment call — 1 of 3 snapshots migrated; the other two kept element-scoped with rationale comments. Reviewer's job is to validate the rationale, not the mechanical change.
- The regenerated page-level snapshot text in `homepage.spec.ts` — is it stable, are the `/.+/` placeholders covering the right dynamic content, is the test name still accurate?
- AC-4 spec amendment (auto-regression doesn't run on PRs / doesn't install Playwright) — does the reviewer agree the inspection-based verification is sufficient?
- That `test.abort()` is documented but not adopted in any test (intentional — separate authoring work).
- The branch superseding Dependabot PR #959 — call out the closing strategy (close at T8, not earlier).

**Expected findings shape:** Major (snapshot stability / placeholder coverage), Minor (rationale comment wording, test rename), Nit (commit-message hygiene).

---

### T7 — Apply review revisions

**ACs satisfied:** finishes any open AC items raised by /review.
**Touches:** depends on review findings; expect at most the same 5 files.

**Hard rule:** if `/review` asks for changes that would push the diff beyond the 5-file scope, stop and escalate to spec amendment rather than silently expanding scope.

---

## Phase 6 — Ship

### T8 — Push branch; close #959; open PR

**ACs satisfied:** AC-7 (PR description content)
**Touches:** git remote, GitHub PR state.

**Steps:**

1. `git push -u origin feat/playwright-1.60-aria-snapshots`.
2. `gh pr create --repo oviney/blog --label "agent:qa-gatekeeper" --title "feat(tests): bump @playwright/test to ^1.60.0 + page-level ARIA snapshot on homepage (#947)"` with body containing:
   - Closes #947
   - Supersedes #959 (Dependabot lockfile-only bump)
   - Spec amendment note for AC-4 (auto-regression workflow trigger surface)
   - Rationale for keeping 2 of 3 ARIA snapshots element-scoped (one paragraph per call-site)
   - Snapshot diff narrative — what new landmarks the page-level snapshot picked up, what `/.+/` placeholders were added
   - Local verification evidence (3 shards + full sweep, all green)
3. **Then** close #959: `gh pr close 959 --repo oviney/blog --comment "Superseded by PR #<new> — single atomic bundle of lockfile, snapshot migration, and skill doc update per SPEC #947."`

**Order matters:** open the new PR first, then close #959. The opposite order leaves the repo with no open bump PR for the window between commands.

---

### T9 — CI passes

**ACs satisfied:** AC-4 (test-quality side)
**Touches:** none.

**Steps:**

1. Wait for Quality Tests workflow (Playwright shards 1+2+3) to complete on the PR.
2. **Retry policy:** zero Playwright-shaped retries. One puppeteer Chrome-cache retry is tolerated only if the failure stack matches the pattern from #958 (the composite action's retry-wrapped `npm ci` should make this nearly impossible after the first run, but if cold-cache hits and the retry-loop genuinely fires, that's a tolerated outcome — log it in the PR comments).
3. If any Playwright-shaped failure occurs: do **not** retry. Investigate the diff, fix locally, push a follow-up commit.

---

### T10 — Admin-merge

**ACs satisfied:** none new — closes the lifecycle.
**Touches:** main branch.

**Steps:**

1. `gh pr merge <new-PR> --repo oviney/blog --admin --squash --delete-branch`.
2. `git switch main && git pull origin main`. Confirm local `main` carries the merge commit and `git status` is clean.
3. Archive the lifecycle artifacts: `mkdir -p tasks/archive/2026-05-17-playwright-1.60-947 && git mv SPEC.md tasks/archive/2026-05-17-playwright-1.60-947/ && git mv tasks/plan.md tasks/archive/2026-05-17-playwright-1.60-947/ && git mv tasks/todo.md tasks/archive/2026-05-17-playwright-1.60-947/` (in a one-line cleanup commit on a follow-up branch, or in the same PR if archive-on-ship is the convention — confirm with maintainer; #958's lifecycle artifacts were archived in the next session, not the same PR).

---

## Definition of Done

- [ ] All 8 SPEC §3 ACs satisfied (AC-4 satisfied per the amended wording proposed above, assuming the user accepts the amendment).
- [ ] PR description records the AC-7 narrative (snapshot rationale, #959 supersedure, #944 unblock).
- [ ] `gh pr view <new> --json statusCheckRollup` shows all required checks green; merged via admin-squash.
- [ ] Local `main` synced post-merge; lifecycle artifacts archived (in this PR or a follow-up cleanup commit).
- [ ] No follow-up issue needed — `test.abort()` adoption and HAR tracing are explicitly deferred in SPEC §10 and require no tracking issue beyond what's already in #902 (Watch list).
