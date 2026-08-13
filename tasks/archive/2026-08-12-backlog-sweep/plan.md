# PLAN — Stop the blocking visual gate depending on third-party hosts

**Spec:** [SPEC.md](SPEC.md) · **Issue:** [#1258](https://github.com/oviney/blog/issues/1258)
**Branch:** `fix/visual-gate-third-party-1258` · **Date:** 2026-08-12

---

## Approach

One spec file changes. The risk is not in the code — it is in the baseline
re-seed, which #1262 shows can corrupt files the branch never touched. So the
plan front-loads measurement and treats the seed as the step needing scrutiny.

## Phase 0 — Establish ground truth (done during DEFINE)

Reproduce the CI environment locally and prove the local render matches the
committed baselines before changing anything. Local full-page heights at
1920px came out at **6872** (`post-testing-times`) and **6810**
(`post-self-healing-tests`), which are exactly the committed Desktop baseline
dimensions. Without that match, nothing measured locally would transfer.

## Phase 1 — Isolate what each host costs

Block hosts one group at a time and compare full-page screenshots byte-for-byte
against allow-all, across all 10 suite pages. This decides which blocks are free
and which force a re-baseline. Recorded as D2/D3/D4 in the spec.

## Phase 2 — Implement

Add a `page.route` handler to `visual-snapshot.spec.ts` that aborts requests to
giscus and analytics hosts, continues everything else. Allowlist by "is this
localhost or a font host", not a denylist of tracker domains — a denylist rots
the moment an analytics vendor changes.

The comment must record *why fonts are exempt*, with the measured reflow, or the
next person will "finish the job" and re-baseline the whole suite.

## Phase 3 — Verify before seeding

Run the spec locally. Expect: 24 non-post cases pass unchanged against existing
baselines, 6 post cases fail on a 160px height mismatch. **That specific failure
shape is the evidence the change did what it claims** — if a non-post case also
fails, D3 is wrong and the analytics block is not pixel-neutral.

## Phase 4 — Re-seed, then audit the seed

Dispatch `test-quality.yml` with `update_snapshots=true`. Then, before trusting
it, diff the committed baselines against the pre-seed state and confirm exactly
6 files changed. Per #1262 this has failed twice, so restore anything outside
the expected set and note it on that issue.

## Phase 5 — Full suite, review, ship

Run the whole suite, not just the visual spec — `analytics.spec.ts` is the one
that could plausibly break, since it is about the hosts being blocked.

## Risks

| Risk | Handling |
|---|---|
| Seed corrupts an unrelated baseline (#1262, twice) | Audit the post-seed diff file-by-file; restore outliers |
| Analytics block is not actually pixel-neutral | Phase 3 failure shape catches it before the seed |
| Blocking fonts by accident | Explicit allowlist + a comment recording the 348px reflow |
| Route handler slows every navigation | Measure goto time before/after; expect it to drop, not rise |

## Rollback

Revert the spec change and `git checkout` the 6 baselines. No production
surface is touched — this is test-only.
