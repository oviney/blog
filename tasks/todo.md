# TODO

**Cycle:** restore the product boundary of `oviney/blog` — **all eight slices shipped.**
Spec: [`SPEC.md`](../SPEC.md) · Plan: [`plan.md`](plan.md)

Previous cycle (masthead) archived under
[tasks/archive/2026-08-29-masthead-grid-alignment/](archive/2026-08-29-masthead-grid-alignment/).

## Shipped

- [x] **Slice 1** — unblock `main`. **[#1307](https://github.com/oviney/blog/pull/1307).**
      `main` had failed nightly Content Validation seven consecutive nights
      (2026-08-23 → 08-29) on one draft's `image_alt`. 1 error → 0.
- [x] **Slice 2** — clear the merge queue. **[#1282](https://github.com/oviney/blog/pull/1282)**
      merged after 14 days green; **[#1296](https://github.com/oviney/blog/pull/1296)**
      merged after 12 days.
- [x] **Slice 3** — stop the producer at source.
      **[oviney/economist-agents#484](https://github.com/oviney/economist-agents/pull/484)**.
      Awaiting merge there; [#1289](https://github.com/oviney/blog/issues/1289)
      stays open until it lands.
- [x] **Slice 4** — untrack `vendor/` + `.playwright-mcp/`, repair `.gitignore`.
      **[#1309](https://github.com/oviney/blog/pull/1309).** Tracked files
      4,114 → 495; zero paths both tracked and ignored.
- [x] **Slice 5** — the orchestrator's merge path was unreachable.
      **[#1310](https://github.com/oviney/blog/pull/1310).** Three independent
      permanent blockers; cadence `*/15` → hourly.
- [x] **Slice 6** — dashboard cadence matches its data.
      **[#1311](https://github.com/oviney/blog/pull/1311).** Weekly → monthly.
      Dashboard kept: noindex, unlinked, test-guarded.
- [x] **Slice 7** — two queues, not six.
      **[#1312](https://github.com/oviney/blog/pull/1312).** Routing rule written
      down; 28 growth items triaged against the codebase.
- [x] **Slice 8** — ADR-011 + `specs/extract-agent-framework.md`.
      **[#1313](https://github.com/oviney/blog/pull/1313).** Spec only; execution
      needs owner action.

## Where to pick up

`main` is green and deploying. Quality Tests: all five jobs success, including
the Content Validation that had failed seven nights running.

**Next, in order:**

1. **Merge [economist-agents#484](https://github.com/oviney/economist-agents/pull/484)**,
   then close #1289. Until it lands, every regeneration still reddens `main`.
2. **Decide `ORCHESTRATOR_AUTO_MERGE`.** #1310 fixed the merge path but left it
   off, because that code has never merged anything and switching it on is a new
   behaviour. `gh variable set ORCHESTRATOR_AUTO_MERGE --repo oviney/blog --body true`.
3. **Execute the extraction** — `specs/extract-agent-framework.md`, step 1 is an
   owner decision on the destination and blocks the rest.

## Open, needs an owner decision — not agent work

- **[#1063](https://github.com/oviney/blog/issues/1063)** — real email signup.
  `ROADMAP.md` lists it Out of Scope; the issue names that conflict as a PR-0 gate.
- **Internal docs publish to production** — `tasks/` and eight root files
  including `CLAUDE.md` and `AGENTS.md`, all `200 text/markdown`. `_config.yml`
  is protected, so the exclude list is owner-only.
- **[#1242](https://github.com/oviney/blog/pull/1242)** — `jekyll-remote-theme`
  bump, when `remote_theme:` is commented out at `_config.yml:37`. Both files
  protected.
- **The original Claude Design bundle** — lives in a Claude Design project, not
  on this machine. The masthead half shipped in #1282.
- **Two stale stashes** on `main`, both verified obsolete in the 2026-08-10 cycle.

## Carried into the queue

`docs/BACKLOG.md` now holds the two findings this cycle's triage produced: the
SVG `og:image` on 8 pages, and the orphaned Cayman SCSS still carrying the
render-blocking Google Fonts `@import`.
