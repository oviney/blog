# TODO — Research Sweep Execution (#943)

**Spec:** [../SPEC.md](../SPEC.md) · **Plan:** [plan.md](plan.md)
**Pinned:** §1/§3 floor `2026-05-01` · §4 floor `2026-02-15` · plan SHA `bfe8f5c` · spawn cap **4** · dedup against **#945, #946, #947**

---

## Phase 1 — Setup
- [x] **T1** Scaffold `tasks/943-body.md` (header pinned w/ per-section date floors + dedup target) and `tasks/943-followups-plan.md` (column headers + Status column + CHECKPOINT-A gate checklist) — committed

## Phase 2 — Research (parallel)
- [x] **T2a** §1 subagent returned — 3 findings (1A + 1W + 1T#946); SPEC §7-compliant
- [x] **T2b** §3 subagent returned — 3 findings (0A + 1W + 1N + 1T#947); AC-8 needs justification
- [x] **T2c** §4 subagent returned — 4 findings (4A); persona-routing justified per finding
- [x] **PARALLEL:** Three `Agent` calls in single message; total ~8 min wall time

## Phase 3 — Synthesis
- [x] **T3** Merged all returns into `tasks/943-body.md`; §2 out-of-scope statement intact; §3 substance-floor justification written

## Phase 4 — Dedup + collision + substance
- [x] **T4-dedup** Subagents performed precheck during research; verified at synthesis — §1 F3 → Tracked in #946 (A2A reinforces #946 direction); §3 F2 → Tracked in #947 (exact AC overlap)
- [x] **T4-collision** §4 F1 (excerpt consistency) + §4 F3 (author byline) touched same 5 card files → **merged** into Rec 2; result is 4 planned spawns, exactly at cap
- [x] **T5** AC-8: §1 has 1 Action ✓; §3 satisfied via recorded "no substantive change identified after researching ≥3 sources" justification; §4 has 4 Actions (3 spawn-bound post-merge) ✓

## CHECKPOINT-A — User review (CURRENT GATE)
- [x] `tasks/943-body.md` complete and SPEC §7-compliant
- [x] T4-dedup complete; no Action overlaps #945/#946/#947 (the two overlaps reclassified)
- [x] Planned-spawn count = **4** (exactly at cap, no override needed)
- [x] T5 substance floor passed for §1, §3, §4
- [x] §4 persona-routing notes recorded in followups-plan
- [ ] **User approves before T6 / T7 — see `tasks/943-followups-plan.md` § CHECKPOINT-A gate checklist**

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
