# TODO — Research Sweep Execution (#943)

**Spec:** [../SPEC.md](../SPEC.md) · **Plan:** [plan.md](plan.md)
**Pinned:** §1/§3 floor `2026-05-01` · §4 floor `2026-02-15` · plan SHA `bfe8f5c` · spawn cap **4** · dedup against **#945, #946, #947**

---

## Phase 1 — Setup
- [ ] **T1** Scaffold `tasks/943-body.md` (with §1=2026-05-01 / §3=2026-05-01 / §4=2026-02-15 header) and `tasks/943-followups-plan.md` (column headers + new `Status` column)

## Phase 2 — Research (parallel)
- [ ] **T2a** §1 subagent — `general-purpose` with SPEC §7 + Tracked-in bucket; cap 3 findings; date floor 2026-05-01; explicit dedup against #945/#946
- [ ] **T2b** §3 subagent — same prompt requirements; cap 3 findings; date floor 2026-05-01; explicit dedup against #947 (Playwright)
- [ ] **T2c** §4 subagent — Audience Experience / UX / a11y-usability; cap 4 findings; date floor 2026-02-15; persona-routing justification on every Action
- [ ] **PARALLEL:** T2a + T2b + T2c launched in single message with three `Agent` calls

## Phase 3 — Synthesis
- [ ] **T3** Validate three subagent returns; merge into `tasks/943-body.md`; §2 out-of-scope statement intact

## Phase 4 — Dedup + collision + substance
- [ ] **T4-dedup** Cross-check Action findings against #945/#946/#947; reclassify overlaps as **Tracked in #N**
- [ ] **T4-collision** File-overlap pass among remaining Action findings; record decisions in `tasks/943-followups-plan.md`
- [ ] **T5** AC-8 substance floor per section: §1, §3, §4 each have ≥1 Action OR justification (Tracked-in does NOT satisfy)

## CHECKPOINT-A — User review (PRE-GITHUB GATE)
- [ ] `tasks/943-body.md` complete and SPEC §7-compliant
- [ ] T4-dedup complete; no Action overlaps #945/#946/#947
- [ ] Planned spawn count ≤ **4** (cap)
- [ ] T5 substance floor passed for §1, §3, §4
- [ ] §4 persona-routing flagged for user
- [ ] **User approves before any `gh issue edit` / `gh issue create`**

## Phase 5 — Push to GitHub
- [ ] **T6** `gh issue edit 943 --body-file tasks/943-body.md`; verify with diff
- [ ] **T7** `gh issue create` per planned spawn row; append real numbers to `tasks/943-followups.md`; wire `Blocked by #N` for sequenced rows

## Phase 6 — Verify
- [ ] **T8** Run batch verification query; reconcile against plan

## CHECKPOINT-B — Verification clean
- [ ] T8 output equals planned spawn set, OR half-spawned remediation completed and recorded

## Phase 7 — Close + sanity
- [ ] **T9** `gh issue close 943` with closure summary (Action/Watch/No-op/Tracked-in counts per section, parallel-vs-sequential map for new spawns, Tracked-in references back to #945/#946/#947)
- [ ] **T10** `bundle exec jekyll build` succeeds; `git status --short` clean except for lifecycle artifacts

---

## Acceptance criteria checklist (mirrors SPEC §3)

- [ ] **AC-1** #943 body updated with §1, §3, §4 findings; §2 marked out-of-scope w/ statement + reversal trigger
- [ ] **AC-2** Every finding has a verifiable source
- [ ] **AC-3** Every Action recommendation names files + acceptance criterion
- [ ] **AC-4 (dedup-aware)** Spawned issues are net-new only; overlaps recorded as `Tracked in #N` in sweep body
- [ ] **AC-5** #943 closed with summary comment
- [ ] **AC-6** `tasks/plan.md` + `tasks/todo.md` reflect actual progress
- [ ] **AC-7** No code changes this pass
- [ ] **AC-8** Per-section substance floor: §1, §3, §4 each have ≥1 Action OR justification (Tracked-in doesn't satisfy)
- [ ] **AC-9** Spawn count ≤ **4** (hard cap; > 4 requires explicit user override)
