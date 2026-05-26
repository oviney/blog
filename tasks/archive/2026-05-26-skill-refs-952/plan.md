# Plan — Reference Claude Code `/goal` + `claude agents` in 2 SKILL files (#952)

**Spec:** [../SPEC.md](../SPEC.md)
**Issue:** [#952](https://github.com/oviney/blog/issues/952)
**Branch:** `feat/952-claude-code-skill-refs`
**Date:** 2026-05-26

---

## Scope

2 additive edits to SKILL files. **Two atomic commits:** lifecycle + substantive.

## Dependency graph

```
Phase 0 (lifecycle commit + archive #997)
    │
    ▼
Phase 1 (2 SKILL file edits in one commit)
    │
    ▼   Checkpoint A: 9-AC battery
    │
Phase 2 (ship)
```

## Phase 0 — Lifecycle commit

- Branched off main at `6ac2e1c7`
- Archived #997 lifecycle to `tasks/archive/2026-05-26-expand-memory-997/`
- Commit lifecycle artifacts

## Phase 1 — SKILL edits (one commit)

| File | Edit |
|---|---|
| `.github/skills/using-agent-skills/SKILL.md` | Add 2 rows to existing `## Slash Commands` table (after `/ship` row, ~line 124) per SPEC §7 |
| `.github/skills/jekyll-qa/SKILL.md` | Add 1 paragraph after the merge-decision-process bash block (~line 478), before "Merge with Overrides" subheading, per SPEC §7 |

**Verify:**
- `grep -E "/goal|claude agents" <both files> | wc -l` → ≥ 2 (likely 4: 2 rows in using-agent-skills + 1 paragraph mentioning both in jekyll-qa)
- `bundle exec jekyll build` exit 0
- No structural reorder

**Commit:** `feat(#952): reference /goal and claude agents in using-agent-skills and jekyll-qa SKILLs`

## Checkpoint A — 9-AC battery (per SPEC §4)

## Phase 2 — Ship

- Push branch
- Open PR with `Closes #952`, `agent:qa-gatekeeper` + **`governance-update`** labels (required — touches `.github/skills/`)
- CI green (or admin-merge per precedent)
- Squash-merge, delete branch
- Post-deploy verify
- Comment on #952

---

## Risks (from SPEC §9)

| Risk | Mitigation |
|---|---|
| Missing `governance-update` label → scope-guard fails | Apply at PR-open time |
| Phantom `build` + 1-reviewer block | Admin-merge per precedent |

## Out of scope (per SPEC §10)

- `.claude-plugin.json` packaging
- Refactoring SKILL structure
- OTEL / `continueOnBlock` docs
- Expanding to other SKILL files
