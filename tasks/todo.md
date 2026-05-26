# TODO — Fix 21 broken Markdown links in archived task artifacts (#970)

**Spec:** [../SPEC.md](../SPEC.md) · **Plan:** [plan.md](plan.md)
**Branch:** `fix/970-broken-archive-links`

## Phase 0 — Setup ✓

- [x] Branched off main at `4236a3a`
- [x] Archived #952 lifecycle to `tasks/archive/2026-05-26-skill-refs-952/`
- [ ] Commit lifecycle artifacts

## Phase 1 — 18 archive file edits (one commit)

- [ ] Pattern A: replace `../SPEC.md` link with `_(archived)_` in 15 files
- [ ] Pattern B: fix workflow path in 2 body.md files
- [ ] Pattern C: backtick-escape 2 `/no-such-post/` test URLs in link-validator/plan.md
- [ ] Pattern D: fix 2 broken refs in 2026-05-17-research-sweep-943/SPEC.md
- [ ] Verify grep counts → 0 (all 4 patterns)
- [ ] Verify `bundle exec jekyll build` exit 0
- [ ] Run `bash scripts/doc-audit.sh` — should show no internal-link findings
- [ ] Commit: `fix(#970): resolve 21 broken Markdown links across 18 archived task files`

## Phase 2 — Ship

- [ ] Push branch
- [ ] Open PR with `Closes #970`, **`bulk-content`** + `agent:qa-gatekeeper` labels (required: >15 files)
- [ ] CI green (or admin-merge)
- [ ] Squash-merge, delete branch
- [ ] Verify deploy
- [ ] Comment on #970 — next audit run should auto-close
