# TODO — Decouple the homepage visual baseline from post publication

**Spec:** [../SPEC.md](../SPEC.md) · **Plan:** [plan.md](plan.md)
**Branch:** `qa/decouple-homepage-hero-baseline` (not yet created)

> **Start here.** All three open decisions are resolved in [plan.md](plan.md)
> §Decisions — nothing is waiting on a human. Run this as a **fresh agent
> session**: `SPEC.md` + `plan.md` + this file carry the full context.

## Phase 0 — AGENTS.md drift (independent, separate PR, can be skipped)

- [ ] Branch off `main`
- [ ] `AGENTS.md:159` — drop the "never a bare `#<number>`" warning; #1183 retired it
- [ ] Open PR with the **`protected-file-update`** label (not `governance-update`)
- [ ] Merge when green

## Phase 1 — The fix

- [ ] Branch `qa/decouple-homepage-hero-baseline` off `main`
- [ ] `visual-snapshot.spec.ts` — replace `POST_CROSS_LINKS` with a per-page volatile-selector list
- [ ] Add `.hero-post` as the homepage's volatile selector (`display: none`, **not** `mask` — plan.md §Phase 1)
- [ ] Update the header comment and the `listing` comment to explain why the homepage differs
- [ ] `bundle exec jekyll build` exits 0
- [ ] Commit — do **not** touch baselines in this commit

### Checkpoint A
- [ ] Build green, no PNG in the diff

## Phase 2 — Re-seed baselines (CI only)

- [ ] Rebase onto `main` **first**
- [ ] Push, open the PR
- [ ] `gh workflow run test-quality.yml --repo oviney/blog --ref qa/decouple-homepage-hero-baseline -f update_snapshots=true`
- [ ] Ignore the shard failures in that dispatch run — they compare pre-seed baselines
- [ ] Approve the bot's seed commit: `gh api -X POST repos/oviney/blog/actions/runs/<id>/approve`

### Checkpoint B — AC-2
- [ ] Exactly three PNGs changed: `homepage-{Mobile,Tablet,Desktop}-Chrome-linux.png`
- [ ] Any other PNG in the diff means the change reached too far — stop and diagnose

## Phase 3 — Prove the decoupling (AC-1)

- [ ] Scratch branch off the PR head
- [ ] Add a throwaway post dated later than every published post, so it takes the hero
- [ ] Confirm it actually took the hero (`grep` the built `_site/index.html` for its title)
- [ ] Dispatch `test-quality.yml` on the scratch branch
- [ ] 🖼️ Visual Regression green
- [ ] Delete the scratch branch, local and remote

### Checkpoint C
- [ ] No probe branch, no throwaway post anywhere in the tree

## Phase 4 — Ship

- [ ] All six required checks green: `build`, `🔒 Security Audit`, `🖼️ Visual Regression`, `🎭 Playwright Shard 1/3`, `2/3`, `3/3`
- [ ] `homepage.spec.ts` passed unmodified (AC-3)
- [ ] Post the proof to the PR as a comment, the way GH-1186 did
- [ ] Admin-merge, delete the branch
- [ ] Retire the P2 row in `docs/BACKLOG.md` → **Recently shipped** (separate docs PR)
- [ ] Archive this lifecycle to `tasks/archive/2026-08-<dd>-homepage-hero-baseline/`
