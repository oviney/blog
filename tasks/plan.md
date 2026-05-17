# Plan — Research Sweep Execution (#943)

**Spec:** [SPEC.md](../SPEC.md)
**Issue:** [#943](https://github.com/oviney/blog/issues/943)
**Date:** 2026-05-17
**Lifecycle phase:** PLAN
**Pinned values:**
- §1/§3 date floor: **2026-05-01** (#902 `created_at`)
- §4 date floor: **2026-02-15** (today − 90d; #902 didn't cover §4)
- Plan SHA: **`bfe8f5c`** (default citation SHA for repo-state reads by subagents at start of run)
- Hard spawn cap: **4**
- Open #902 follow-ups subagents must dedup against: **#945** (subagent `memory:` frontmatter), **#946** (`AGENTS.md` handoff graph), **#947** (Playwright 1.60)

---

## Context

#943 was filed on 2026-05-15 against the **old workflow template** — no inline methodology guardrails. The guardrails are still binding via SPEC.md, `tasks/lessons.md` L3, and the just-merged `.github/workflows/research-sweep.yml` @ `bfe8f5c` (effective on the next cron fire). This sweep is the **first execution that explicitly inherits the guardrails without them being inline in the issue body** — that's a noteworthy lifecycle moment.

Two things make #943 structurally different from #902:

1. **Three subagents, not two.** §4 (Audience Experience) is fresh research territory with a different domain (UX / audience research / a11y-from-usability). All three subagents — §1, §3, §4 — fan out in a single message.
2. **Dedup precheck is a binding pre-Action gate.** With only ~2 weeks since #902 closed, the §1/§3 subagents are highly likely to surface things already tracked in #945/#946/#947. Without the precheck, T7 would spawn duplicates. The precheck is a new step inserted between T3 (synthesis) and T4 (collision pass).

---

## Dependency graph

```
T1 (setup + date-floor headers + scaffolds)
  │
  ├──► T2a (§1 subagent — date floor 2026-05-01) ──┐
  ├──► T2b (§3 subagent — date floor 2026-05-01) ──┼──► T3 (synthesis → 943-body.md)
  └──► T2c (§4 subagent — date floor 2026-02-15) ──┘
                                                       │
                                                       ▼
                                          T4-dedup (precheck vs #945/#946/#947)
                                                       │
                                                       ├──► reclassify overlap as "Tracked in #N"
                                                       │
                                                       ▼
                                          T4-collision (file-overlap among remaining Action findings)
                                                       │
                                          T5 (AC-8 per-section substance floor: §1, §3, §4)
                                                       │
                                                       ▼
                                          CHECKPOINT-A — user review
                                                       │
                                                       ▼
                                          T6 (gh issue edit 943)
                                                       │
                                                       ▼
                                          T7 (gh issue create ≤ 4 → 943-followups.md)
                                                       │
                                                       ▼
                                          T8 (batch verification)
                                                       │
                                                       ▼
                                          CHECKPOINT-B — verification clean
                                                       │
                                                       ▼
                                          T9 (gh issue close 943 + summary)
                                                       │
                                                       ▼
                                          T10 (jekyll build + git status clean)
```

T2a/T2b/T2c are independent — three parallel `Agent` calls in a single message. T3 cannot start until all three return. T4-dedup must precede T4-collision (dedup may reclassify Action → Tracked-in, reducing the collision surface). T5 runs after dedup so it correctly counts only true Action findings, not Tracked-in-#N. T6 onward is strictly sequential.

---

## Phase 1 — Setup

### T1 — Scaffold staged body + followups-plan

**ACs satisfied:** AC-6 (partial)
**Touches:** `tasks/943-body.md` (new), `tasks/943-followups-plan.md` (new)
**Not a code task — file scaffolds only.**

**Steps:**

1. Create `tasks/943-body.md` with this header pinned at the top (literal):
   ```
   <!-- Date floors: §1=2026-05-01, §3=2026-05-01, §4=2026-02-15. Plan SHA: bfe8f5c. -->
   <!-- Dedup against open #902 followups: #945, #946, #947. -->
   ```
2. Below the header, copy the §1/§3/§4 section skeletons from #943's current body verbatim. Mark §2 with the agreed out-of-scope rationale and SPEC §10 reversal trigger (reuse the language from #902's body).
3. Create `tasks/943-followups-plan.md` with column headers including a new `Status` column to distinguish `Planned spawn` from `Tracked in #N`:
   ```
   | Rec # | Section | Title | Label | Files to change | Acceptance criterion | Status | Collides with |
   ```
4. Do **not** edit #943 on GitHub. All edits stay local until CHECKPOINT-A.

**Verify:** both files exist; pinned header on `943-body.md` matches values above; `git status` shows only these two new files; no subagent has been spawned yet.

---

## Phase 2 — Research (parallel)

### T2a — §1 subagent: AI Agent Orchestration

**ACs satisfied:** AC-2, AC-3 (for §1)
**Touches:** none directly; produces structured output consumed by T3.

**Subagent type:** `general-purpose`
**Date floor:** 2026-05-01

**Prompt scaffolding (binding requirements):**

- Embed SPEC §7 three-bucket schema verbatim PLUS the new **Tracked in #N** bucket (with criteria: "if any recommendation overlaps the `Files to change` or `Acceptance criteria` of #945, #946, or #947, classify as Tracked-in").
- Pass the open #902 followup numbers + bodies as context so the subagent can perform its own dedup precheck (also re-run at T4-dedup for safety).
- Inherit from #948 / lessons.md L3: dep-bump-for-CVE recommendations must paste `node ... overrides` + `npm audit --omit=dev` output.
- SHA + command on every repo-state cite (no carve-outs).
- Self-reject incomplete findings before returning.
- **Cap output: 3 findings** (lower than #902's 4 because §1 is the section most likely to overlap with #945/#946; we want headroom for §3 and §4).

**Research scope:** new multi-agent frameworks, A2A patterns, escalation/handoff, LangChain/AutoGen/CrewAI/Claude Code subagent updates published **since 2026-05-01** (note: most relevant material is likely already in #945's `memory:` finding and #946's handoff-graph finding — surface only genuinely new developments).

**Required return shape:** same Findings + Worth-watching structure as #902 plan §T2a.

---

### T2b — §3 subagent: QE Automation

**ACs satisfied:** AC-2, AC-3 (for §3)
**Touches:** none directly.

**Subagent type:** `general-purpose`
**Date floor:** 2026-05-01

**Prompt scaffolding:** same binding requirements as T2a, with these additions:

- Repo state to ground against: `package.json` pins as of `bfe8f5c` (lockfile shows pa11y-ci 4.1.1 after #944, `@playwright/test ^1.59.1`, `lighthouse ^12.8.2`).
- **Dedup precheck explicit**: any Playwright bump recommendation is **already tracked in #947**; classify as Tracked-in. The subagent must search for #947 collisions before recommending Playwright work.

**Research scope, since 2026-05-01:** Playwright (verify nothing new since 1.60.0 already in #947), pa11y-ci 4.1.x+, Lighthouse 13.x evolution, GHA action versions, WCAG 2.2 errata. **Cap: 3 findings.**

---

### T2c — §4 subagent: Audience Experience / UI / UX / Usability

**ACs satisfied:** AC-2, AC-3 (for §4)
**Touches:** none directly.

**Subagent type:** `general-purpose`
**Date floor:** **2026-02-15** (wider than §1/§3 — #902 didn't cover this section).

**Prompt scaffolding:** same binding requirements as T2a, with these additions:

- **Research domain is different** — Nielsen Norman Group, UX literature, blog reader-journey research, mobile ergonomics, scanability heuristics, trust cues. Less GitHub-release-driven than §1/§3.
- **Repo state to ground against**:
  - `_layouts/`, `_includes/` (page templates)
  - `_sass/economist-theme.scss` (design system)
  - `_posts/` index (24 posts as of `bfe8f5c`)
  - Search, topic pages, blog index, homepage — read the corresponding markdown/HTML
  - Production URL `https://www.viney.ca` (live state may be ahead of `main` if deploys lag)
- **Persona-routing note:** §4 Action findings could route to `agent:creative-director` (CSS/layout), `agent:editorial-chief` (content/SEO/summaries), or `agent:audience-researcher` (research synthesis). Each finding's `Label` field must justify its choice in one line.
- **Cap: 4 findings** (largest of the three subagents because §4 is fresh territory).

**Required return shape:** same as T2a/T2b; persona-route justification appended to each Action finding's `Label` line.

---

**T2a + T2b + T2c run in a single message with three parallel `Agent` calls.**

---

## Phase 3 — Synthesis

### T3 — Merge subagent outputs into `tasks/943-body.md`

**ACs satisfied:** AC-1, AC-2 (final form), AC-3 (final form)
**Touches:** `tasks/943-body.md`

**Steps:**

1. Read all three subagent returns. Validate against SPEC §7 + the new Tracked-in bucket. Re-prompt any subagent whose output lacks required fields.
2. Fill §1, §3, §4 of `tasks/943-body.md` with findings, preserving bucket structure (Findings → Worth-watching, with Tracked-in items inline in Findings as a distinct sub-bucket).
3. §2: write the agreed out-of-scope statement and reversal trigger (verbatim from `tasks/archive/2026-05-14-research-sweep-902/902-body.md` §2).
4. **Do not** push to GitHub.

**Verify:** `tasks/943-body.md` parses cleanly; every finding has required fields; §2 statement intact.

---

## Phase 4 — Dedup precheck + collision pass + substance floor

### T4-dedup — Cross-check Action findings against #945/#946/#947

**ACs satisfied:** AC-4 (precheck portion — spawn portion is T7)
**Touches:** `tasks/943-followups-plan.md`, possibly `tasks/943-body.md` (reclassification edits)

**Steps:**

1. For each finding currently classified as **Action** in `tasks/943-body.md`, fetch the bodies of #945, #946, #947 via `gh issue view`.
2. Apply overlap rules:
   - **AC-overlap**: any finding whose acceptance criterion overlaps an existing issue's AC → reclassify as **Tracked in #N**.
   - **Files-to-change overlap**: any finding whose `Files to change` list is a subset of an existing issue's files → reclassify as Tracked-in (the existing issue's PR will already touch those files).
   - **Title-stem overlap**: heuristic — if titles share a meaningful stem (e.g., "Playwright bump"), flag for human review.
3. Edit `tasks/943-body.md` to move reclassified findings into the Tracked-in sub-bucket with a `**Tracked in #N**` reference line.
4. Record reclassifications in `tasks/943-followups-plan.md`: dedicated section with each affected finding, the existing issue number, and the reason.

**Verify:** no Action finding in `tasks/943-body.md` after this step has AC or Files-to-change overlap with #945/#946/#947. If any survive, T4-dedup is incomplete.

---

### T4-collision — File-overlap pass among remaining Action findings

**ACs satisfied:** AC-4 (planning portion)
**Touches:** `tasks/943-followups-plan.md`

Same logic as #902 plan §T4 — diff `Files to change` sets across remaining Action findings, decide merge-or-sequence for each collision.

**Verify:** `tasks/943-followups-plan.md` has one row per planned spawn (Status = `Planned spawn`); collision decisions recorded; total spawn count ≤ **4** (hard cap, AC-9). > 4 → surface to user for explicit override.

---

### T5 — AC-8 substance floor per section

**ACs satisfied:** AC-8
**Touches:** `tasks/943-body.md` (only if justification text needs to be added)

**Steps (per in-scope section):**

1. Count **Action-bucket** findings. Tracked-in does **not** count toward substance floor per SPEC §8.
2. If ≥1 Action: satisfied.
3. If 0 Action: require an explicit justification of the form "no substantive change identified for §<N> after researching ≥ N sources from [list]" recorded in that section's body. Re-engage the subagent for that section if the justification can't be honestly stated.

**Verify:** §1, §3, §4 each have either ≥1 Action OR a recorded justification paragraph.

---

### CHECKPOINT-A — Human review before anything touches GitHub

**Gate criteria (all must be true):**

- [ ] `tasks/943-body.md` complete; T3 validation passed.
- [ ] T4-dedup complete — no Action finding overlaps #945/#946/#947.
- [ ] `tasks/943-followups-plan.md` planned-spawn count ≤ 4 (or explicit user override).
- [ ] T5 per-section substance floor passed.
- [ ] No `gh issue edit` or `gh issue create` has been called yet.
- [ ] **§4 persona-routing flagged for user** — review each §4 Action's `agent:*` label justification.

---

## Phase 5 — Push to GitHub

### T6 — Apply staged body to #943

**ACs satisfied:** AC-1 (final, on GitHub)
**Touches:** GitHub issue #943.

```bash
gh issue edit 943 --repo oviney/blog --body-file tasks/943-body.md
```

**Verify:** `gh issue view 943 --json body --jq .body | diff - tasks/943-body.md` returns empty (or trailing-newline-only diff per #902 T6 precedent — acceptable).

---

### T7 — Create follow-up issues, record real numbers

**ACs satisfied:** AC-4 (spawn portion)
**Touches:** GitHub remote + `tasks/943-followups.md` (new ledger file).

**Steps:**

1. For each row in `tasks/943-followups-plan.md` with `Status = Planned spawn`, run `gh issue create` per SPEC §9 body template.
2. After each create, append the returned issue number to `tasks/943-followups.md`.
3. For Sequence rows: edit the dependent issue's body to insert real `Blocked by #N` once the blocker has a number.

**Verify (per-issue):** `gh issue view <N> --json labels,body` returns required label + `Spawned from #943` line.

---

## Phase 6 — Verify

### T8 — Batch verification

**ACs satisfied:** AC-4 (verified portion), AC-5 (precondition)
**Touches:** none on disk; reads GitHub state.

```bash
gh issue list --repo oviney/blog --search "Spawned from #943" --json number,labels,body \
  --jq '.[] | select((.labels | map(.name) | any(test("^agent:"))) and (.body | contains("Spawned from #943"))) | .number'
```

**Verify:** returned set equals planned spawn set in `tasks/943-followups-plan.md`. Divergence triggers CHECKPOINT-B remediation.

---

### CHECKPOINT-B — Verification clean

Same as #902 plan: T8 matches plan exactly, OR half-spawned remediation applied per SPEC §13.

---

## Phase 7 — Close + sanity

### T9 — Close #943 with summary

**ACs satisfied:** AC-5
**Touches:** GitHub remote.

Closure comment includes:
- In-scope sections covered (§1, §3, §4)
- Counts: **Action / Watch / No-op / Tracked in** per section
- Spawned follow-ups (planned ≤ 4)
- Tracked-in references back to #945/#946/#947
- Parallel-vs-sequential map for new spawns
- Link to `tasks/943-followups.md`

---

### T10 — Final sanity

```bash
bundle exec jekyll build           # must succeed
git status --short                 # only SPEC.md + tasks/* expected
```

**Verify:** Jekyll exit 0; git status clean except lifecycle artifacts.

---

## Risk register

| Risk | Mitigation |
|---|---|
| Subagent doesn't perform its own dedup precheck and surfaces a Playwright bump as Action | T4-dedup re-runs the check at synthesis time as a safety net; subagent prompts list #945/#946/#947 explicitly. |
| §4 produces all Watch/No-op findings (substance floor fails) | T5 enforces explicit justification text; if subagent returns no Action, ask T2c subagent for 4 Action-shaped findings on a wider scope before accepting all-Watch. |
| §4 finding routes to wrong persona | CHECKPOINT-A flags §4 persona-routing for human review; each finding carries its own justification line. |
| Tracked-in classification is wrong — looks like overlap but isn't | T4-dedup criteria are conservative (AC-overlap, files subset). Borderline cases get human review at CHECKPOINT-A. Worst case: an Action spawns that's redundant with an existing issue → close as `superseded by #N` per SPEC §13 half-spawned remediation. |
| #943's body still uses old template; readers may miss methodology guardrails | The staged `tasks/943-body.md` will inline a short "Methodology" note linking to `tasks/lessons.md` L3 and SPEC.md so readers can find the guardrails. |
| §1/§3 substance floor fails because all findings are Tracked-in | If §1 or §3 has no Action findings after dedup, record justification — likely "no substantive change identified since #902 closed two weeks ago; net-new developments are tracked in #945/#946/#947." That's a valid AC-8 satisfaction. |
| Workflow re-fires on 2026-06-01 while #943 is still mid-execution | The new cron-generated sweep will inherit guardrails inline (per #948), so it'll be safer than #943. If both are open simultaneously, prefer to ship #943 quickly to avoid stacking partial sweeps. |
| Subagent recommends `package.json` bump that would invalidate the lodash override | SPEC §11 boundary inherited from #902 / lessons.md L3; subagent prompt explicitly demands `node ... overrides` + `npm audit` output, T3 validates it's there. |
