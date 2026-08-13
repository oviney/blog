# TODO

No cycle in progress.

The 2026-08-12 backlog sweep is archived under
[tasks/archive/2026-08-12-backlog-sweep/](archive/2026-08-12-backlog-sweep/).

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
