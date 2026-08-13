# TODO — Apply the undelivered homepage design drop

**Spec:** [SPEC.md](SPEC.md) · **Plan:** [plan.md](plan.md) · **Issue:** none
**Date:** 2026-08-11

## Phase 0 — Groundwork

- [x] Locate the design source: Claude Design project `Viney home page redesign` (`9356d593`)
- [x] Confirm the `deploy/` bundle was never applied — `main` (dbb2780) still runs the #1193 code
- [x] Confirm all four defects in source and in a live render at 1440 / 390
- [x] Confirm the bundle would regress three repo fixes if copied verbatim (SPEC §3 D1)
- [x] Capture pre-change renders at 1440 and 390
- [x] Write SPEC / plan / todo
- [x] Branch off `main` — `fix/homepage-design-drop`
- [x] Confirm `$spacing-*` resolve — they do, but the file uses `@use ... as theme`, so they need the `theme.` prefix (the bundle's bare `$spacing-xl` would not have compiled)

## Phase 1 — Port the fixes ✅

- [x] **T1** `.main-content:has(.home-2026)` escape + wrapper box model (1040px, centred, padded, mobile override)
- [x] **Checkpoint A** — measured: home wrapper `x=200 w=1040`, **identical to `/blog/`** (`x=200 w=1040`)

- [x] **T2** extend the scoped `a` reset with `border-bottom: none`
- [x] **T3** `.h26-author` → light band + 3px red top rule + repad
- [x] **T3b** re-point five `.h26-author-*` descendant colours at the ink/body/muted ramp
- [x] **T4** remove LinkedIn + GitHub from `.h26-author-links` in `index.md`
- [x] **Checkpoint B** — all four defects gone at 1440; 390 clean

## Phase 2 — Verify ✅

- [x] `bundle exec jekyll build` clean
- [x] `homepage.spec.ts` — **45/45 passed**
- [x] pa11y-ci — **0 errors** on `/` and `/blog/` (inverted author band clears AA in the new direction)
- [x] Drop-cap regression guard passes (`homepage.spec.ts:327`) — fix C survived
- [x] `$h26-red` still `theme.$economist-red`; `$h26-faint` still `#736d64`; no hardcoded `#E3120B`
- [x] Post-change renders at 1440 / 390 compared against Phase 0 captures
- [x] **Checkpoint C** — build, specs, and a11y all green

## Phase 3 — Baseline

- [x] Ran the visual suite — 3 homepage entries moved (deliberate, per SPEC D3)
- [x] Investigated a 4th failure, `category-security-Mobile`: passed on `main` isolated,
      passed on branch isolated, passed on branch full-suite re-run, failed once under
      parallel load. **Pre-existing flake, not caused by this change.** Follow-up, not a blocker
- [x] Refreshed the homepage baselines via the documented path — dispatched `test-quality.yml`
      with `update_snapshots=true` (run 31544190321). **Not regenerated locally:** the suite header
      requires baselines be produced in the CI environment so anti-aliasing stays consistent
- [x] Confirmed what the refresh changed — and caught that it clobbered a 4th, unrelated baseline.
      The seed run captured `not-found-Tablet` at 1024px; the page measures 1026px on `main`
      locally, on this branch locally, and in this PR's CI. The pre-seed baseline was right, so it
      was restored (`f02e20a`). Baseline diff is now the 3 homepage entries only
- [x] All 3 homepage baselines pass in CI against the refreshed images

## Phase 4 — Review & ship ✅

- [x] Five-axis review of the diff — two findings in my own work, both fixed in `8cc9a3a`:
      a restated breakpoint (`768px` vs the `$h26-bp: 48em` token — not interchangeable, since
      `em` in a media query resolves against the browser's initial font size) and `$h26-paper`
      left dead after the author band inverted
- [x] `bash scripts/check-pr-scope.sh` — **PASSED**, no label needed
- [x] Pushed; **PR [#1260](https://github.com/oviney/blog/pull/1260)** open and unmerged
- [x] CI green: Visual Regression, Page Contract, Build, Security Audit, Content Validation,
      check-agent-scope, validate-editorial all pass
- [x] Filed the two-H1 follow-up — **[#1261](https://github.com/oviney/blog/issues/1261)**
- [x] Filed the visual-flake follow-up — **[#1262](https://github.com/oviney/blog/issues/1262)**,
      covering `not-found` (and the seed path that committed a bad baseline), `search`, and
      `category-security`

## Phase 5 — `/ship` fan-out (3 personas, parallel)

- [x] `security-auditor` — **no findings above Low.** Net reduction in surface: the rendered
      homepage now has zero `target="_blank"` occurrences, so no window-opener relationship
      with any external origin. Baseline PNGs verified structurally clean (`IEND` at EOF)
- [x] `test-engineer` — found that **the guard for defect 1 already existed**: `responsive.spec.ts`
      "Gap E" asserts `|width − 1040| ≤ 50` and `card ≥ 280`, both of which fail against the
      pre-fix 852px/257px homepage. It never ran on `/` because it was keyed on
      `.topic-page, .econ-topic-page` — the same class-name keying that broke the CSS
- [x] `code-reviewer` — **changes requested**, three Important findings, all verified by
      measuring the rendered page and all fixed in `c5bbf96`

### Findings fixed (Phase 5a)

- [x] "Contact" link had no affordance — computed `rgb(74,74,74) / 0px none / none`,
      byte-identical to the paragraph beside it (WCAG 1.4.1). Used `currentColor` (7.73:1)
      rather than `$h26-rule`, which measures **1.24:1** on the band — an invisible underline
- [x] Author-link hover failed AA — `$h26-red` on `$h26-band` is **4.20:1**. Darkened via the
      theme's own `color.adjust(..., $lightness: -10%)` → `#B20E09`, 6.19:1. **pa11y tests the
      resting state only**, so no gate in the stack could have caught this
- [x] The `:has()` escape un-capped the newsletter CTA. **My earlier claim that this was
      pre-existing site-wide behaviour was wrong** — I compared the homepage to `/blog/` after
      the change instead of the homepage before vs after. `/about/` disproves it (`x=214 w=852`).
      Re-capped to the wrapper's *content* box; band and CTA now both `x=152 w=976`
- [x] Author-links rationale moved to a Liquid comment so it stops shipping to readers

### Regression guard (Phase 5b)

- [x] Extended Gap E to cover `/` with per-page selectors. **Proven, not assumed:** with the
      `:has()` escape disabled the new case fails with `Received: 188` (1040 − 852); enabled, 5/5 pass
- [x] The refactor surfaced a dead selector the union had hidden — `/blog/` renders
      `.topic-card`, not `.econ-article-card`, which no template emits. Filed as #1263

### Process errors I made, recorded so they are not repeated

- [x] Used `git stash` to switch branches on an already-clean tree — it tried to pop a
      **pre-existing unrelated stash**. No contamination (verified clean, both stashes intact),
      but the pattern is unsafe. Use a worktree or plain checkout
- [x] Used `git add -A` while subagents were writing to `.claude/agent-memory/`, sweeping 11
      tracked files into the branch — then made it worse with `git rm --cached`, turning
      modifications into deletions. Restored the path from `main`; persona memory content
      preserved in the session scratchpad. **`git add -A` is the wrong verb after a fan-out**

> **COMPLETE 2026-08-11.** PR #1260 open — 9 files, all gates green, unmerged for review.
> Four follow-ups filed: #1261 (two H1s), #1262 (visual-suite instability + the seed path that
> committed bad baselines on both dispatches), #1263 (orphaned `.econ-article-card` CSS).

## Out of scope

- `_layouts/default.html`, `_sass/economist-theme.scss`, any protected file
- The two-H1 fix — deliberately deferred (SPEC §3 D4)
- Any change to the design bundle itself
