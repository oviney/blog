# TODO — Research Sweep Execution (#902)

**Spec:** [SPEC.md](../SPEC.md) · **Plan:** [plan.md](plan.md)
**Pinned:** date floor `2026-04-15` (prior sweep #816) · plan SHA `dafab0e`

---

## Phase 1 — Setup
- [ ] **T1** Scaffold `tasks/902-body.md` (with date-floor header) and `tasks/902-followups-plan.md` (column headers only)

## Phase 2 — Research (parallel)
- [ ] **T2a** Section 1 subagent: AI Agent Orchestration — `general-purpose` agent with SPEC §7 schema embedded; cap 4 findings; date floor 2026-04-15
- [ ] **T2b** Section 3 subagent: QE Automation — same prompt requirements; covers Playwright / pa11y / Lighthouse / GHA / WCAG 2.2
- [ ] **PARALLEL:** T2a + T2b launched in a single message with two `Agent` calls

## Phase 3 — Synthesis
- [ ] **T3** Validate both subagent returns against SPEC §7; reject + re-prompt if incomplete; merge into `tasks/902-body.md`; write Section 2 out-of-scope statement

## Phase 4 — Collision + substance
- [ ] **T4** Build file-overlap map; decide merge-or-sequence for each collision; record in `tasks/902-followups-plan.md`; enforce ≤ 6 cap
- [ ] **T5** AC-8 substance floor: ≥1 Action per in-scope section, else recorded justification

## CHECKPOINT-A — User review
- [ ] `tasks/902-body.md` complete and SPEC §7-compliant
- [ ] `tasks/902-followups-plan.md` ≤ 6 rows (or explicit override)
- [ ] T5 passed
- [ ] User approves before any `gh issue edit` / `gh issue create`

## Phase 5 — Push to GitHub
- [ ] **T6** `gh issue edit 902 --body-file tasks/902-body.md`; verify with diff
- [ ] **T7** `gh issue create` per planned row; append real numbers to `tasks/902-followups.md`; wire `Blocked by #N` for sequenced rows

## Phase 6 — Verify
- [ ] **T8** Run batch verification query; reconcile against plan

## CHECKPOINT-B — Verification clean
- [ ] T8 output equals planned spawn set, OR half-spawned remediation completed and recorded

## Phase 7 — Close + sanity
- [ ] **T9** `gh issue close 902` with closure summary (Action/Watch/No-op counts, parallel-vs-sequential map)
- [ ] **T10** `bundle exec jekyll build` succeeds; `git status --short` clean except for lifecycle artifacts

---

## Acceptance criteria checklist (mirrors SPEC §3)

- [ ] **AC-1** #902 body updated with Section 1 + 3 findings; Section 2 marked out-of-scope with rationale
- [ ] **AC-2** Every finding has a verifiable source
- [ ] **AC-3** Every "Recommended improvement" names specific files + an acceptance criterion
- [ ] **AC-4** Follow-up issues opened with `agent:*` labels + `Spawned from #902`; overlapping → sequential
- [ ] **AC-5** #902 closed with summary comment
- [ ] **AC-6** `tasks/plan.md` + `tasks/todo.md` reflect actual progress
- [ ] **AC-7** No code changes this pass
- [ ] **AC-8** Each in-scope section has ≥1 Action finding OR an explicit "no substantive change" justification
