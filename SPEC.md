# SPEC — Decouple the homepage visual baseline from post publication

**Stream:** `docs/BACKLOG.md` P2 (top Active row) · **Priority:** P2 · **Scope:** S · **Dependencies:** None
**Date:** 2026-08-01 · **Label:** `agent:qa-gatekeeper` · **Issue:** none — local backlog item

---

## 1. Objective

Publishing an article still reds the blocking 🖼️ Visual Regression check on the
homepage, so shipping content bills a baseline re-seed as its price. #1186 fixed
this for `/security/`, `/software-engineering/` and `/test-automation/`; the
homepage is the last coupled page, and the one that moves on **every** publish.

`index.md:22` renders `.hero-post` — the newest (or `featured: true`) post's
image, category, title, subtitle, 40-word excerpt, date and read-time —
**outside** `.topic-grid`. `listing: true` in
`tests/playwright-agents/visual-snapshot.spec.ts` pins the capture to the
viewport and masks the grid, so the homepage is protected *below* the hero and
exposed *above* it. Any post that becomes the newest one rewrites that block and
shifts everything under it.

**Measured, not assumed:** a throwaway post published into Security on branch
`probe/visual-decoupling` produced `17,118 pixels (ratio 0.03 of all image
pixels) are different` against the 0.02 `maxDiffPixelRatio` threshold, on
`[Tablet Chrome] homepage`. The other 29 visual tests — including all nine
category snapshots — passed. The same branch was green without the probe post,
so the coupling is pre-existing and was not induced by #1186.

## 2. Owner decision required before building

The fix trades away **pixel** coverage of the hero: its type scale, spacing,
image aspect and colour. Structural coverage survives — `homepage.spec.ts:21-37`
already asserts `.hero-post` is visible, the title links, the excerpt renders,
and the CTA has a working `href` and click-through (re-asserted at
`homepage.spec.ts:174-180`).

**Recommendation: accept the trade.** A gate that reds on every publish is worse
than one that skips the hero's pixels, and the hero's behaviour stays covered.

If the trade is refused, close the backlog row as **won't fix** and treat the
re-seed as part of shipping a post. Do not leave the row open unresolved.

## 3. Approach

1. In `tests/playwright-agents/visual-snapshot.spec.ts`, generalise the existing
   volatile-content idiom. `POST_CROSS_LINKS` is already `display: none`-ed
   before capture on post pages; replace it with a per-page list of volatile
   selectors so the homepage can name `.hero-post` alongside it.
2. `display: none`, **not** `mask`. A mask paints after layout, so a taller or
   shorter hero still shifts the grid beneath it and diffs. Same reasoning
   already recorded in the file for `POST_CROSS_LINKS` and the listing grids.
3. Re-seed only the three homepage baselines (see §5).
4. Update the file's header comment and the `listing` comment so the next reader
   sees why the homepage is handled differently from the other listing pages.

**Rejected:** masking `.hero-post` (paints after layout — does not stop the
shift); pinning the hero's height with `addStyleTag` (fabricates a layout the
site does not have, so the baseline would assert a page that never ships);
dropping the homepage from the pixel gate entirely (also loses masthead and
navigation coverage). A fixture-content visual build would retire this whole
defect class and buy back the card interiors and footers currently masked, but
Jekyll does not swap post sources cleanly via config — revisit only if the
coupling bites a fourth time.

## 4. Acceptance criteria

- [ ] **AC-1** Publishing a post that becomes the newest article does **not**
      move the homepage baseline. Prove it the way #1186 was proven: a throwaway
      post on a scratch branch, `test-quality.yml` dispatched, 🖼️ Visual
      Regression green. Delete the branch afterwards.
- [ ] **AC-2** Exactly three baselines change
      (`homepage-{Mobile,Tablet,Desktop}-Chrome-linux.png`). Any other PNG in the
      diff means the change reached further than intended.
- [ ] **AC-3** `homepage.spec.ts` passes unmodified — structural hero coverage is
      not touched by this work.
- [ ] **AC-4** All six required checks green: `build`, `🔒 Security Audit`,
      `🖼️ Visual Regression`, `🎭 Playwright Shard 1/3`, `2/3`, `3/3`.
- [ ] **AC-5** No protected file touched; `bundle exec jekyll build` exits 0.

## 5. Commands

```bash
bundle exec jekyll build                      # validate before the PR

# Re-seed baselines — CI only. They are -linux PNGs; regenerating on macOS bakes
# in anti-aliasing noise and makes the gate permanently flaky.
# Rebase onto main FIRST, then seed.
gh workflow run test-quality.yml --repo oviney/blog \
  --ref <branch> -f update_snapshots=true
```

Two traps in that seed run, both hit during #1186:

- The 🎭 Playwright shards in the **same** dispatch run compare against the
  *pre*-seed baselines and fail. Expected — read the 🖼️ Visual Regression job,
  ignore the shards.
- The bot's seed commit lands as `action_required`, so the follow-up checks never
  start until approved:
  `gh api -X POST repos/oviney/blog/actions/runs/<id>/approve`

## 6. Boundaries

- **Never** push to `main`; PR only, admin-merge when green.
- **Never** regenerate `-linux` baselines locally.
- Protected files: `_config.yml`, `.github/CODEOWNERS`,
  `.github/copilot-instructions.md`, `Gemfile`, `Gemfile.lock`.
- Do not touch `index.md`. This is a test-harness change; the homepage renders
  correctly and is not the defect.
- Do not widen scope to the fixture-content build (see §3, rejected).
- Local backlog item, not a GitHub Issue — `docs/BACKLOG.md` is the queue for
  in-session work; Issues stay for Copilot cloud agents.

---

## Appendix — session of 2026-08-01, for cold-start context

Both prior P2 rows cleared. Three PRs merged, `main` at `4864a8c`, queue empty.

| PR | Change | Verified by |
|----|--------|-------------|
| [#1183](https://github.com/oviney/blog/pull/1183) | Orchestrator issue-refs bound to closing keywords: `/\b(?:close[sd]?\|fix(?:e[sd])?\|resolve[sd]?)\b[\s:]+#(\d+)\b/gi`. Fixes all three consumers of `issueRefMap`, not just duplicate detection. | Two-sided probe on throwaway PRs 1184/1185 — prose mentions produced no duplicate close; `Closes #1110` on the same pair did. |
| [#1186](https://github.com/oviney/blog/pull/1186) | `listing: true` on the three category pages; nine baselines re-seeded, nothing else moved. | Throwaway post into Security (3 → 4 cards); all nine category snapshots held. |
| [#1187](https://github.com/oviney/blog/pull/1187) | Backlog reconciled — both P2 rows retired, stale "In review" cleared, visual epic marked closed. | Docs only. |

**Writing `#NNN` in PR bodies is safe again** — the prose workaround #1183 was
filed against is retired.

**Two unfiled observations**, raised but not actioned:

1. Change-based test selection can skip all three *required* Playwright shards.
   GitHub counts a skipped required check as satisfied, so #1183 merged without
   any shard running. Defensible for a workflow-only diff; worth a row only if
   it ever masks a real regression.
2. The bot's baseline seed commit needs a manual `actions/runs/<id>/approve`
   before checks start. Friction, not a defect.
