# TODO — Apply the undelivered homepage design drop

**Spec:** [../SPEC.md](../SPEC.md) · **Plan:** [plan.md](plan.md) · **Issue:** none
**Date:** 2026-08-11

## Phase 0 — Groundwork

- [x] Locate the design source: Claude Design project `Viney home page redesign` (`9356d593`)
- [x] Confirm the `deploy/` bundle was never applied — `main` (dbb2780) still runs the #1193 code
- [x] Confirm all four defects in source and in a live render at 1440 / 390
- [x] Confirm the bundle would regress three repo fixes if copied verbatim (SPEC §3 D1)
- [x] Capture pre-change renders at 1440 and 390
- [x] Write SPEC / plan / todo
- [ ] Branch off `main`
- [ ] Confirm `$spacing-xl` / `$spacing-lg` resolve in `_sass/home-2026.scss`

## Phase 1 — Port the fixes

- [ ] **T1** `.main-content:has(.home-2026)` escape + wrapper box model (1040px, centred, padded, mobile override)
- [ ] **Checkpoint A** — home page content width matches `/blog/`

- [ ] **T2** extend the scoped `a` reset with `border-bottom: none`
- [ ] **T3** `.h26-author` → light band + 3px red top rule + repad
- [ ] **T3b** re-point `.h26-author-*` descendant colours at the ink/body/muted ramp
- [ ] **T4** remove LinkedIn + GitHub from `.h26-author-links` in `index.md`
- [ ] **Checkpoint B** — all four defects gone at 1440; no new breakage at 390

## Phase 2 — Verify

- [ ] `bundle exec jekyll build` clean
- [ ] `npx playwright test tests/playwright-agents/homepage.spec.ts` green
- [ ] pa11y-ci on `/` — 0 errors
- [ ] Drop-cap regression guard still passes (proves fix C survived)
- [ ] Confirm `$h26-red` still derives from the theme token; `$h26-faint` still `#736d64`
- [ ] Post-change renders at 1440 / 390, compared against Phase 0 captures
- [ ] **Checkpoint C** — build, specs, and a11y all green

## Phase 3 — Baseline

- [ ] Run the visual regression suite; inspect what moved
- [ ] Reseed the homepage entry only, if it moved
- [ ] Confirm no non-homepage snapshot changed

## Phase 4 — Review & ship

- [ ] Five-axis review of the diff
- [ ] `bash scripts/check-pr-scope.sh` — passes with no label
- [ ] Push branch, open PR, leave unmerged for review
- [ ] File the two-H1 issue as follow-up (SPEC §3 D4)

## Out of scope

- `_layouts/default.html`, `_sass/economist-theme.scss`, any protected file
- The two-H1 fix — deliberately deferred (SPEC §3 D4)
- Any change to the design bundle itself
