# Plan — Apply the undelivered homepage design drop

**Spec:** [../SPEC.md](../SPEC.md) · **Issue:** none — local backlog item
**Branch:** `fix/homepage-design-drop` · **Date:** 2026-08-11

## Shape

One PR, two product files. The work is a **port, not a copy** (SPEC §3 D1): the
design bundle predates three fixes the repo already carries, so each of the four
changes is transferred by hand and the bundle's own regressions are left behind.

Verification is evidence-led rather than test-first. There is no failing test to
write — the defects are presentational, and `homepage.spec.ts` deliberately
asserts structure, not width or colour. The proof is a before/after render plus
the existing a11y and structural gates staying green. Where a check *could* be
written cheaply and would have caught the defect, Phase 4 adds it.

**Label:** none required. Five files, no protected file, nothing under
`.github/skills/` or `.github/instructions/`. Well inside the 15-file cap, so no
`bulk-content`; no `governance-update`; no `protected-file-update`.

## File manifest (5 files + baseline, inside the 15-file cap)

| # | File | Change |
|---|------|--------|
| 1 | `index.md` | Drop the LinkedIn + GitHub anchors from `.h26-author-links`; leave the comment recording why |
| 2 | `_sass/home-2026.scss` | `.main-content:has(.home-2026)` escape; wrapper box model; `border-bottom: none` on the scoped `a` reset; light `.h26-author` band |
| 3–5 | `SPEC.md`, `tasks/plan.md`, `tasks/todo.md` | Lifecycle artifacts |
| + | homepage visual baseline | Reseed only if it moves (SPEC §3 D3) |

## Dependency graph

```
T1 (width escape) ──┐
T2 (link reset)   ──┼──→ T5 (verify: build + a11y + specs) ──→ T6 (re-baseline) ──→ T7 (review) ──→ T8 (ship)
T3 (author band)  ──┤
T4 (author links) ──┘
```

T1–T4 are independent — they touch disjoint rule blocks and can land in any
order. They are sequenced below by blast radius, largest first, so that the
biggest layout change is on screen before the smaller ones are judged against it.

## Order

1. **T1 — width escape.** The `:has()` rule plus the wrapper's box model. This
   is the one change that moves every other element on the page, so it goes
   first: T2 and T3 are judged against the corrected canvas, not the pinched one.
2. **T2 — link border reset.** One declaration. Independent of T1 but visually
   easier to confirm once the cards are at full width.
3. **T3 — author band.** Recolour and repad. Contrast direction inverts here,
   so it carries a real a11y risk (SPEC §6.2).
4. **T4 — author links.** Markup only. The single `index.md` hunk.
5. **T5 — verify.** Build, structural specs, pa11y, and a fresh render at both
   viewports compared against the pre-change captures.
6. **T6 — re-baseline** if and only if T5 shows the visual snapshot moved, and
   only the homepage entry.
7. **T7 — review** the diff on the five axes before calling it done.
8. **T8 — ship.** Push, open the PR, leave it unmerged.

## Checkpoints

- **Checkpoint A** (after T1): home page content spans the same width as
  `/blog/`. If it does not, the `:has()` escape is not matching and everything
  downstream is being judged against the wrong canvas — stop and fix before
  continuing.
- **Checkpoint B** (after T4): all four defects visually gone at 1440px, and
  the mobile render at 390px shows no new breakage.
- **Checkpoint C** (after T5): pa11y 0 errors, `homepage.spec.ts` green,
  `bundle exec jekyll build` clean. Any failure here is a real regression and
  gets root-caused, not worked around.

## Implementation sketch

```scss
// T1 — cannot be nested; the one rule that lives outside `.home-2026`.
.main-content:has(.home-2026) {
  max-width: 100%;
  padding: 0;
}

.home-2026 {
  max-width: 1040px;
  margin: 0 auto;
  padding: $spacing-xl $spacing-lg;
  // ...
  a { text-decoration: none; border-bottom: none; }   // T2

  @media (max-width: 768px) { padding: $spacing-md $spacing-sm; }
}

// T3 — light band, red top rule; the footer becomes the page's only dark mass.
.h26-author {
  background: $h26-band;
  border-top: 3px solid $h26-red;
  color: $h26-ink;
  padding: 2.25rem 2rem 2.5rem;
}
```

Descendant colours inside `.h26-author` (`-kicker`, `-name`, `-bio`, `-link`)
were written for a dark ground and must be re-pointed at the ink/body/muted ramp,
not left as-is. This is the part of T3 most likely to be missed.

## Risks

| Risk | Mitigation |
|---|---|
| `$spacing-xl` / `$spacing-lg` are not in scope in this file | Confirm the theme exposes them via the existing `@use 'economist-theme' as theme` before writing T1; namespace them if required |
| `:has()` escape does not match, or the theme's cap wins on specificity | Checkpoint A catches it immediately |
| Author band contrast fails in the inverted direction | pa11y at Checkpoint C; both directions must clear 4.5:1 |
| Visual baseline churn beyond the home page | Reseed the homepage entry only; inspect any other moved snapshot rather than blanket-accepting |
