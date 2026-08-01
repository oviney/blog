# Plan — Fix 21 broken Markdown links in archived task artifacts (#970)

**Spec:** [../SPEC.md](../SPEC.md)
**Issue:** [#970](https://github.com/oviney/blog/issues/970)
**Branch:** `fix/970-broken-archive-links`
**Date:** 2026-05-26

## Scope

23-file PR with `bulk-content` label. Mechanical search-and-replace across 18 archive files, plus 5 lifecycle.

## Dependency graph

```
Phase 0 (lifecycle commit + #952 archive)
    │
    ▼
Phase 1 (18 archive file edits, one commit)
    │   per-pattern fixes per SPEC §3
    │
    ▼   Checkpoint A: 8-AC battery
    │
Phase 2 (ship with bulk-content label)
```

## Phase 0 ✓

- Branched off main at `4236a3a` (#1000 merge)
- Archived #952 lifecycle to `tasks/archive/2026-05-26-skill-refs-952/`
- Commit lifecycle artifacts

## Phase 1 — 18 archive file edits (one commit)

**Pattern A (15 files): Replace `[../SPEC.md](../SPEC.md)` with `_(archived)_`.** Search-and-replace via `sed -i` or per-file Edit.

Files: 2026-05-10-link-validator/plan.md, 2026-05-14-research-sweep-902/{plan,todo,902-followups-plan,902-followups}.md, 2026-05-17-bulk-content-956/{plan,todo}.md, 2026-05-17-puppeteer-chrome-cache-958/{plan,todo}.md, 2026-05-17-research-sweep-943/{plan,todo,943-followups-plan,943-followups}.md, 2026-05-17-subtitle-backfill-951/{plan,todo}.md.

Exact pattern to look for: any link with text `../SPEC.md` or `[Spec](../SPEC.md)` etc. The line typically reads `**Spec:** [../SPEC.md](../SPEC.md)` — verify per-file.

**Pattern B (2 files): Fix workflow path.**
- 2026-05-14-research-sweep-902/902-body.md: `../../actions/workflows/research-sweep.yml` → `../../../.github/workflows/research-sweep.yml`
- 2026-05-17-research-sweep-943/943-body.md: same fix

**Pattern C (1 file): Escape test-data URLs.**
- 2026-05-10-link-validator/plan.md: wrap `/2026/99/99/no-such-post/` in backticks (2 occurrences). If audit still trips after escape, fall back to plain text without slashes.

**Pattern D (1 file): Fix 2 broken refs in `2026-05-17-research-sweep-943/SPEC.md`.**
- `tasks/archive/2026-05-14-research-sweep-902/SPEC.md` → `../2026-05-14-research-sweep-902/SPEC.md`
- `tasks/lessons.md` → `../../lessons.md`

**Verify (after edits):**
```bash
grep -r '\.\./SPEC\.md' tasks/archive/ | wc -l                          # → 0
grep -r '\.\./\.\./actions/workflows/' tasks/archive/ | wc -l           # → 0
grep -r 'tasks/archive/2026-05-14-research-sweep-902/SPEC\.md' tasks/archive/2026-05-17-research-sweep-943/ | wc -l   # → 0
grep -r 'tasks/lessons\.md' tasks/archive/ | wc -l                      # → 0
bash scripts/doc-audit.sh                                                # → no internal-link findings
mv worktrees /tmp/_w && mv .worktrees /tmp/_dw && bundle exec jekyll build; mv /tmp/_w worktrees && mv /tmp/_dw .worktrees   # → exit 0
```

**Commit:** `fix(#970): resolve 21 broken Markdown links across 18 archived task files`

## Checkpoint A — 8-AC battery (per SPEC §4)

## Phase 2 — Ship

- Push branch
- Open PR with `Closes #970`, labels: `agent:qa-gatekeeper` + **`bulk-content`** (required; >15 files)
- CI green (or admin-merge per precedent)
- Squash-merge, delete branch
- Verify deploy + comment on #970
- The next doc-audit run should close #970 automatically when it sees no internal-link findings

## Risks (per SPEC §9)

- Backtick escape might not actually exempt URLs from the audit — fallback: plain text
- `bulk-content` label needs to be applied at PR-open time
- Phantom `build` + 1-reviewer block → admin-merge

## Out of scope (per SPEC §10)

- `_posts/` broken-link warnings (different audit)
- Refactoring archive structure
- Active lifecycle artifacts
