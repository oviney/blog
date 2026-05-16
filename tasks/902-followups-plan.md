# Follow-ups Plan — Research Sweep #902 (pre-creation)

**Spec:** [../SPEC.md](../SPEC.md) §6, §8 · **Plan:** [plan.md](plan.md) T4
**Status:** EMPTY — populated at T4 after T3 synthesis
**Pinned:** date floor `2026-04-15` (#816) · plan SHA `dafab0e`

This file is **pre-creation truth**: it lists the issues we plan to spawn, the files each would touch, and any collision/sequence decisions. It is committed **before** any `gh issue create` runs.

After spawning, the post-creation ledger (real issue numbers, verification results, remediation notes) is written to a separate file: [`902-followups.md`](902-followups.md). The two files are distinct per SPEC.md §6.

**Hard cap (SPEC §9):** ≤ 6 rows. Exceeding requires explicit user override before T7.

---

## Planned issues

| Rec # | Section | Title | Label | Files to change | Acceptance criterion | Collides with |
|---|---|---|---|---|---|---|

<!-- T4 populates rows. One row per Action-bucket finding from 902-body.md. -->
<!-- "Collides with": list other Rec #s that touch any of the same files; "—" if none. -->
<!-- For collisions: decide Merge (combine into one issue, list both findings in body) or Sequence -->
<!-- (keep separate, second carries "Blocked by #N" placeholder until T7 fills real number). -->

---

## File-overlap map

<!-- T4 fills: file path → list of Rec #s that touch it. Any file with ≥2 Rec #s is a collision. -->
<!-- Example shape:
| File | Touched by |
|---|---|
| AGENTS.md | Rec 1, Rec 3 |
| .github/skills/jekyll-qa/SKILL.md | Rec 2 |
-->

---

## Collision decisions

<!-- T4 fills: for every collision row above, record the decision and rationale. -->
<!-- Example:
- **AGENTS.md (Rec 1 + Rec 3):** Merge into a single issue. Rationale: both edits are persona-roster updates, splitting would cause merge conflicts on the same lines.
- **scripts/foo.js (Rec 2 + Rec 5):** Sequence — Rec 2 lays foundation, Rec 5 builds on it. Rec 5 issue body carries "Blocked by #N" placeholder.
-->

---

## Cap status

- Planned row count: **0** (T4 to update)
- Cap: 6
- Override required: **No** (T4 sets to Yes only if user explicitly approved exceeding 6)
