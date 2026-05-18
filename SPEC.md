# SPEC — Bump @playwright/test to ^1.60.0 + Page-Level ARIA Snapshots (#947)

**Status:** Draft — awaiting approval
**Issue:** [#947](https://github.com/oviney/blog/issues/947)
**Labels:** `agent:qa-gatekeeper`
**Date:** 2026-05-17
**Lifecycle phase:** DEFINE
**Blocker status:** [#944](https://github.com/oviney/blog/issues/944) **closed** 2026-05-17 — this issue is now unblocked.
**Related PR:** [#959](https://github.com/oviney/blog/pull/959) — open Dependabot PR already bumps `package.json` + `package-lock.json` to 1.60.0 with CI green. We will supersede it (close in favour of this branch) so the lockfile bump, the snapshot migration, and the skill update ship as one atomic change.

---

## 1. Situation

We pin `@playwright/test ^1.59.1` in `package.json`. Playwright 1.60.0 (released 2026-05-11) is additive over 1.59 — no breaking changes — and ships four features relevant to this repo:

1. **Page-level `expect(page).toMatchAriaSnapshot()`** — equivalent to asserting against `page.locator('body')`, strictly more expressive than the element-scoped form for any test that wants to capture the entire accessibility tree of a route.
2. **`test.abort()`** — abort the current test from a fixture, hook, or route handler with an optional message. Useful for the kind of "tests must not call X" guardrails we have informally today.
3. **HAR recording on Tracing** (`tracing.startHar()` / `stopHar()`) — available but not required by this issue.
4. **`locator.drop()`** — file/clipboard drag-and-drop simulation. Not used today.

Current ARIA-snapshot usage (3 call-sites total, audited at HEAD `6480f00`):

| File | Line | Locator | Page-level upgrade verdict |
|---|---|---|---|
| `tests/playwright-agents/homepage.spec.ts` | 192 | `page.locator('main').first()` | **Migrate.** `main` is the dominant landmark on `/`; page-level snapshot adds header + footer signal at zero authoring cost. |
| `tests/playwright-agents/navigation.spec.ts` | 96 | `page.locator('main article').first()` | **Keep element-scoped.** Snapshot is intentionally narrow to the article landmark; page-level would balloon the snapshot with site chrome and create review noise on every layout tweak. |
| `tests/playwright-agents/navigation.spec.ts` | 460 | `page.locator('#site-navigation')` | **Keep element-scoped.** Mobile-nav-open assertion is a deliberately tight check on the nav landmark in its open state; page-level captures unrelated content and weakens the assertion's intent. |

The issue body anticipates this: *"or a justification is recorded in the PR description if migration is deferred."* Two of three call-sites are better left as element-scoped, and we'll record the per-test rationale in the PR description rather than mechanically migrate.

There is **no footer.spec.ts** in `tests/playwright-agents/` despite the issue mentioning "footer at minimum" — `grep -l footer tests/playwright-agents/*.spec.ts` returns no file. Footer ARIA assertions live inline in `navigation.spec.ts` but do not currently use `toMatchAriaSnapshot`. We will not introduce a new footer snapshot in this PR; that is a separate authoring decision.

---

## 2. Objective

Bump `@playwright/test` to `^1.60.0`, migrate exactly one ARIA snapshot to page-level, and update the QA skill so future agents know the new minor is in play. Ship one atomic PR with lockfile, snapshot baseline update (if regenerated), and skill doc together — so the version bump is verifiable end-to-end on a single CI run.

---

## 3. Acceptance Criteria

- [ ] **AC-1** `package.json` pins `@playwright/test` at `^1.60.0`.
- [ ] **AC-2** `package-lock.json` is regenerated against `^1.60.0` and committed in this PR. `npm ls @playwright/test` reports `@playwright/test@1.60.0` (or the highest `1.60.x` available at install time).
- [ ] **AC-3** `tests/playwright-agents/homepage.spec.ts:192` is migrated to `await expect(page).toMatchAriaSnapshot(...)` with the snapshot text updated to include header + footer landmarks. The other two call-sites (`navigation.spec.ts:96`, `:460`) remain element-scoped with a one-line `// element-scoped: …` comment recording the rationale.
- [ ] **AC-4** *(amended 2026-05-17 during PLAN — see [tasks/plan.md](tasks/plan.md) §"Spec Amendment Proposal")* `.github/workflows/test-quality.yml` passes green on a single PR run. `.github/workflows/auto-regression.yml` is verified by inspection — it triggers on `issues: labeled` only (not `pull_request`) and does not install or run Playwright at runtime; it only writes test scaffolding files that depend on the lockfile-installed version exercised by `test-quality.yml`. Zero Playwright-shaped retries tolerated; one retry tolerated only if the failure stack matches the puppeteer Chrome-cache pattern from #958.
- [ ] **AC-5** `npx playwright test` exits 0 locally with `bundle exec jekyll serve` running on `:4000` (Playwright shards 1+2+3 individually, then the full sweep).
- [ ] **AC-6** `.github/skills/jekyll-qa/SKILL.md` line 40 updates `@playwright/test ^1.59.1` → `@playwright/test ^1.60.0`, and a one-line note is added in the same section recording that `test.abort()` is now available for the kind of "tests must not call X" guardrails we already do informally.
- [ ] **AC-7** PR description records: (a) why two of the three ARIA call-sites stayed element-scoped, (b) closure of Dependabot PR #959 (superseded), (c) the unblock notice (#944 closed 2026-05-17).
- [ ] **AC-8** Scope-guard boundary: `git diff --name-only main...HEAD` returns **exactly** this set — `package.json`, `package-lock.json`, `tests/playwright-agents/homepage.spec.ts`, `tests/playwright-agents/navigation.spec.ts` (if comment-only edits land), `.github/skills/jekyll-qa/SKILL.md`. Five files maximum, zero changes to `_config.yml`, `Gemfile`, `Gemfile.lock`, `.github/CODEOWNERS`, or `.github/copilot-instructions.md`.

---

## 4. Commands

```bash
# Inspect baseline
grep -n "@playwright/test" package.json
grep -rn "toMatchAriaSnapshot" tests/playwright-agents/
grep -n "@playwright/test ^" .github/skills/jekyll-qa/SKILL.md

# Bump
npm install --save-dev @playwright/test@^1.60.0
npm ls @playwright/test                                          # expect 1.60.x

# Migrate snapshot (homepage only)
$EDITOR tests/playwright-agents/homepage.spec.ts                 # line 192 → page-level

# Regenerate baseline if Playwright auto-updates the inline snapshot
npx playwright test tests/playwright-agents/homepage.spec.ts --update-snapshots
git diff tests/playwright-agents/homepage.spec.ts                # review the snapshot drift

# Local verification
bundle exec jekyll serve --config _config.yml,_config_dev.yml &  # background
npx playwright test                                              # full sweep
npx playwright test tests/playwright-agents/homepage.spec.ts
npx playwright test tests/playwright-agents/navigation.spec.ts

# Skill doc edit
$EDITOR .github/skills/jekyll-qa/SKILL.md                        # line 40 + test.abort() note
```

---

## 5. Project Structure (touched files)

```
package.json                                       # M — pin bump
package-lock.json                                  # M — regenerate
tests/playwright-agents/homepage.spec.ts           # M — line 192 → page-level snapshot + baseline drift
tests/playwright-agents/navigation.spec.ts         # M (optional) — add per-test "element-scoped: …" rationale comments
.github/skills/jekyll-qa/SKILL.md                  # M — line 40 version + test.abort() note
```

No new files. No deletions.

---

## 6. Code Style

- Page-level snapshot uses the same indented-YAML block style already in the codebase (see `homepage.spec.ts:193-216` for the model). Indent with 2 spaces inside the template literal.
- Keep `await page.waitForLoadState('networkidle')` before the snapshot — networkidle is the load gate the rest of the homepage suite uses; do not switch to `domcontentloaded` in this PR.
- Rationale comments for the two element-scoped sites: one short line beginning `// element-scoped:` — no multi-line block comments.

---

## 7. Testing Strategy

1. **Local first:** run the three Playwright shards individually (`npm run test:playwright:shard1|2|3`), then the full `npx playwright test` against a live `bundle exec jekyll serve`.
2. **Snapshot drift is expected and intentional on the migrated test only.** Review the diff manually — if the snapshot picks up dynamic content (timestamps, generated IDs), narrow the snapshot or use the existing `/.+/` placeholder pattern already used at `homepage.spec.ts:194-196`.
3. **CI confirms the bump end-to-end:** Quality Tests workflow (Playwright shards 1+2+3) **and** the Auto-Regression workflow both green on the PR. A single retry is tolerated **only** if its failure mode matches the puppeteer Chrome-cache flake (#958) — anything Playwright-shaped is a real regression.
4. **No new tests written in this PR.** This is a dependency bump + targeted migration, not a coverage expansion. `test.abort()` adoption is documented (AC-6) but not exercised; that is follow-up work.

---

## 8. Boundaries

**Always do:**
- Close Dependabot PR #959 with a comment pointing to this PR before merge.
- Run the local Playwright sweep against a live Jekyll server, not against a cached build, before pushing.
- Keep the diff at ≤ 5 files. If a sixth file becomes necessary, surface the reason in the PR description and reassess the scope.

**Ask first:**
- Any snapshot drift in `navigation.spec.ts` (we said we wouldn't touch its snapshots; if the upgrade forces a re-baseline, stop and confirm).
- Adding HAR tracing to any existing test (out of scope per issue body).
- Migrating the second or third ARIA snapshot if reviewer pushback says the element-scoped rationale is unconvincing.

**Never do:**
- Bump to `1.60.x` where `x > 0` proactively — track the patch as a separate follow-up if 1.60.1 lands during this PR's lifetime.
- Modify `_config.yml`, `Gemfile`, `Gemfile.lock`, `.github/CODEOWNERS`, `.github/copilot-instructions.md`.
- Add the `bulk-content` or `governance-update` label (this PR is neither).
- Use `--no-verify` or otherwise skip hooks.
- Cherry-pick the Dependabot lockfile change without re-resolving locally — `npm install` from a clean working tree to avoid drift between lockfile and `node_modules`.

---

## 9. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Page-level snapshot includes dynamic content that drifts on every build (post timestamps, build hashes) | Medium | Use the existing `/.+/` regex placeholders; if drift persists, narrow snapshot to the regions that are stable. |
| Migrated snapshot exposes a pre-existing a11y bug in the header/footer that wasn't visible before | Low-medium | Fix in this PR if trivial; otherwise open a separate `bug` issue and narrow the snapshot to omit the offending region, with a TODO comment referencing the new issue. |
| Auto-regression workflow flakes on first run with new Playwright version | Low | Tolerate a single Chrome-cache retry only (per AC-4). Anything Playwright-shaped is investigated, not retried. |
| Dependabot PR #959 auto-rebases mid-flight and creates a conflicting state | Low | Close #959 *first* as the opening move of the BUILD phase. |

---

## 10. Out of Scope (deferred)

- Pa11y-ci bumps (tracked in closed #944 — already shipped).
- Lighthouse major version bump (Watch item in #902).
- HAR tracing as a default artifact (#947 explicitly excludes).
- `locator.drop()` adoption — no current upload-zone test in the suite.
- Adopting `test.abort()` in actual tests — this PR documents availability only.
- Backstop or other visual-regression tooling changes.
- Adding a new `footer.spec.ts` — issue language implied one exists but it does not; introducing one is a separate authoring decision.
