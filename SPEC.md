# SPEC — Research Sweep Execution (#943)

**Status:** Draft — awaiting approval
**Issue:** [#943](https://github.com/oviney/blog/issues/943)
**Labels:** `enhancement` · `research`
**Date:** 2026-05-17
**Lifecycle phase:** DEFINE
**Prior cycle reference:** [tasks/archive/2026-05-14-research-sweep-902/SPEC.md](tasks/archive/2026-05-14-research-sweep-902/SPEC.md) — 8 ACs, full collision/substance machinery; this SPEC reuses that structure and documents only the deltas.

---

## 1. Situation

`Research Sweep — 2026-05-15` (#943) was filed by the biweekly cron workflow two days before [#948 (sweep methodology guardrails)](https://github.com/oviney/blog/pull/950) merged. Therefore #943's **body uses the old template** — no inline three-bucket schema, no `package.json overrides` pre-Action check, no substance floor, no spawn cap. The guardrails are still binding on this execution via:

- The just-merged workflow source (`.github/workflows/research-sweep.yml` @ `bfe8f5c`) — future sweeps inherit them inline.
- [`tasks/lessons.md`](tasks/lessons.md) L3 — the durable record of the methodology lesson.
- This SPEC.md — explicitly imports them.

#943's template adds a **§4 Audience Experience / UI / UX / Usability** section that #902 didn't have, opening fresh research territory.

**Existing context that constrains scope:**

- #902 just closed (2026-05-17) with three open follow-ups: **#945** (subagent `memory:` frontmatter), **#946** (`AGENTS.md` handoff graph + Mermaid), **#947** (Playwright 1.60 bump, `Blocked by` recently-merged #944).
- The date floor for §1/§3 is **2026-05-01** (#902 `created_at`) — only ~2 weeks of "what's new" to research. Most material §1/§3 developments published in that window are already represented in #945/#946/#947, so dedup is the dominant constraint, not novelty.
- §4 is fresh territory: #902 never covered it. Use a wider 90-day floor (**2026-02-15**) so the section produces meaningful findings instead of "nothing new in two weeks."

---

## 2. Objective

Produce evidence-based findings for §1, §3, §4 of #943, recorded inline in the issue body. Spawn up to **4** follow-up issues, with **explicit dedup** against #945/#946/#947 — overlapping recommendations are recorded as `Tracked in #N` references and **do not spawn duplicates**.

**Non-goals:** writing a literature review; backfilling methodology guardrails into #943's body (those will appear in the next cron-generated sweep at 2026-06-01).

---

## 3. Acceptance Criteria

- [ ] **AC-1** #943 body is updated with findings for §1, §3, §4. §2 (Copilot) explicitly marked **out of scope** with the same statement and reversal trigger used for #902 (see SPEC §10).
- [ ] **AC-2** Every finding cites at least one verifiable source (URL with date, or repo state with command + commit SHA — no carve-outs).
- [ ] **AC-3** Each "Recommended improvement" lists specific files + an acceptance criterion. Recommendations that cannot name files stay as **Watch** with trigger condition.
- [ ] **AC-4 (dedup-aware)** A follow-up GitHub issue is opened only for **net-new** recommendations not already tracked by #945, #946, or #947. Overlapping findings are recorded in the sweep body with `**Tracked in #N**` reference and a one-line note on what the new research adds (if anything). Overlap detection runs **before** `gh issue create`.
- [ ] **AC-5** #943 closed with summary comment: in-scope sections covered, finding bucket counts (Action / Watch / No-op / Tracked-in), follow-up issues opened, parallel-vs-sequential map.
- [ ] **AC-6** `tasks/plan.md` and `tasks/todo.md` exist and track sweep execution.
- [ ] **AC-7** No code changes are made in this lifecycle pass.
- [ ] **AC-8 (substance floor — per section)** Each of §1, §3, §4 produces **at least one Action-bucket finding** OR a recorded "no substantive change identified" justification. A **Tracked in #N** finding does **not** satisfy the substance floor (the substance lives in the prior sweep's spawned issue, not in this one).
- [ ] **AC-9 (hard cap)** Spawned follow-ups ≤ **4** (lower than #902's 6 because #945/#946/#947 are still open). > 4 requires explicit user override.

---

## 4. Commands

```bash
# Read sweep state
gh issue view 943 --repo oviney/blog

# Dedup precheck — list existing open #902 follow-ups
gh issue list --repo oviney/blog --state open --search "Spawned from #902" \
  --json number,title,body

# Update sweep body
gh issue edit 943 --repo oviney/blog --body-file tasks/943-body.md

# Open follow-up issues
gh issue create --repo oviney/blog --title "..." --label "agent:..." \
  --body "Spawned from #943 sweep. ..."

# Close sweep
gh issue close 943 --repo oviney/blog --comment "..."
```

---

## 5. Project Structure (artifacts produced)

```
SPEC.md                          # this file
tasks/
  plan.md                        # methodology, dependency graph, checkpoints
  todo.md                        # tracked work items
  943-body.md                    # staged issue body
  943-followups-plan.md          # collision-pass output + dedup decisions (pre-creation)
  943-followups.md               # post-creation ledger (real issue numbers)
  lessons.md                     # unchanged — L3 already covers the overrides-check
  archive/
    2026-05-10-link-validator/   # #904/#905 cycle
    2026-05-14-research-sweep-902/  # the just-closed sweep (archived 2026-05-17)
```

No source files touched.

---

## 6. Date Floors (per section)

| Section | Floor | Anchor |
|---|---|---|
| §1 AI Agent Orchestration | **2026-05-01** | `created_at` of prior sweep #902 |
| §3 QE Automation | **2026-05-01** | `created_at` of prior sweep #902 |
| §4 Audience Experience | **2026-02-15** | `today - 90d`; #902 never covered §4 so the standard prior-sweep anchor doesn't apply |

The resolved floor for each section is pinned as the first line of `tasks/943-body.md` before any subagent is spawned.

---

## 7. Research Methodology (deltas from #902 SPEC §6)

**Inherits from #902 SPEC §6 (subagent prompts MUST embed three-bucket schema verbatim, self-reject incomplete findings, SHA + command on every repo-state citation, collision pass before `gh issue create`).**

**New for this sweep:**

- **Three subagents** (not two) — one for §1, §3, §4. All `general-purpose`. Fan out in a single message with three parallel `Agent` calls.
- **§4 subagent specifics:** distinct research domain (audience research / UX / reader-journey / a11y from a usability angle). Required sources include Nielsen Norman Group articles, viney.ca repo state (read `_layouts/`, `_includes/`, `_sass/`, `_posts/` index, search/topic pages), and current UX research. Subagent should also browse the live site (`bundle exec jekyll serve` is not running in the subagent's sandbox — use `_site/` artifacts or curl viney.ca production).
- **Dedup precheck as a binding pre-Action gate.** Every Action recommendation MUST be cross-checked against the bodies of #945, #946, #947 before classification. If any recommendation overlaps any of those issues' `Files to change` or `Acceptance criteria`, it is reclassified as **Tracked in #N** (new bucket — see §8) and does not spawn.
- **Inherited from #948 / lessons.md L3:** dep-bump-for-CVE recommendations must paste `node -e "console.log(JSON.stringify(require('./package.json').overrides||{}, null, 2));"` and `npm audit --omit=dev` output as evidence. Clean audit + existing override downgrades to Watch or No-op.

---

## 8. Finding Quality Bar (new bucket added)

#902 SPEC §7's three buckets (Action / Watch / No-op) remain. **One new bucket** for this sweep:

- **Tracked in #N** — finding restates something already open as a follow-up from a prior sweep. Body lists the existing issue number, optionally a one-line note on what new research (if any) adds — but if the existing issue's AC already covers it, the new note is just "covered". Stays in sweep body; no spawn. Does **not** satisfy AC-8 substance floor (that requires Action-bucket).

All quality-bar fields (Claim, Source, Repo impact, trigger for Watch, repo-state justification for No-op) remain mandatory.

---

## 9. Follow-up Issue Standards

Identical to #902 SPEC §8. Body sections: `Spawned from #943`, Finding, Files to change, Acceptance criteria, Out of scope, optional `Blocked by #N` for sequenced rows.

---

## 10. Collision Pass + Substance Floor

Identical to #902 SPEC §6 / §11 logic, with:

- **Hard cap: 4** (not 6).
- **Substance floor per-section** (§1, §3, §4 each need ≥1 Action OR justification).

---

## 11. Boundaries

Identical to #902 SPEC §9, plus:

| Always | Ask first | Never |
|---|---|---|
| Run dedup precheck against #945/#946/#947 before classifying anything as Action | Whether §4 findings route to `agent:audience-researcher`, `agent:editorial-chief`, or `agent:creative-director` — §4 spans all three persona scopes depending on what's recommended | Spawn an issue that duplicates the AC of an open #902 follow-up |
| Use a single 90-day floor for §4 (2026-02-15) regardless of subagent date discipline | Bumping any `package.json` dependency version (same #902 rule) | Edit #943's body inline with methodology guardrails — those land in the next cron-generated sweep via #948's workflow change, not retroactively |
| Cap follow-ups at **4** | Whether to exceed 4 follow-ups | Recommend changes to protected files (`_config.yml`, `Gemfile`, `Gemfile.lock`, `.github/copilot-instructions.md`, `.github/CODEOWNERS`) |

---

## 12. Out of Scope

- Implementing any recommended improvement (each is its own lifecycle cycle later).
- Researching GitHub Copilot Coding Agent updates (§2 — out per #902's decision and reversal trigger).
- Removing the `lodash` override in `package.json` — Watch-grade, separate evaluation.
- Re-running #902's findings — those are already tracked in #945/#946/#947 and the sweep methodology forbids duplication.
- Backfilling methodology guardrails into #943's body — those activate naturally in the 2026-06-01 sweep via the merged #948 workflow.
- §2 reversal in this sweep — Section 2 stays out per the same reasoning as #902.

---

## 13. Definition of Done

Identical to #902 SPEC §11. Specifically:

- All **9** ACs checked (AC-1 through AC-9, including the dedup-aware AC-4 and lower cap AC-9).
- `tasks/plan.md` and `tasks/todo.md` reflect actual progress.
- Working tree clean; no source files modified.
- `bundle exec jekyll build` still succeeds.
- **Spawned-issue verification (executing session owns this):** for each follow-up, `gh issue view <N> --repo oviney/blog` confirms label + `Spawned from #943` line. Batch check:
  ```bash
  gh issue list --repo oviney/blog --search "Spawned from #943" --json number,labels,body \
    --jq '.[] | select((.labels | map(.name) | any(test("^agent:"))) and (.body | contains("Spawned from #943"))) | .number'
  ```
  Output must equal the planned spawn set in `tasks/943-followups-plan.md`.
- **Half-spawned remediation:** if verification fails mid-batch, executing session patches in place via `gh issue edit` or closes + `superseded by #M`. Either path updates `tasks/943-followups.md` before #943 closes.
- `tasks/943-followups.md` (post-creation ledger) committed and reflects final spawned-vs-sequential mapping with real issue numbers.
- **Dedup ledger:** for every finding classified as Tracked in #N, `tasks/943-followups.md` (or a new section in `tasks/943-body.md`) records which #902 follow-up tracks it. Useful for closure summary and future auditors.
