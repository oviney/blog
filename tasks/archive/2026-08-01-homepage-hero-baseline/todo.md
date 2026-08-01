# TODO — Decouple the homepage visual baseline from post publication

**Spec:** [../SPEC.md](../SPEC.md) · **Plan:** [plan.md](plan.md)
**Branch:** `qa/decouple-homepage-hero-baseline` — merged as
[#1191](https://github.com/oviney/blog/pull/1191), branch deleted

> **COMPLETE 2026-08-01.** All phases shipped. `main` at `26c92f7`.
> One acceptance criterion landed differently than predicted — see Checkpoint B.

## Phase 0 — AGENTS.md drift (independent, separate PR, can be skipped)

- [x] Branch off `main`
- [x] `AGENTS.md:159` — drop the "never a bare `#<number>`" warning; #1183 retired it
- [x] Open PR with the **`protected-file-update`** label (not `governance-update`)
- [x] Merge when green — [#1190](https://github.com/oviney/blog/pull/1190), `1f9db24`

## Phase 1 — The fix

- [x] Branch `qa/decouple-homepage-hero-baseline` off `main`
- [x] `visual-snapshot.spec.ts` — replace `POST_CROSS_LINKS` with a per-page volatile-selector list
- [x] Add `.hero-post` as the homepage's volatile selector (`display: none`, **not** `mask`)
- [x] Update the header comment and the `listing` comment to explain why the homepage differs
- [x] `bundle exec jekyll build` exits 0
- [x] Commit — no baseline touched in this commit

Verified before committing that `about`/`search`/`404` contain neither
`.related-list` nor `.more-from-section` in the built `_site`, so moving from
`!listing` to per-page lists is behaviour-neutral on those three pages.

### Checkpoint A
- [x] Build green, no PNG in the diff

## Phase 2 — Re-seed baselines (CI only)

- [x] Rebase onto `main` **first** (main had moved to `1f9db24` after Phase 0)
- [x] Push, open the PR
- [x] `gh workflow run test-quality.yml --ref qa/decouple-homepage-hero-baseline -f update_snapshots=true` — run `30719831772`
- [x] Ignored the shard failures in that dispatch run — they compared pre-seed baselines
- [x] Approved the bot's seed commit (`ebed853`) — three `action_required` runs, not one

### Checkpoint B — AC-2
- [x] **Two** PNGs changed, not three: `homepage-Tablet-` and
      `homepage-Desktop-Chrome-linux.png`. `homepage-Mobile-Chrome-linux.png` is
      byte-identical.
- [x] No other PNG in the diff — the change reached *less* far than predicted,
      not further, so the stop condition (a fourth PNG) did not fire.

Mobile did not move because at 320×568 the hero sits below the fold: the capture
ends at the fixed bottom nav, above where the hero begins. Consistent with the
spec's own probe, where a new post breached the threshold on `[Tablet Chrome]`
alone and the other 29 tests passed.

## Phase 3 — Prove the decoupling (AC-1)

- [x] Scratch branch `probe/homepage-hero-decoupling` off the PR head
- [x] Throwaway post dated 2026-07-31, later than every published post
- [x] Confirmed it took the hero (`grep` of the built `_site/index.html`)
- [x] Dispatched `test-quality.yml` on the scratch branch — run `30720108178`
- [x] 🖼️ Visual Regression green
- [x] Deleted the scratch branch, local and remote

Filed the probe under **Security** rather than Quality Engineering. Hiding the
hero pulls the topic cards above the fold and those cards carry live post counts,
so a Security post moves that counter 3 → 4. The proof therefore ran through the
one remaining publish-sensitive element instead of around it.

### Checkpoint C
- [x] No probe branch, no throwaway post anywhere in the tree

## Phase 4 — Ship

- [x] All six required checks green: `build`, `🔒 Security Audit`, `🖼️ Visual Regression`, `🎭 Playwright Shard 1/3`, `2/3`, `3/3`
- [x] `homepage.spec.ts` passed unmodified (AC-3) — all three shards ran, none skipped
- [x] Posted the proof to the PR as a comment
- [x] Admin-merged, branch deleted — `26c92f7`
- [x] Retired the P2 row in `docs/BACKLOG.md` → **Recently shipped** (separate docs PR)
- [x] Archived this lifecycle to `tasks/archive/2026-08-01-homepage-hero-baseline/`

## Residual, recorded not fixed

The topic cards' post counters (`3 POSTS`, `6 POSTS`, `17 POSTS`) are now above
the fold on tablet and desktop and change on publish — roughly 0.0002 of the
frame against a 0.02 threshold, measured holding in Phase 3. Masking them would
trade a tolerated diff for lost coverage. Left alone deliberately.

The hardcoded hero type scale raised in [plan.md](plan.md) §Raised, not actioned
is now a P3 row in `docs/BACKLOG.md`.
