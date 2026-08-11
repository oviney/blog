# TODO — Dependabot exemption for the scope guard

**Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md) · **Issue:** #1253
**Date:** 2026-08-11

> **COMPLETE 2026-08-11.** Shipped as **[#1257](https://github.com/oviney/blog/pull/1257)**; #1253 closed.
> Suite 11 → **16 passing**. AC-9 proven in production on #1242 — see Phase 4.
> One unrelated finding filed along the way: **[#1258](https://github.com/oviney/blog/issues/1258)**.

## Phase 0 — Groundwork

- [x] Confirm the healing-monitor retirement is holding (0 runs in ~15 h, 4 missed slots)
- [x] Confirm the guard runs under `pull_request`, not `pull_request_target` (`test-build.yml:3-13`)
- [x] Owner approves the author + path-scoped design (D-1)
- [x] Write SPEC / plan / todo
- [x] Branch off `main`

## Phase 1 — Tests first ✅

- [x] `run_case` gains optional 6th arg `pr_author`; export `PR_AUTHOR`
- [x] Ran suite — **A–K green (11/11)** before the production script was touched
- [x] Added cases **L–P**

### Checkpoint A — the new tests fail for the right reason ✅

- [x] L and M failed on `expected exit 0, got 1` with `VIOLATION [protected-file]` —
      Rule 1 firing, not a harness error. N/O/P passed already, as intended: they are
      deny-side regression guards that must *keep* passing.

## Phase 2 — Implement ✅

- [x] `DEPENDABOT_ALLOWED_FILES` + `is_dependabot_bump()` in `check-pr-scope.sh`
- [x] Evaluated once into `DEPENDABOT_BUMP` before the Rule 1 loop
- [x] Hooked into Rule 1 beside the `protected-file-update` bypass
- [x] `pull_request`-trigger constraint recorded in **both** the script and the workflow
- [x] `PR_AUTHOR` passed in `test-build.yml`

### Checkpoint B — full suite ✅

- [x] `bash tests/scope-guard.sh` → **16 passed, 0 failed** (A–P + static invariant)
- [x] `bash -n` clean on both scripts
- [x] Guard run against the branch, **no label**, real 8-file diff → **exit 0**

## Phase 3 — Docs + ship ✅

- [x] `README.md` documents the exemption — and **see Deviation 1**
- [x] `docs/BACKLOG.md` row moved to **Recently shipped**
- [x] PR **#1257** opened with **no label**; `check-agent-scope` passed unaided,
      confirming the claim on the PR itself
- [x] Merged — **but see Deviation 2** for what happened in between

## Phase 4 — Real-world proof (AC-9) ✅

- [x] Rebased **#1242**
- [x] `check-agent-scope` → **SUCCESS without `--admin`**, on a PR that had failed it
      since it was opened. The guard's own log is the proof, not the green tick:

      PR_AUTHOR: dependabot[bot]
      check-pr-scope: checking 1 changed file(s) against scope rules...
      check-pr-scope: dependabot[bot] dependency bump — bypassing protection for 'Gemfile.lock'.
      check-pr-scope: PASSED — no scope violations found.

- [x] #1242's merge decision reported back — still the owner's call

## Phase 5 — Close out ✅

- [x] Archived to `tasks/archive/2026-08-11-dependabot-scope-exemption/`
- [x] Refreshed `docs/BACKLOG.md` "Where to pick up"

## Deviations

**1 — README correction beyond the plan.** The scope-guard section said the script
"enforces three scope rules" and omitted Rule 4 (agent-scope) entirely. Corrected to
four and tabulated all four exemptions in one place. A small scope widen, but leaving
a table factually wrong while editing it seemed worse than the widen.

**2 — `🖼️ Visual Regression` failed once, for an unrelated reason.** 6 failed /
24 passed: exactly **2 pages × 3 viewports**, and both were the only *post* pages in
the suite. Not a pixel mismatch —

    Error: page.goto: Test timeout of 30000ms exceeded.
      - navigating to "…/2025/12/31/testing-times/", waiting until "load"

`page.goto` defaults to `waitUntil: 'load'`, and `_layouts/post.html:248` loads
`https://giscus.app/client.js` — the only *loaded* external resource unique to post
pages, confirmed by diffing external hosts on a built post page against a built
non-post page. A plain re-run passed. Filed as
**[#1258](https://github.com/oviney/blog/issues/1258)**: a required, blocking check
should not be able to go red because a third party had a bad minute. Not fixed here —
it is unrelated to #1253 and a proper fix likely needs a baseline reseed.

## Deferred

- **#1258** — visual gate's third-party dependency (new; consider before further visual work)
- **#1252** — remove the orphaned healing machinery; **read `healing-monitor.js` first**
- **#1242** — owner call. `remote_theme:` is commented out at `_config.yml:37`, so
  `jekyll-remote-theme` loads and does nothing; builds clean with 0.5.2 either way
- Publish decisions on the two `_review/` drafts

## Deferred

- **#1252** — remove the orphaned healing machinery (next P3; read `healing-monitor.js` before deleting)
- **#1242** merge decision — owner; `remote_theme:` is commented out at `_config.yml:37`
- Publish decision on the two `_review/` drafts, incl. the new
  `hallucination-debt-ai-test-generation-d22a6c85.md` landed on `main` 2026-08-11
