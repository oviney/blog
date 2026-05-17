# Plan — Research Sweep Execution (#902)

**Spec:** [SPEC.md](../SPEC.md)
**Issue:** [#902](https://github.com/oviney/blog/issues/902)
**Date:** 2026-05-14
**Lifecycle phase:** PLAN
**Pinned values:**
- Date floor: **2026-04-15** (`created_at` of #816, prior `Research Sweep —` issue, per SPEC §6)
- Plan-time SHA: **`dafab0e`** (used as default citation SHA when subagents read repo state at the start of the run)

---

## Context

`Research Sweep — 2026-05-01` (#902) needs findings for Section 1 (AI Agent Orchestration) and Section 3 (QE Automation); Section 2 (Copilot) is explicitly out of scope. The sweep produces inline edits to #902's body plus up to 6 follow-up issues. **No source code is touched in this lifecycle pass** (AC-7).

The plan optimises for two things SPEC.md flagged as load-bearing:

1. **Subagent fan-out integrity.** Two independent `general-purpose` subagents run concurrently. Their prompts must embed SPEC §7's quality bar verbatim and instruct self-rejection on incomplete findings (SPEC §6, binding clause). The collision pass after they return is the only mechanism that prevents the two outputs from spawning conflicting issues.

2. **Pre-GitHub checkpoint.** Nothing goes to `gh issue edit` or `gh issue create` until the user has reviewed (a) the staged issue body and (b) the planned follow-up set with file-overlap map. This is the human gate against a sweep that satisfies every AC mechanically but is substantively empty (AC-8) or spawns issue spam.

---

## Dependency graph

```
T1 (setup + date floor + body scaffold)
  │
  ├──► T2a (Section 1 subagent) ──┐
  └──► T2b (Section 3 subagent) ──┴──► T3 (synthesis → 902-body.md)
                                          │
                                          ├──► T4 (collision pass → 902-followups-plan.md)
                                          └──► T5 (AC-8 substance floor check)
                                                  │
                                                  ▼
                                          CHECKPOINT-A — user review
                                                  │
                                                  ▼
                                          T6 (gh issue edit 902)
                                                  │
                                                  ▼
                                          T7 (gh issue create × N → 902-followups.md)
                                                  │
                                                  ▼
                                          T8 (batch verification)
                                                  │
                                                  ▼
                                          CHECKPOINT-B — verification clean
                                                  │
                                                  ▼
                                          T9 (gh issue close 902 + summary)
                                                  │
                                                  ▼
                                          T10 (jekyll build + working tree clean)
```

T2a and T2b are independent (different research domains, different file sets) and run in a single message with two `Agent` tool calls. T3 cannot start until both return. T4 and T5 can run in parallel after T3 (both read 902-body.md; neither writes the other's artifact). T6 onward is strictly sequential because each step depends on real GitHub state from the prior step.

---

## Phase 1 — Setup

### T1 — Resolve date floor, scaffold issue body and followups-plan

**ACs satisfied:** AC-6 (partial — creates the scaffolds plan.md/todo.md reference)
**Touches:** `tasks/902-body.md` (new), `tasks/902-followups-plan.md` (new)
**Not a code task — file scaffolds only.**

**Steps:**

1. Create `tasks/902-body.md` with this header pinned at the top (literal, per SPEC §6):
   ```
   <!-- Date floor: 2026-04-15 (created_at of #816). Plan SHA: dafab0e. -->
   ```
2. Below the header, copy the three section skeletons from #902's current body verbatim. Mark Section 2 with the agreed out-of-scope rationale and the SPEC §10 reversal trigger. Leave Sections 1 and 3 stubs for T3 to fill.
3. Create `tasks/902-followups-plan.md` with column headers only:
   ```
   | Rec # | Section | Title | Label | Files to change | Acceptance criterion | Collides with |
   ```
4. Do **not** edit #902 on GitHub. All edits stay local until CHECKPOINT-A passes.

**Verify:** both files exist, header line in `902-body.md` matches the pinned values, `git status` shows only these two new files. No subagent has been spawned yet.

---

## Phase 2 — Research (parallel)

### T2a — Section 1 subagent: AI Agent Orchestration

**ACs satisfied:** AC-2 (sources), AC-3 (file-scoped recommendations) — for this section
**Touches:** no files directly; produces structured output consumed by T3.

**Subagent type:** `general-purpose`

**Prompt scaffolding (binding requirements from SPEC §6):**

- Pass the date floor `2026-04-15` and plan SHA `dafab0e` as the citation defaults.
- Embed SPEC §7's three-bucket schema verbatim in the subagent prompt:
  - Claim + Source (URL with date) + Repo impact (Action / Watch / No-op)
  - Watch requires explicit **trigger condition**
  - No-op requires **repo-state justification** with file/version
- Instruct the subagent to **self-reject and re-classify** any finding that lacks a required field before returning.
- Demand: every cited repo-state command MUST include the SHA at which it was run (SPEC §6, no carve-outs).
- Cap output: at most 4 findings (so total across both subagents fits in the hard-6 followup cap from SPEC §9, leaving headroom for "Watch" findings that don't spawn).

**Research scope:** new multi-agent frameworks, A2A patterns, escalation/handoff practices, LangChain/AutoGen/CrewAI/Claude Code subagent updates published **since 2026-04-15**.

**Required return shape** (consumed by T3 — keep it parseable):

```
## Findings
1. **Claim:** ...
   **Source:** <url> (YYYY-MM-DD)
   **Repo impact:** Action — <one-liner>
     **Files to change:** AGENTS.md, .github/skills/<...>/SKILL.md
     **Acceptance criterion:** <one checkbox-style criterion>
2. **Claim:** ...
   **Repo impact:** Watch — <reason>
     **Trigger condition:** <observable event>
3. ...

## Worth-watching (no action, no issue)
- ...
```

**Verify:** subagent returns a parseable findings block; every Watch has a trigger, every No-op has a repo-state citation. If not, T3 rejects and the subagent is re-prompted (cost: one round-trip).

---

### T2b — Section 3 subagent: QE Automation

**ACs satisfied:** AC-2, AC-3 — for this section
**Touches:** none directly.

**Subagent type:** `general-purpose`

**Prompt scaffolding:** same binding requirements as T2a.

**Research scope, since 2026-04-15:**

- Playwright (current version per `package.json` @ `dafab0e` — read at runtime)
- pa11y-ci (`^4.1.0` per `package.json`)
- Lighthouse (`^12.8.2` per `package.json`)
- GitHub Actions: relevant action version updates that touch `.github/workflows/*.yml`
- WCAG 2.2 / accessibility guidance changes affecting automated checks

**Cap:** at most 4 findings (same rationale as T2a).

**Required return shape:** same as T2a.

**T2a + T2b run in a single message with two `Agent` tool calls in parallel.** This is non-negotiable — running them sequentially doubles wall time for zero gain (no shared state).

---

## Phase 3 — Synthesis

### T3 — Merge subagent outputs into `tasks/902-body.md`

**ACs satisfied:** AC-1, AC-2 (final form), AC-3 (final form)
**Touches:** `tasks/902-body.md`

**Steps:**

1. Read both subagent returns. Validate against SPEC §7 (every Watch has trigger, every No-op has repo-state cite, every Action has files + AC). Reject and re-prompt either subagent if invalid.
2. Fill Section 1 and Section 3 of `tasks/902-body.md` with findings, preserving the bucket structure (Findings → Worth-watching).
3. Section 2: write the agreed one-liner ("Out of scope — migrating off Copilot Coding Agent to local Claude Code with the agent-skills lifecycle. Reopen if Copilot ships local-runtime parity or a Copilot-Claude-Code bridge. See SPEC.md §10.")
4. **Do not** push to GitHub. The file stays local until CHECKPOINT-A.

**Verify:** `tasks/902-body.md` parses cleanly as markdown; every finding has all required fields; Section 2 contains the out-of-scope statement and reversal trigger.

---

## Phase 4 — Collision pass + substance floor

### T4 — Collision pass → `tasks/902-followups-plan.md`

**ACs satisfied:** AC-4 (planning portion — the spawned-issue portion is T7)
**Touches:** `tasks/902-followups-plan.md`

**Steps:**

1. Extract every **Action** finding from `tasks/902-body.md`. Each contributes one row to the plan file.
2. Build a file-overlap map: any file path appearing in two or more rows is a collision.
3. For each collision, decide and record:
   - **Merge** — combine the two recommendations into a single issue, OR
   - **Sequence** — keep two issues, but mark the second `Blocked by <placeholder-N>` (real number filled in T7).
4. Hard cap: if the post-merge row count exceeds **6**, stop and surface to the user per SPEC §9 (explicit override required to proceed).

**Verify:** `tasks/902-followups-plan.md` has one row per planned issue; the "Collides with" column is filled or `—`; row count ≤ 6 (or has user override note).

---

### T5 — AC-8 substance floor check

**ACs satisfied:** AC-8
**Touches:** `tasks/902-body.md` (only if justification text needs to be added)

**Steps:**

1. For Section 1 (AI Agent Orchestration): count Action-bucket findings. If ≥1, satisfied. If 0, require an explicit "no substantive change identified after researching ≥ N sources from [list]" justification recorded in the section body.
2. Repeat for Section 3 (QE Automation).
3. If either section is all-Watch/all-No-op without justification, **block** — re-engage the subagent for that section with explicit instruction to surface at least one Action OR draft the justification text directly.

**Verify:** every in-scope section either has ≥1 Action finding or a justification paragraph. Without both being true, CHECKPOINT-A cannot pass.

---

### CHECKPOINT-A — Human review before anything touches GitHub

**Gate criteria (all must be true):**

- [ ] `tasks/902-body.md` is complete; T3 validation passed.
- [ ] `tasks/902-followups-plan.md` row count ≤ 6 (or has explicit user override).
- [ ] T5 substance floor check passed (every in-scope section has ≥1 Action OR a recorded justification).
- [ ] No `gh issue edit` or `gh issue create` has been called yet.

**User reviews:** `tasks/902-body.md` content + `tasks/902-followups-plan.md` planned issues. Approves or returns to T3 with edits.

---

## Phase 5 — Push to GitHub

### T6 — Apply staged body to #902

**ACs satisfied:** AC-1 (final, on GitHub)
**Touches:** GitHub issue #902 (remote state).

```bash
gh issue edit 902 --repo oviney/blog --body-file tasks/902-body.md
```

**Verify:** `gh issue view 902 --repo oviney/blog --json body --jq .body | diff - tasks/902-body.md` → empty diff.

---

### T7 — Create follow-up issues, record real numbers

**ACs satisfied:** AC-4
**Touches:** GitHub remote (new issues) + `tasks/902-followups.md` (new local file).

**Steps:**

1. For each row in `tasks/902-followups-plan.md`, run `gh issue create` with the SPEC §8 body template (Spawned from #902 + Finding + Files to change + Acceptance criteria + Out of scope) and the appropriate `agent:*` label.
2. After each create, append the returned issue number to `tasks/902-followups.md` (the post-creation ledger — distinct from the plan file per SPEC §6).
3. For any row marked "Sequence" in the plan, edit the dependent issue's body to insert the real `Blocked by #N` line once the blocker's number is known.

**Verify (per-issue):** `gh issue view <N> --repo oviney/blog --json labels,body` returns the required label and the `Spawned from #902` line.

---

## Phase 6 — Verify

### T8 — Batch verification

**ACs satisfied:** AC-4 (verified portion), AC-5 (precondition)
**Touches:** none on disk; reads GitHub state.

**Command (from SPEC §11):**

```bash
gh issue list --repo oviney/blog --search "Spawned from #902" --json number,labels,body \
  --jq '.[] | select((.labels | map(.name) | any(test("^agent:"))) and (.body | contains("Spawned from #902"))) | .number'
```

**Verify:** the returned set equals the planned spawn set in `tasks/902-followups-plan.md`. Any divergence triggers CHECKPOINT-B remediation.

---

### CHECKPOINT-B — Verification clean

**Gate criteria:**

- [ ] T8 output matches the plan exactly.
- [ ] If not, SPEC §11 half-spawned remediation is applied: `gh issue edit` to patch in place, or close + `superseded by #M` and create replacement. Either path updates `tasks/902-followups.md` before proceeding.

---

## Phase 7 — Close + sanity

### T9 — Close #902 with summary

**ACs satisfied:** AC-5
**Touches:** GitHub remote.

Closure comment includes:
- In-scope sections covered (1 and 3)
- Number of findings per section (Action / Watch / No-op counts)
- Number of follow-up issues opened, with parallel-vs-sequential map
- Link to `tasks/902-followups.md` in the commit that lands this lifecycle pass

```bash
gh issue close 902 --repo oviney/blog --comment "$(cat tasks/902-closure.md)"
```

**Verify:** `gh issue view 902 --json state` returns `CLOSED`; closure comment is visible.

---

### T10 — Final sanity

**ACs satisfied:** none new; final hygiene per SPEC §11.

```bash
bundle exec jekyll build         # must succeed
git status --short               # only SPEC.md + tasks/* + (nothing else)
```

**Verify:** Jekyll exits 0; git status is clean except for the lifecycle artifacts.

---

## Risk register

| Risk | Mitigation |
|---|---|
| Subagent returns findings that don't meet §7 quality bar | T3 rejects and re-prompts; one round-trip cost. Subagent prompt embeds §7 verbatim per SPEC §6 binding clause. |
| Both subagents recommend changes to `AGENTS.md` or `.github/skills/` (collision) | T4 collision pass forces merge-or-sequence before T7; surfaced in followups-plan.md |
| Sweep is substantively empty (all Watch/No-op) | T5 AC-8 substance floor; either ≥1 Action per section or recorded justification |
| User catches a problem at CHECKPOINT-A | Loop returns to T3; nothing on GitHub has changed yet, so cost is local-only |
| `gh issue create` partial failure (4 of 6 succeed) | SPEC §11 half-spawned remediation: patch-in-place or supersede; tracked in followups.md before #902 closes |
| Follow-up issue count exceeds 6 | T4 hard cap; surface to user before proceeding (SPEC §9 explicit override) |
| `package.json` bump recommended → lockfile + CI cascade | SPEC §9 "Ask first" row; T7 issue body MUST surface impact before user approves the bump |
| Date floor wrong (e.g., #816 isn't actually the most recent prior sweep) | Pinned at top of plan.md and 902-body.md; user can correct at CHECKPOINT-A before any subagent is spawned |
