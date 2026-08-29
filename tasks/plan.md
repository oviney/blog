# PLAN — Restore the product boundary of `oviney/blog`

Spec: [`SPEC.md`](../SPEC.md)

Eight slices. Each is independently verifiable and ships as its own PR through
the existing gates. Ordering is by dependency, then by blast radius: unblock
first, stop the bleeding second, then remove, then decide.

---

## Slice 1 — Unblock `main` (D1) ✅

Fix `image_alt` on `_review/quality-ownership-delivery-teams-a9d538b9.md` and the
matching SVG `<desc>`, per the convention set by #1285/#1288.

**Verify:** `validate-post-quality.sh` 0 errors; `jekyll build` passes; the
failure reproduces on a clean branch off `origin/main` *before* the fix, proving
it is independent of any open PR.

**Result:** shipped as **#1307**. Reproduced 1 error → 0. All 11 checks green. ✅

## Slice 2 — Clear the merge queue (D1) ✅

#1282 was green for 14 days and `BEHIND`. #1296 is a bot PR refreshing
`dashboard/agents-data.json` — data for a dashboard slice 6 may retire, so it is
deliberately *not* merged here; it is decided in slice 6.

**Verify:** #1282 re-runs green on an updated base; `main` deploys.

**Result:** #1282 merged as `9ba1bc9`, all checks green post-update. #1296 held
for slice 6 with the reason recorded. ✅

## Slice 3 — Stop the producer reddening `main` (D2) ✅

The leak is not the writer. `stage3_runner.py:295` *deliberately* has the writer
emit `image_alt` as a drawing brief; `pipeline.py:428` then *deliberately*
replaces it with the hero SVG's `<desc>`. The gap is that `check_hero_svg`
validated that `<desc>` exists, never what it says — so the brief is laundered
through the SVG into the front matter.

Add `_PROMPT_LANGUAGE` to `check_hero_svg`, mirrored term-for-term from this
repo's `PROMPT_ALT_PATTERN`, so it fails one redraw upstream instead of the
publication queue downstream.

**Verify:** the exact outage string is rejected; one case per mirrored term; a
plain description still passes; the shipped reference hero still passes.

**Result:** **oviney/economist-agents#484**. 42 hero tests pass, 2,686 suite-wide;
the 6 failures are byte-identical on the base commit and environmental. ✅

## Slice 4 — Untrack what is not source (D3)

`vendor/` (3,599 files) and `.playwright-mcp/` (24 PNGs) are tracked despite both
being gitignored — the ignore rules were added *after* the files were committed,
so they never took effect. Also remove `Gemfile.lock` from `.gitignore`: it is
tracked, it is a protected file, and listing it as ignored is a third rule
contradicting the other two.

`git rm -r --cached` only — no history rewrite, no working-tree deletion.

**Verify:** `git ls-files vendor` and `git ls-files .playwright-mcp` both empty;
no path is both ignored and tracked; `bundle exec jekyll build` passes; a fresh
`bundle install` still works from the untouched working tree.

**Scope:** 3,600+ files. Structurally atomic — a partial untrack leaves the repo
in a worse state than either end. Carries `bulk-content` with justification.

## Slice 5 — Delete machinery that does not run (D4)

Inventory every workflow and script by last-run date and by whether anything acts
on its output. Delete what fails both tests; fix what is stuck.

Read each file before deleting it. Anything ambiguous stays and is listed in the
PR body as a deliberate deferral rather than removed on a guess.

**Verify:** remaining workflows all ran within 30 days; nothing left in
`action_required`; `jekyll build` and the full Playwright suite pass; no retained
workflow references a deleted script.

## Slice 6 — Retire or keep the observability surface (D4)

`dashboard/`, the agent activity report, ROI, rework tracking, and the eval
harness. 295 of the last 300 CI runs were this system reporting on itself, and
#1296 shows it opening PRs nobody merges.

Decide keep/retire per surface with the evidence, then execute. Settles #1296.

**Verify:** if retired, `/dashboard/` behaves like the Healing Monitor retirement
(#1254) — `noindex` landing page, no broken links, no orphaned scripts, and the
bot that refreshes its data is switched off, not left opening PRs.

## Slice 7 — One backlog (D5)

Six queues today: GitHub Issues, `docs/BACKLOG.md`, `docs/GROWTH_DESIGN_BACKLOG.md`
(883 lines, untouched since 2026-06-26), `tasks/todo.md`, `ROADMAP.md` tech debt,
`docs/CURRENT_STATE.md`.

`docs/BACKLOG.md` documents the split as deliberate — Issues are token-expensive
to query. That reasoning is sound and the outcome still failed: `tasks/todo.md`
recorded this same alt-text breakage on 2026-08-15 as "blocked on someone else's
change", it recurred twice more, and nobody noticed for two weeks.

Collapse to two, write the routing rule down, and promote every live item out of
the archived files first so nothing is silently dropped.

**Verify:** every open item in a retired file is either in Issues, in the
surviving queue, or explicitly closed with a reason in the PR body.

## Slice 8 — Specify the extraction and record the decision (D6)

ADR + migration spec: which paths move, what replaces them here, how this repo
consumes them afterwards, and what the reversal costs.

Spec only. Creating repositories and moving code needs owner action and is the
next cycle.

**Verify:** a reader who was not in this session can execute it. Every path named
exists. The ADR follows the format already used in `decisions.md`.
