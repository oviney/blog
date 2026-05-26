# Plan — Expand Memory Discipline guardrails (#997)

**Spec:** [../SPEC.md](../SPEC.md)
**Issue:** [#997](https://github.com/oviney/blog/issues/997)
**Date:** 2026-05-26
**Branch:** `feat/997-expand-memory-discipline`
**Lifecycle phase:** PLAN

---

## Scope summary

Mechanical fan-out of the #990 pattern to the remaining 4 subagents. Same shape, same heading, agent-specific wording per SPEC §7. **Two atomic commits:** lifecycle + substantive.

---

## Dependency graph

```
Phase 0 (lifecycle commit + archive #990)
    │
    ▼
Phase 1 (4 prose-body edits in one commit)
    │
    ▼   Checkpoint A: 10-AC battery
    │
Phase 2 (ship)
```

---

## Phase 0 — Branch setup ✓

- Branched off main at `d05b514e`
- Archive #990 lifecycle from main to `tasks/archive/2026-05-26-memory-guardrails-990/`
- Commit lifecycle artifacts

## Phase 1 — Prose-body edits (one commit, four files)

Per SPEC §7, insert agent-specific `## Memory Discipline` section into each:

| File | Insertion point | Closer style |
|---|---|---|
| `.claude/agents/test-engineer.md` | After role intro, before `## Test Stack` | code-reviewer-style |
| `.claude/agents/playwright-test-planner.md` | After role intro, before first `##` | code-reviewer-style |
| `.claude/agents/playwright-test-generator.md` | After role intro, before first `##` | code-reviewer-style |
| `.claude/agents/playwright-test-healer.md` | After role intro, before first `##` | **"Audit before write"** (failure logs are leak-prone) |

**Verify:**
- `grep -c "^## Memory Discipline" .claude/agents/*.md` → 6
- `grep -c "Never persist to memory"` → 6
- ≥3 bullets per new section (4 in practice)
- `bundle exec jekyll build` exit 0 (move worktrees aside)

**Commit:** `feat(#997): expand Memory Discipline section to remaining 4 subagents`

## Checkpoint A — 10-AC battery

All 10 ACs per SPEC §4.

## Phase 2 — Ship

Push, PR with `agent:qa-gatekeeper`, admin-merge if blocked, post-deploy verify, comment on #997, update memory.

---

## Risks

Same as SPEC §10. Cross-file bullet leakage = visual inspection only.

## Out of scope

- code-reviewer.md / security-auditor.md (done in #998)
- Frontmatter edits
- Runtime enforcement
- Scope-guard rule for prose-body changes
