# Plan — Decouple the homepage visual baseline from post publication

**Spec:** [../SPEC.md](../SPEC.md)
**Backlog row:** `docs/BACKLOG.md`, top P2 (Active)
**Issue:** none — local backlog item ([[local-backlog]] convention: in-session work
pulls from `docs/BACKLOG.md`; GitHub Issues stay for Copilot cloud agents)
**Branch:** `qa/decouple-homepage-hero-baseline` (not yet created)
**Date:** 2026-08-01

## Scope

Small. One test file (`tests/playwright-agents/visual-snapshot.spec.ts`), three
regenerated baseline PNGs, and a backlog row retired. Well inside the 15-file
scope-explosion cap — no `bulk-content` label needed.

## Decisions — all three open questions are now resolved

The spec shipped with one owner call open and two observations unfiled. All three
are settled below so the next agent starts unblocked. **Nothing here needs
another round trip.**

### D1 — Accept the loss of hero pixel coverage · **RESOLVED: accept**

The fix `display: none`-s `.hero-post` before capture, so the homepage baseline
stops covering the hero's type scale, spacing, image aspect and colour.

Accept it, for a reason this repo has already lived through: a gate that reds on
every publish gets ignored or bypassed, and that is exactly how the visual gate
sat broken from #1119 until #1160. Alarm fatigue is the demonstrated failure mode
here, not a hypothetical one. Weigh that against a narrow, rare coverage gap and
the trade is not close.

What survives: `homepage.spec.ts:21-37` asserts `.hero-post` is visible, the
title links, the excerpt renders and the CTA has a working `href`, with
click-through re-asserted at `homepage.spec.ts:174-180`. `viewport-overflow` and
`responsive` still exercise the homepage at every breakpoint.

**Accepted residual risk, stated plainly:** a CSS regression touching *only*
`.hero-post-*` rules would no longer be caught by pixels. Theme-wide regressions
still surface — `about` and both post scenarios remain full-page captures. The
gap is limited to hero-only rules.

**Considered and rejected: asserting hero computed styles against design tokens**
(the #1131 container-width idiom). `_sass/economist-theme.scss:1752` sets
`.hero-post-title { font-size: 2.25rem }` as a literal, not a token, so the
assertion would re-state the SCSS number rather than check it against anything —
a change-detector test, not coverage. Not worth the lines.

### D2 — Required Playwright shards can be skipped · **RESOLVED: no action**

Change-based selection can skip all three required `🎭 Playwright Shard N/3`
checks, and GitHub counts a skipped required check as satisfied. #1183 merged
that way, with no shard running.

Do nothing, and record why so it is not re-litigated:

1. Skipping shards on a diff that touches no site code is the *intent* of
   change-based selection, not a defect in it.
2. The dangerous version of this — multi-commit PRs misclassified as docs-only —
   was already fixed in #1176 by diffing against the merge-base instead of
   `HEAD~1`.
3. There is a safety net. `🖼️ Visual Regression` runs on **every**
   `pull_request`/`push` independent of change-based selection (see the comment
   above the `visual-regression` job in `.github/workflows/test-quality.yml`).
   Every PR gets a real render check even when the shards skip.

### D3 — Seed commit lands as `action_required` · **RESOLVED: no action**

The bot's baseline seed commit needs a manual
`gh api -X POST repos/oviney/blog/actions/runs/<id>/approve` before checks start.

Leave it. The fix would be pushing the seed commit with a PAT so runs trigger
normally — a long-lived secret and a workflow-recursion risk, traded for one CLI
call on an operation that runs a handful of times a year. Cost exceeds benefit.
Already documented in `SPEC.md` §5 and in project memory.

## Dependency graph

```
Phase 0 — AGENTS.md drift  (independent, do first, separate PR)
    │   AGENTS.md:159 still tells agents to avoid bare #NNN
    │   because "an orchestration bot misreads it" — #1183 fixed
    │   that bot, so the guidance now teaches a retired workaround
    ▼
Phase 1 — the fix          (branch off main)
    │   visual-snapshot.spec.ts: per-page volatile selectors
    │
    ▼   Checkpoint A: local build green, no baseline touched yet
    │
Phase 2 — re-seed baselines in CI
    │   rebase onto main FIRST, then dispatch update_snapshots=true
    │
    ▼   Checkpoint B: exactly 3 PNGs changed (AC-2)
    │
Phase 3 — prove the decoupling
    │   throwaway post on a scratch branch, visual gate must stay green
    │
    ▼   Checkpoint C: AC-1 satisfied, scratch branch deleted
    │
Phase 4 — ship + retire the backlog row
```

Phase 0 is independent of Phases 1-4 and can be skipped without blocking them.
Phases 1 → 2 → 3 are strictly ordered: seeding before the rebase produces
baselines that go stale the moment the branch moves, and proving before seeding
measures the old capture.

## Phase 0 — Correct the stale AGENTS.md guidance (separate PR)

`AGENTS.md:159` reads:

> Use `GH-<number>` or full URLs — never a bare `#<number>` (an orchestration bot
> misreads it as an issue ref).

#1183 fixed that bot: issue refs now come only from closing keywords, so a bare
`#NNN` in a body is inert. The line now teaches a workaround that no longer
applies, and it is in the file agents read for handoff conventions.

Needs the **`protected-file-update`** label — `AGENTS.md` is protected, and that
label is the per-file bypass for exactly this (issue-driven `AGENTS.md` edits).
Do not combine it with `governance-update` on the same PR.

## Phase 1 — The fix

Generalise the volatile-content idiom already in the file. `POST_CROSS_LINKS` is
`display: none`-ed before capture on post pages; replace it with a per-page list
so the homepage can name `.hero-post` too.

`display: none`, **not** `mask` — a mask paints after layout, so a taller or
shorter hero still shifts the grid beneath it and diffs. This is the same
reasoning already recorded in the file for `POST_CROSS_LINKS` and the listing
grids, and it is why #1186 worked.

Update the file's header comment and the `listing` comment so the next reader
sees why the homepage is handled differently from the other listing pages.

## Phase 2 — Re-seed (CI only)

Rebase onto `main` first, then dispatch. Never regenerate `-linux` baselines on
macOS — cross-platform anti-aliasing makes the gate permanently flaky, the
failure that made BackstopJS non-blocking in the first place.

Two traps, both hit during #1186: the shards in the *same* dispatch run compare
against pre-seed baselines and fail (read the 🖼️ Visual Regression job, ignore
the shards), and the seed commit lands as `action_required` (see D3).

## Phase 3 — Prove it

Mirror the #1186 proof. A throwaway post dated later than every published post,
on a scratch branch, so it takes over the hero. Dispatch `test-quality.yml`;
🖼️ Visual Regression must be green. Delete the scratch branch afterwards — #1186's
`probe/visual-decoupling` left nothing behind and neither should this.

## Handoff Packet

Per the convention in `AGENTS.md` §Handoff Packet.

| Field | Value |
|-------|-------|
| **Context** | The blocking pixel gate still reds on every publish via the homepage hero. #1186 fixed the three category pages; this is the last coupled page and the one that moves most often. |
| **Work done** | Spec written and merged (PR GH-1188, root `SPEC.md`). Defect measured, not inferred: 17,118px / ratio 0.03 vs the 0.02 threshold on `[Tablet Chrome] homepage`. Cause located at `index.md:22`. All three open decisions resolved above. No production or test code touched yet. |
| **Artifacts / PRs** | Spec: GH-1188. Precedent: GH-1186 (category decoupling, same technique + proof method). Orchestrator fix that retired the prose workaround: GH-1183. Branch to create: `qa/decouple-homepage-hero-baseline`. |
| **Open questions** | **None.** D1/D2/D3 above are resolved; start at Phase 0 or Phase 1. |
| **Next owner** | `agent:qa-gatekeeper` — `.github/skills/jekyll-qa/SKILL.md`. **Run this as a fresh agent session**, not a continuation: spec and plan are on disk, so the receiving agent needs `SPEC.md` + this file and nothing from the originating transcript. |
| **Acceptance checks** | `SPEC.md` §4, AC-1 through AC-5. In short: a throwaway post does not move the homepage baseline; exactly three PNGs change; `homepage.spec.ts` passes unmodified; all six required checks green; `bundle exec jekyll build` exits 0. |

## Raised, not actioned

- `_sass/economist-theme.scss:1752` hardcodes `.hero-post-title { font-size: 2.25rem }`
  and `:1825` / `:1829` hardcode the responsive overrides. `CLAUDE.md` says the
  design system is variables-only, never hardcode. Real drift, unrelated to this
  work — worth a P3 row if a theme pass is ever scheduled.
