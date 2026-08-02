# SPEC — Restructure the PR test gate around signal, not volume

**Stream:** `docs/BACKLOG.md` P1 · **Priority:** P1 · **Scope:** L (4 PRs) · **Dependencies:** none
**Date:** 2026-08-02 · **Labels:** `agent:qa-gatekeeper`, `governance-update` (Stream C only) · **Issue:** none — local backlog item
**Status:** Stream A ✅ shipped (#1193) · Streams B, C, D not started

---

## 1. Objective

The PR Playwright gate costs **13.3 billable job-minutes and ~5 minutes of
wall-clock per PR**, fires twice per merged change (`pull_request` + `push: main`),
and rebuilds Jekyll four times per run. In seven months it has caught **one** real
product regression. Over the same period **32 of 62 commits touching `tests/`
(52%) were repair, heal, unblock, or stabilise work** — more than half of all test
effort maintains the tests rather than covering the product.

The gate is not merely expensive; parts of it are incapable of failing. This spec
restores trust by deleting what cannot fail, fixing the instruction file that
generates it, and cutting the blocking path to checks that earn their wall-clock.

**Success criteria**

| | Now | Target |
|---|---|---|
| Billable job-min per PR (`test-quality`) | 13.3 | ≤ 5 |
| PR wall-clock | ~5 min | ≤ 3 min |
| Jekyll builds per PR run | 4 | 1 |
| Assertions that cannot fail | ≥ 1 proven, ~90 lines of permissive scaffolding | 0 |
| Conditional `test.skip()` on a missing element | 8 | 0 |
| Blocking Playwright jobs | 3 shards + visual | 1 contract + visual |

---

## 2. Evidence

**The one bug.** `72c1666` — the agents dashboard scrolled sideways at 320px
because a Chart.js canvas had no width ceiling. Found only because the shards were
made blocking on 2026-08-01. The same commit surfaced five failures total: **four
were stale tests asserting behaviour that had been deliberately changed.**

**Today's failures are 5:0 rot.** Every failure on `redesign/home-2026` is
`homepage.spec.ts` asserting the *previous* homepage — "Hero section displays
latest post", "Focus Areas section shows 3 cards", "Author bio section is
visible". The redesign intentionally replaced all of it with a lead-story and
topic-index layout. Zero bugs; eight tests × three viewports of churn.

**Assertions that cannot fail.** `responsive.spec.ts:757`:

```js
// Nuclear healing: Accept if we successfully checked any link pairs
expect(validSpacingCount).toBeGreaterThanOrEqual(0);
```

A count is never negative. The surrounding `catch` blocks *increment the valid
counter on error* — `// Accept element if we can't measure - defensive approach` —
so a wholly broken page passes. 90 lines of `nuclear healing` / `ultra-permissive`
/ `Accept anyway` scaffolding span `responsive.spec.ts` (857 lines) and
`content-edge-cases.spec.ts` (682 lines): **36% of the suite by volume**,
inflating the pass count while proving close to nothing.

**Skips report as passes.** `navigation.spec.ts` has 8 skips shaped
`if (await blogLink.count() === 0) test.skip(...)`. If navigation breaks and the
Blog link vanishes, the test goes green.

**The root cause is written down.** `.github/instructions/tests.instructions.md`
§"Defensive Patterns" instructs every agent that touches `tests/**`:

> - Use `try/catch` around interactions that may fail on certain pages
> - Log skipped steps with `console.log('reason for skip')` rather than throwing

That is the generator. Deleting the tests without fixing this file rebuilds them.

**Historic credibility.** `continue-on-error: true` sat on the shard steps until
2026-08-01, so the required checks passed regardless of results. Separately,
Firefox and WebKit projects were declared while CI installed chromium only — 376
of 940 tests errored and were swallowed. The suite advertised cross-browser
coverage it had never once had.

---

## 3. Decisions

**D1 — Retain the 🖼️ Visual Regression gate on PRs. REVERSED from the review.**
The review recommended dropping homepage pixel gating. On inspection that is
wrong. Today's homepage baseline failure is a *correct* result: the design
genuinely changed, and reseeding is the right response. The failure mode worth
fixing was baselines moving on every *publish*, and #1186 + #1191 already fixed
it — no page's baseline now moves when an article ships. The job is also the
cheapest in the workflow (140s). It stays.

**D2 — Delete rather than repair `responsive.spec.ts` and
`content-edge-cases.spec.ts`.** Their permissive scaffolding is load-bearing:
extracting the real invariants is a rewrite, not an edit. The invariants worth
keeping (§4, Stream B) are re-expressed in the new contract suite. Tests that
cannot fail are worse than absent ones — they buy false confidence and consume
maintenance.

**D3 — One contract suite, both blocking and cheap.** A ~15-test
`page-contract.spec.ts` on Mobile (320) + Desktop (1920) replaces three sharded
jobs. It must still catch the class of the one real bug ever found: horizontal
overflow at 320px.

**D4 — The full 138-test suite moves to nightly, non-blocking, auto-filing an
issue on failure.** It keeps its value as a broad net without taxing every PR.

**D5 — `agent-eval.yml` is left alone.** Measured at 0.0 billable job-minutes; it
is not part of the problem.

---

## 4. Scope — four PRs, in this order

### Stream A — finish `redesign/home-2026` (unblocks product work) — ✅ SHIPPED in #1193 (2026-08-02)

Rewrite `tests/playwright-agents/homepage.spec.ts` against the shipped structure
in `index.md`: `.h26-lede` intro, `.h26-facts`, `.h26-lead` lead story with a
linked `.h26-lead-title` and working `.h26-lead-cta`, `.h26-rail` "More from the
blog", `.h26-topics` topic index, `.h26-author`. Assert **behaviour and
invariants** — the lead story links to a real post, every rail item resolves, the
topic index covers the site's categories — not card counts or section prose.
Reseed the three homepage baselines by dispatching `test-quality.yml` on the
branch with `update_snapshots=true`. Ships on the existing branch: a redesign PR
owns its own tests.

**Outcome — done as specified, plus three defects this spec did not anticipate.**
The "5:0 rot" reading in §2 was right about `homepage.spec.ts` but **incomplete**:
the branch was red for four reasons, not one, and only the first was rot.

1. *(rot, as predicted)* 24 stale `homepage.spec.ts` assertions — rewritten.
2. *(real defect)* The theme's **unscoped** drop-cap,
   `article > p:first-of-type::first-letter` (`economist-theme.scss:1416`),
   matched the redesign's new `<article>` wrappers, rendering a 10.4px kicker's
   first letter at **48px** at ≤768px. Caught by rendering the page, not by any
   spec. Fixed with a scoped reset + a guard verified to fail without it.
3. *(real defect)* `$h26-faint` at **3.71:1** failed pa11y WCAG2AA on 14
   elements — the a11y gate was doing its job.
4. *(silent coverage loss)* The homepage `volatile`/`listing` config in
   `visual-snapshot.spec.ts` still named `.hero-post` and `.topic-grid`, both
   deleted by the redesign. The mask matched nothing, quietly re-coupling the
   baseline to publication and undoing #1186/#1191. Also: the two `"Source:"`
   teaser guards failed on their own "expected at least one teaser card"
   precondition, meaning the homepage was **unguarded**, not merely red.

**Carry this into Streams B–D.** Items 2–4 are the failure mode this spec is
built to reduce, so they are worth stating plainly: the gate's *pixel* and *a11y*
jobs caught two real defects here, and a stale selector list silently removed
coverage without failing anything. D3's contract suite must not assume that
"tests failed" means "tests are rot" — on this branch that inference was wrong
3 times out of 4. In particular, **D1's decision to retain the visual gate is
reinforced**: it was the only check that would have caught #4.

### Stream B — purge assertions that cannot fail (`agent:qa-gatekeeper`)

Delete `responsive.spec.ts` and `content-edge-cases.spec.ts`. Remove the 8
conditional `test.skip()` calls in `navigation.spec.ts` — assert the element if it
must exist; delete the test if it is optional. Real invariants preserved into
Stream D's contract suite: touch targets ≥ 44×44px, no horizontal overflow at
320px, post pages render without layout breaks, external `_blank` links carry
`rel="noopener|noreferrer"`.

### Stream C — fix the generator (`governance-update`)

Rewrite §"Defensive Patterns" in `.github/instructions/tests.instructions.md`:
`try/catch` may not convert a failure into a pass; `test.skip()` may not be
conditioned on the absence of an element under test; every test must have at least
one assertion that can fail. Update §"Assertions" so `toBeGreaterThanOrEqual(0)`
and equivalents are named as forbidden.

### Stream D — restructure the gate (`agent:qa-gatekeeper`)

- Add `tests/playwright-agents/page-contract.spec.ts` (~15 tests, Mobile +
  Desktop): every page type returns 200 and renders its `h1`; no console errors;
  no horizontal overflow at 320px; nav opens and closes; internal links resolve;
  touch targets ≥ 44px.
- `test-quality.yml` PR path: build Jekyll **once**, upload `_site`, and run one
  contract job plus 🖼️ Visual Regression against the artifact. Delete the three
  shard jobs, `select-tests.sh` invocation, and `quality-report` from the PR path.
- Nightly (`schedule`) path: full 138-test suite across three viewports, pa11y,
  Lighthouse — non-blocking, opens an issue on failure.
- Update branch protection: required contexts become `build`, `🔒 Security Audit`,
  `🖼️ Visual Regression`, `🎭 Page Contract`. Removes the three shard contexts.
- Retire `scripts/select-tests.sh` and the `@REQ-*` grep routing, or reduce it to
  the nightly path. Note it currently never selects `@REQ-VISUAL-SNAP`,
  `@REQ-PAGE-CHROME`, `@REQ-CONTENT-03/04`, `@REQ-CONTENT-CAPTION-CASE` — those
  tests silently do not run on any targeted run today.

---

## 5. Commands

```bash
bundle exec jekyll build                          # must stay green throughout
npx playwright test tests/playwright-agents/page-contract.spec.ts
npx playwright test --project="Mobile Chrome"     # 320px overflow checks
npm run test:visual:snap                          # visual gate, local
bash scripts/validate-posts.sh --all
gh workflow run test-quality.yml --ref <branch> -f update_snapshots=true   # reseed
```

---

## 6. Testing strategy

Each stream is verified against a **local dev server**, not by reading the diff:

- **A** — full `homepage.spec.ts` green on all three projects; visual gate green
  after reseed.
- **B** — suite green after deletion; `grep -c "toBeGreaterThanOrEqual(0)"` = 0;
  `grep -c "test.skip("` in `navigation.spec.ts` = 0.
- **C** — no test changes; instruction file only.
- **D** — measure the new PR run: job-minutes, wall-clock, Jekyll build count
  reported in the PR body against the §1 table. Deliberately break the page (e.g.
  reintroduce the 320px canvas overflow) and confirm the contract suite reds.

**Regression guard for D:** the contract suite must fail on a reintroduced
dashboard-canvas overflow. If it does not, the restructure has lost the only bug
this gate ever caught and must be revised before merge.

---

## 7. Boundaries

**Always** — run `bundle exec jekyll build` before every PR; keep each PR atomic
and independently reviewable; verify against a running dev server; label Stream C
`governance-update`.

**Ask first** — any change to branch-protection required contexts beyond the four
named in Stream D; deleting a spec file not named in Stream B; anything that
reduces the visual gate's coverage.

**Never** — modify `_config.yml`, `Gemfile`, `Gemfile.lock`, `.github/CODEOWNERS`,
`.github/copilot-instructions.md`; push directly to `main`; weaken an assertion to
make a test pass; seed visual baselines on `main`.

---

## 8. Out of scope

Cross-browser coverage (existing P3 backlog row — Firefox/WebKit remain opt-in);
the hero type-scale tokenisation P3; de-duplicating Jekyll builds in `test-build.yml`
and `content-validation.yml` (the existing P3 row is *partly* absorbed by Stream D,
which fixes `test-quality.yml` only); `REQ-SEARCH-01`'s missing spec.
