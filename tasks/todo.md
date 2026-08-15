# TODO

**Cycle in progress:** anchor the masthead to a single site grid.
Spec: [`SPEC.md`](../SPEC.md) · Plan: [`plan.md`](plan.md) · Branch:
`fix/masthead-grid-alignment`

The 2026-08-12 backlog sweep is archived under
[tasks/archive/2026-08-12-backlog-sweep/](archive/2026-08-12-backlog-sweep/).

## This cycle

- [ ] **Slice 1** — add the masthead-axis guard to `responsive.spec.ts` and prove
      it fails on 5 of 6 page types against the current build
- [ ] **Slice 2** — add `$grid-max-width`; point `.site-title` and `.site-nav ul`
      at it with a `min-width: 768px` gutter
- [ ] **Slice 3** — normalize `.econ-topic-page` to a `$spacing-lg` side gutter
      so `/blog/` joins the grid
- [ ] **Slice 4** — retire the last `1040px` literals in `.topic-page` and
      `home-2026.scss`'s `$h26-max`
- [ ] **Slice 5** — full gate run: build, `homepage.spec.ts`,
      `responsive.spec.ts`, `pa11y-ci`, 390px overflow, mobile geometry diff
- [ ] **Slice 6** — refresh visual baselines in CI, inspect the diff, open the PR

## Blocked

- **Cross-check the original Claude Design bundle.** Owner reported the masthead
  defect while asking for the shipped repo to be diffed against the design
  drop's `APPLY.md` and `deploy/` files. The bundle lives in a Claude Design
  project and is not on this machine — searched for `APPLY.md`, any `deploy/`
  directory, and the project name and ID; the only local traces are the archived
  [2026-08-11 cycle docs](archive/2026-08-11-homepage-design-drop/) that describe
  it. Owner agreed to paste the contents. Until then only the masthead half of
  that request can proceed, and it is possible the bundle specifies masthead
  treatment beyond width.

## Open

- **[#1063](https://github.com/oviney/blog/issues/1063)** — replace the newsletter
  placeholder with a real email signup. **Blocked on owner approval, not on work:**
  `ROADMAP.md:71` lists "Newsletter or email subscription service" under *Out of
  Scope*, and the issue names that conflict as a PR-0 gate. It also needs a
  provider chosen and an account created, which is not an agent decision.

## Needs a protected-file change (owner only)

Both were found during the 2026-08-12 sweep and left alone deliberately —
`_config.yml`, `Gemfile` and `Gemfile.lock` are on the never-modify list.

- **`tasks/` is published to production.** `_config.yml`'s `exclude:` omits it, so
  internal lifecycle planning documents are served from viney.ca. Already tracked
  as a P3 row in `docs/BACKLOG.md`.
- **`jekyll-remote-theme` is dead weight.** `remote_theme` is commented out at
  `_config.yml:37` and ADR-006 records that as a decision, yet the gem is still in
  `Gemfile` and the plugin still in `_config.yml`'s plugin list — so it loads and
  does nothing, and Dependabot keeps bumping it (most recently #1242). Removing it
  touches two protected files.
