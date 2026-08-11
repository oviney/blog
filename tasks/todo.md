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
- [ ] Refresh the homepage baselines via the documented path — dispatch `test-quality.yml`
      on the branch with `update_snapshots=true`. **Not regenerated locally:** the suite header
      requires baselines be produced in the CI environment so anti-aliasing stays consistent
- [ ] Confirm no non-homepage snapshot changed in the refreshed commit

## Phase 4 — Review & ship

- [ ] Five-axis review of the diff
- [ ] `bash scripts/check-pr-scope.sh` — passes with no label
- [ ] Push branch, open PR, leave unmerged for review
- [ ] File the two-H1 issue as follow-up (SPEC §3 D4)
- [ ] File the `category-security-Mobile` visual flake as follow-up

## Out of scope

- `_layouts/default.html`, `_sass/economist-theme.scss`, any protected file
- The two-H1 fix — deliberately deferred (SPEC §3 D4)
- Any change to the design bundle itself
