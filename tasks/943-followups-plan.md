# Follow-ups Plan — Research Sweep #943 (pre-creation)

**Spec:** [../SPEC.md](../SPEC.md) §6, §10 · **Plan:** [plan.md](plan.md) T4-dedup, T4-collision
**Status:** EMPTY — populated by T4 after T3 synthesis
**Pinned:** §1/§3 floor `2026-05-01` · §4 floor `2026-02-15` · plan SHA `bfe8f5c`
**Dedup target:** #945, #946, #947 (open follow-ups from #902)

This file is **pre-creation truth**: it lists the issues we plan to spawn, the files each would touch, dedup decisions vs. open #902 followups, and collision/sequence calls. Committed **before** any `gh issue create` runs.

After spawning, the post-creation ledger (real issue numbers, verification results, remediation notes) is written to [`943-followups.md`](943-followups.md).

**Hard cap (SPEC §10 / AC-9):** ≤ **4** rows with `Status = Planned spawn`. Exceeding requires explicit user override before T7.

---

## Planned spawns + dedup decisions

| Rec # | Section | Title | Label | Files to change | Acceptance criterion (summary) | Status | Collides with |
|---|---|---|---|---|---|---|---|

<!--
Status values:
- `Planned spawn` — net-new recommendation; gh issue create at T7
- `Tracked in #N` — overlaps an open #902 followup; no spawn; recorded in body
- `Merged into Rec X` — collided with another finding, merged
- `Sequenced after Rec X` — independent issue with Blocked by chain
-->

---

## Dedup reclassifications (Tracked in #N)

<!-- T4-dedup populates: for each Action finding that overlapped #945/#946/#947, record:
- The finding's claim/title
- The existing issue number
- Reason (AC-overlap, files-subset, title-stem)
- One-line note on whether new research adds anything to the existing issue
-->

---

## File-overlap map (after dedup)

<!-- T4-collision populates from the remaining Planned-spawn rows. -->

---

## Collision decisions

<!-- T4-collision populates: for each file with >=2 Planned-spawn rows, record Merge vs Sequence + rationale + Blocked-by wiring. -->

---

## §4 persona-routing notes (for CHECKPOINT-A review)

<!-- T2c + T3 surface: for each §4 Action, justify the chosen agent:* label and list alternatives the user might prefer.
Example shape:
- **Rec X (§4):** chose `agent:creative-director` because change is a CSS/layout edit; alt is `agent:editorial-chief` if user wants editorial polish included in the same PR.
-->

---

## Cap status

- Planned-spawn row count: **0** (T4 to update)
- Cap: **4**
- Override required: **No** (T4 sets to Yes only if user explicitly approved exceeding 4)
- Tracked-in row count (informational, doesn't count against cap): **0**

---

## CHECKPOINT-A gate checklist (for user)

- [ ] Review `tasks/943-body.md` (synthesized findings, all three in-scope sections).
- [ ] Confirm T4-dedup decisions — every "Tracked in #N" classification is honest (not a way to dodge spawning a real Action).
- [ ] Approve planned spawns (titles, labels, files-to-change, ≤ 4 cap).
- [ ] Approve §4 persona-routing choices (creative vs. editorial vs. audience-researcher per finding).
- [ ] Confirm collision decisions if any post-dedup file overlaps remain.

Once approved, T6 pushes the body to #943 and T7 spawns the planned issues. Closure summary at T9 will include Tracked-in references back to #945/#946/#947.
