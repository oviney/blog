# TODO — Expand Memory Discipline guardrails (#997)

**Spec:** _(archived)_ · **Plan:** [plan.md](plan.md)
**Branch:** `feat/997-expand-memory-discipline`

---

## Phase 0 — Setup ✓

- [x] Branched off main at `d05b514e`
- [ ] Archive #990 lifecycle to `tasks/archive/2026-05-26-memory-guardrails-990/`
- [ ] Commit lifecycle artifacts

## Phase 1 — Prose-body edits (one commit)

- [ ] 1.1 Insert §7 wording into `.claude/agents/test-engineer.md`
- [ ] 1.2 Insert §7 wording into `.claude/agents/playwright-test-planner.md`
- [ ] 1.3 Insert §7 wording into `.claude/agents/playwright-test-generator.md`
- [ ] 1.4 Insert §7 wording into `.claude/agents/playwright-test-healer.md` (uses "Audit before write" closer)
- [ ] Verify all 10 ACs
- [ ] Commit: `feat(#997): expand Memory Discipline section to remaining 4 subagents`

## Checkpoint A — Full 10-AC battery (per SPEC §4)

## Phase 2 — Ship

- [ ] Push branch
- [ ] Open PR with `Closes #997`, `agent:qa-gatekeeper` label
- [ ] CI green (or admin-merge per precedent)
- [ ] Squash-merge, delete branch
- [ ] Post-deploy verify
- [ ] Comment on #997
- [ ] Update [[reference-subagent-memory]] memory — all 6 agents now guarded
