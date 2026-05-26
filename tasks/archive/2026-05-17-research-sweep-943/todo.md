# TODO — Research Sweep Execution (#943)

**Spec:** _(archived)_ · **Plan:** [plan.md](plan.md)
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

## CHECKPOINT-A — User review
- [x] `tasks/943-body.md` complete and SPEC §7-compliant
- [x] T4-dedup complete; no Action overlaps #945/#946/#947
- [x] Planned-spawn count = **4** (exactly at cap)
- [x] T5 substance floor passed for §1, §3, §4
- [x] §4 persona-routing notes recorded
- [x] **User approved** — proceeded to T6/T7

## Phase 5 — Push to GitHub
- [x] **T6** Pushed body to #943 (cosmetic trailing-newline diff only)
- [x] **T7** Spawned 4 issues: #951 (Rec 3 subtitle) · #952 (Rec 1 skill docs) · #953 (Rec 4 mobile-nav) · #954 (Rec 2 cards, merged §4 F1+F3)

## Phase 6 — Verify
- [x] **T8** Batch query returned `951 952 953 954` — matches planned set exactly; per-issue labels confirmed; #952 carries both `agent:qa-gatekeeper` and `governance-update`

## CHECKPOINT-B — Verification clean
- [x] T8 output equals planned spawn set; no remediation needed

## Phase 7 — Close + sanity
- [x] **T9** #943 closed with SPEC-mandated summary (state=CLOSED, closedAt=2026-05-17T02:09:32Z)
- [x] **T10** `bundle exec jekyll build` succeeds (0.853s); `git status --short` clean except for `tasks/943-followups.md` (about to commit)

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
