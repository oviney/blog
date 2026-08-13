# SPEC — Apply the undelivered homepage design drop

**Stream:** homepage 2026 · **Priority:** P2 · **Scope:** S (1 PR) · **Dependencies:** none
**Date:** 2026-08-11 · **Labels:** `agent:creative-director` · **Issue:** none — local backlog item
**Status:** not started

---

## 1. Objective

The Claude Design project `Viney home page redesign`
(`9356d593-185c-461f-b943-f3bafdf3790e`) carries a `deploy/` bundle and an
`APPLY.md` describing four presentation defects in the shipped home page. The
bundle was never applied. `main` still runs the original #1193 markup and CSS,
so all four defects are live on `/`.

Apply the four fixes to the repo's **current** files. Do not copy the bundle
verbatim — see §3.

**Success criteria**

| | Now | Target |
|---|---|---|
| Home page content width at 1440px | ~850px (theme's 900px reading column) | 1040px, matching `/blog/` and category pages |
| Dark bands stacked at page foot | 2 (`.h26-author` + `.site-footer`) | 1 (`.site-footer`) |
| Red rules drawn under block links | every `.h26-topic` card | 0 |
| Author links duplicated in footer's Connect column | 2 (LinkedIn, GitHub) | 0 |
| pa11y WCAG2AA errors on `/` | 0 | 0 (unchanged) |
| `homepage.spec.ts` | green | green |

---

## 2. Evidence

Rendered `/` at 1440×1000 and 390×844 against a local `jekyll serve` build of
`main` (dbb2780). Three of the four defects are visible in the desktop capture:
the content column sits inside ~300px of dead margin per side, the author band
renders as a black slab above a light CTA and a dark footer, and each topic card
carries a full-width red rule.

Confirmed in source:

| Fix | Repo state |
|---|---|
| 1. width escape | `_sass/home-2026.scss:34` — `.home-2026` declares no `max-width`, `margin`, or `padding`; no `.main-content:has(.home-2026)` rule exists |
| 2. link border reset | `_sass/home-2026.scss:38` — `a { text-decoration: none; }` only. The theme's global `a { border-bottom: 1px solid $economist-red }` is never reset |
| 3. author band | `_sass/home-2026.scss:434` — `background: $h26-ink; color: #f2efea` |
| 4. duplicate links | `index.md:128–129` — LinkedIn and GitHub anchors |

`diff index.md deploy/index.md` returns exactly one hunk: item 4. The markup is
otherwise byte-identical, which is why the page's *structure* matches the design
while its *presentation* does not.

---

## 3. Decisions

**D1 — Port the fixes; do not copy the bundle verbatim.** `APPLY.md` instructs
"copy them across verbatim." That instruction is stale: the bundle was authored
from the `redesign/home-2026` branch *before* #1193's own follow-up commits and
#1196 landed. Copying it would revert three fixes the repo has and the bundle
does not:

| | Repo (keep) | Bundle (reject) | Cost of copying |
|---|---|---|---|
| A | `@use 'economist-theme' as theme; $h26-red: theme.$economist-red` | `$h26-red: #E3120B` | Reverts #1196; violates CLAUDE.md "variables-only, never hardcode" |
| B | `$h26-faint: #736d64` | `$h26-faint: #8a847b` | 3.71:1 contrast — fails the pa11y WCAG2AA gate on 14 elements. Breaks CI |
| C | `article > p:first-of-type::first-letter { font-size: inherit }` | absent | Theme's unscoped drop-cap returns; a 10.4px kicker renders at 48px below 768px |

Neither side is a superset of the other. The unit of transfer is the fix, not
the file.

**D2 — Keep the fixes scoped under `.home-2026`.** The single exception is
`.main-content:has(.home-2026)`, which cannot be nested. `_layouts/default.html`
and `_sass/economist-theme.scss` stay untouched, matching the bundle's own
ground rules and this repo's protected-file boundary.

**D3 — Re-baseline the visual regression snapshot.** Fixes 1 and 3 change the
home page's pixels deliberately. A baseline failure is the correct result and
reseeding is the right response — the same call #1193 made and the PR-gate spec
recorded as D1. Reseed only the homepage entry.

**D4 — The two-H1 issue stays out of scope.** The masthead renders with
`aria-level="1"` on `/` and the redesign headline is an `<h1>`. Fixing it means
editing `_layouts/default.html`, which affects every page. The bundle called
this out as deliberately not fixed; that judgement still holds. File it as
follow-up, do not bundle it here.

---

## 4. Scope

Two product files:

- `index.md` — remove the LinkedIn and GitHub anchors from `.h26-author-links`,
  leaving a comment recording that the footer's Connect column carries them.
- `_sass/home-2026.scss` — add the `.main-content:has(.home-2026)` escape and
  the wrapper's `max-width: 1040px` / `margin` / `padding` box model; extend the
  scoped `a` reset with `border-bottom: none`; recolour `.h26-author` to the
  light band with a red top rule and adjust its padding.

Plus lifecycle artifacts (`SPEC.md`, `tasks/plan.md`, `tasks/todo.md`) and, if
the baseline moves, the homepage visual snapshot.

**Out of scope:** `_layouts/default.html`, `_sass/economist-theme.scss`, any
protected file, the two-H1 fix (D4), and any change to the design bundle itself.

---

## 5. Commands

```bash
bundle exec jekyll build                                   # must succeed
bundle exec jekyll serve --config _config.yml,_config_dev.yml
npx playwright test tests/playwright-agents/homepage.spec.ts
npx pa11y-ci                                               # 0 errors on /
bash scripts/check-pr-scope.sh                             # scope guard
```

---

## 6. Testing strategy

1. **Structural** — `homepage.spec.ts` asserts sections, links, and Liquid-
   rendered counts. It does not assert width or band colour, so it should pass
   unchanged. Verify rather than assume; if it fails, the failure is a real
   regression, not churn.
2. **Accessibility** — pa11y-ci on `/` must stay at 0 errors. The author band
   inverts from light-on-dark to dark-on-light; both directions need to clear
   4.5:1, so this is a real check, not a formality.
3. **Visual** — capture `/` at 1440 and 390 before and after. Confirm the three
   visible defects are gone and nothing else moved. Reseed the baseline per D3.
4. **Regression guard** — the drop-cap guard added in #1193 must still pass;
   it proves fix C survived the port.

---

## 7. Boundaries

**Always:** keep new CSS scoped under `.home-2026`; take brand colour from the
theme token; run `bundle exec jekyll build` before opening the PR.

**Ask first:** any change to `_layouts/default.html` or the theme partial; any
change that would need `bulk-content`, `governance-update`, or
`protected-file-update`.

**Never:** modify `_config.yml`, `Gemfile`, `Gemfile.lock`, `.github/CODEOWNERS`,
or `.github/copilot-instructions.md`; hardcode `#E3120B`; loosen `$h26-faint`
back below 4.5:1; merge the PR without review.
