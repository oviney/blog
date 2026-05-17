# SPEC — Research Sweep Execution (#902)

**Status:** Draft — awaiting approval
**Issue:** [#902](https://github.com/oviney/blog/issues/902)
**Labels:** `enhancement` · `research`
**Date:** 2026-05-14
**Lifecycle phase:** DEFINE

---

## 1. Situation

`Research Sweep — 2026-05-01` (#902) is an open-ended template issue produced by the `research-sweep` workflow. Its body has three sections (AI Agent Orchestration, GitHub Copilot Coding Agent, QE Automation), each with research prompts and empty `Findings` / `Recommended improvements` slots. The sweep has been open for 13 days with no findings recorded.

Concurrently, the project is migrating execution off GitHub Copilot Coding Agent (label-routed cloud agents) onto **local Claude Code with the agent-skills lifecycle**. This shift reframes the sweep:

- **Section 1 (AI Agent Orchestration)** — in scope. Findings directly inform how we use Claude Code subagents, lifecycle skills, and persona files.
- **Section 2 (GitHub Copilot Coding Agent)** — out of scope. Decision already made: we are moving off Copilot for direct execution. Researching Copilot's latest features does not change that decision.
- **Section 3 (QE Automation)** — in scope. Playwright, Pa11y, Lighthouse, and GitHub Actions updates affect the validator stack regardless of which agent runtime drives it.

This sweep is the first lifecycle artifact produced under the local-only Claude Code orchestration model.

---

## 2. Objective

Produce evidence-based findings for the two in-scope sections of #902, recorded inline in the issue body, and spawn follow-up issues **only** where a concrete, file-scoped change to this repository is justified.

**Non-goal:** writing a literature review. Findings exist to drive repo changes; speculative trends without a clear repo action stay in the sweep and do not become issues.

---

## 3. Acceptance Criteria

- [ ] **AC-1** Issue #902 body is updated with findings for Section 1 (AI Agent Orchestration) and Section 3 (QE Automation). Section 2 is explicitly marked **out of scope — migrating off Copilot** with a one-line rationale, not left blank.
- [ ] **AC-2** Every finding cites at least one verifiable source: a GitHub release URL, official docs URL, dated blog post, or repository state observed in this codebase. No unsourced claims.
- [ ] **AC-3** Each "Recommended improvement" lists the **specific file(s)** it would change and an acceptance criterion. Recommendations that cannot name files stay as "Worth watching" notes in the sweep body and do **not** spawn issues.
- [ ] **AC-4** A follow-up GitHub issue is opened for each qualifying recommendation, labelled with the appropriate `agent:*` label, referencing #902 in the body. Issues that touch overlapping files are noted as **sequential** in #902's closing summary; non-overlapping issues are noted as **parallelizable**.
- [ ] **AC-5** #902 is closed once all follow-up issues are opened and the body is committed. Closure comment summarises: in-scope sections covered, # of findings, # of follow-up issues opened, parallel-vs-sequential map.
- [ ] **AC-6** `tasks/plan.md` and `tasks/todo.md` exist and track the sweep's own work (the three research tracks + write-up + follow-up issue creation).
- [ ] **AC-7** No code changes are made in this lifecycle pass. Implementation of recommendations happens in the follow-up issues' own lifecycle cycles.
- [ ] **AC-8 (substance floor)** Each in-scope section (Section 1 and Section 3) produces **at least one Action-bucket finding** OR an explicit "no substantive change identified after researching ≥ N sources from [list]" justification recorded in the sweep body. A sweep of all-Watch / all-No-op findings does not satisfy this AC without that justification. This prevents a sweep from satisfying every other AC while being substantively empty.

---

## 4. Commands

```bash
# Read sweep state
gh issue view 902 --repo oviney/blog

# Inspect current repo state for comparison against findings
cat AGENTS.md .github/skills/*/SKILL.md
grep -E '"(playwright|pa11y|lighthouse)' package.json
cat .github/workflows/*.yml

# Update sweep body
gh issue edit 902 --repo oviney/blog --body-file <(cat tasks/902-body.md)

# Open follow-up issues
gh issue create --repo oviney/blog --title "..." --label "agent:qa-gatekeeper" \
  --body "Spawned from #902 sweep. ..."

# Close sweep
gh issue close 902 --repo oviney/blog --comment "..."
```

---

## 5. Project Structure (artifacts produced by this lifecycle pass)

```
SPEC.md                          # this file
tasks/
  plan.md                        # research methodology, dependency graph, checkpoints
  todo.md                        # tracked work items for the sweep
  902-body.md                    # staged issue body before gh issue edit
  902-followups-plan.md          # collision-pass output BEFORE gh issue create (planned issues, file-overlap map)
  902-followups.md               # post-creation ledger: real issue numbers, parallel-vs-sequential mapping, verification results
  archive/
    2026-05-10-link-validator/   # prior cycle, shipped in 47544eb
```

No source files (`scripts/`, `_posts/`, `_sass/`) are touched in this pass.

---

## 6. Research Methodology

| Source class | When to use | Tool |
|---|---|---|
| **Web search** | "What's new since 2026-04-01?" — release notes, blog posts, papers | `WebSearch`, `WebFetch` |
| **Official docs** | Verifying a specific feature or API claim | `WebFetch` against project docs site |
| **Repo state** | Comparing current versions / configs against findings | `Read`, `Bash` (grep/ls) in this repo |
| **Subagents (parallel)** | Fan out one `general-purpose` agent per in-scope section | `Agent` tool, run concurrently |

**Subagent strategy:** Section 1 and Section 3 are independent (no shared files between their findings). Spawn both in a single message with two `Agent` tool calls. Each subagent returns: (a) findings with citations, (b) recommended improvements with named files + acceptance criteria, (c) a "worth watching but no action" list.

**Subagent prompt requirements (binding):** The orchestrator's prompt to each subagent MUST embed §7's three-bucket schema (Claim + Source + Repo impact, with trigger-condition for Watch and repo-state-justification for No-op) **verbatim** and instruct the subagent to **reject its own output** if any finding lacks a required field. This prevents drift between §7's quality bar and what subagents actually produce, and removes the need for the orchestrator to re-prompt or hand-fix on return.

**Date discipline:** The date floor is the `created_at` of the most recent prior `Research Sweep —` issue **regardless of state** (open or closed); if none exists, `today - 90d`. The resolved floor MUST be recorded as the first line of `tasks/902-body.md` before any subagent is spawned.

**Repo-state evidence:** Any finding citing repo state must include the exact command run **and** the commit SHA at which it was run (e.g., `grep -E '"playwright"' package.json` @ `dafab0e`). This applies to **every** command shape — `cat`, `ls`, `grep`, `Read`, all of it. No carve-outs. The audit trail is the citation; without SHA + command, the citation is invalid and the finding is incomplete.

**Collision pass (mandatory before spawning issues):** After both subagents return, diff the `Files to change` sets across all recommendations. Any file appearing in two or more recommendations forces either:
- a **single merged issue** covering both recommendations, or
- a **`Blocked by #N` chain** with sequential ordering.

The collision pass output is committed to `tasks/902-followups-plan.md` (a table of file → recommendations-touching-it, plus the merge/sequence decision for each collision) **before** any `gh issue create` is run. After `gh issue create` returns real issue numbers, the final mapping (plan + real numbers + `Blocked by` wiring + verification results) is written to `tasks/902-followups.md` as a separate commit. The plan file is the pre-creation truth; the ledger file is the post-creation record.

---

## 7. Finding Quality Bar

Each finding entered into the sweep body MUST have:

1. **Claim** — one sentence stating the development.
2. **Source** — a clickable URL, with a publish date if available.
3. **Repo impact** — one of:
   - **Action:** `<short description>` → spawns follow-up issue
   - **Watch:** `<why we'd care later>` + **trigger condition** (e.g., "promote to Action when Playwright ≥ 1.50 lands" or "when our pa11y-ci version falls > 2 minors behind") → stays in sweep, no issue
   - **No-op:** `<why this doesn't apply to us>` + **repo-state justification** citing a specific file or version (e.g., "we already pin `lighthouse@^12.8.2` per `package.json`") → stays in sweep, no issue

A finding without all three — and without the trigger condition / repo-state justification for Watch / No-op respectively — is incomplete and blocks AC-1. The trigger / justification exists to make bucket choice **auditable**: a future reviewer can verify the Watch was honest and the No-op was grounded.

---

## 8. Follow-up Issue Standards

Every spawned issue MUST include:

- **Title:** action-oriented, scoped (`update`, `add`, `bump`, `evaluate`) — not `research`
- **Body sections:**
  - `Spawned from #902 — Research Sweep 2026-05-01`
  - `Finding` (one-paragraph context from the sweep)
  - `Files to change` (explicit paths)
  - `Acceptance criteria` (checklist, at least one item)
  - `Out of scope`
- **Label:** appropriate `agent:*` label based on the touched file domain
- **Cross-references:** if it depends on another spawned issue (overlapping files), note `Blocked by #N` in the body

---

## 9. Boundaries

| Always | Ask first | Never |
|---|---|---|
| Cite a source for every claim | Whether to spawn a follow-up if a finding feels borderline | Edit `_posts/`, `_sass/`, `scripts/`, or workflows in this lifecycle pass |
| Mark Section 2 explicitly out of scope with a one-line rationale | Whether to bump a tool version that touches `_config.yml`, `Gemfile`, or `Gemfile.lock` (these are protected) | Recommend `Gemfile`/`Gemfile.lock`/`_config.yml` changes — flag as a "Watch" item and surface to the user |
| Use `WebFetch` against the canonical doc URL, not a cached/aggregated version | Whether to open more than ~6 follow-up issues (issue spam risk) | Open follow-up issues without explicit file scope |
| Stage `gh issue edit` body in `tasks/902-body.md` before applying | Whether to close #902 if any AC is not met | Close #902 before all follow-up issues are opened and confirmed |
| Run subagents in parallel for Section 1 and Section 3 | Bumping any `package.json` dependency version — the follow-up issue body MUST surface the cascading `package-lock.json` churn and CI/Pa11y/Lighthouse/Playwright behaviour impact before the bump is approved | Spawn subagents for already-decided scope (e.g., Copilot section) |
| Cap follow-up issues at **6** total. Anything beyond 6 requires explicit user override before `gh issue create` | — | Open more than 6 follow-up issues without explicit user approval |

---

## 10. Out of Scope (this lifecycle pass)

- Implementing any recommended improvement (each is its own lifecycle cycle later)
- Researching GitHub Copilot Coding Agent updates (Section 2 — explicit non-goal)
- Auditing prior sweeps for completeness
- Changing the `research-sweep` workflow itself
- Re-evaluating the local-Claude-Code orchestration decision

**Section 2 reversal trigger:** Reopen Section 2 in a future sweep if Copilot ships a feature that materially affects label-routing or local-agent interop (e.g., local-runtime parity, or a Copilot-Claude-Code bridge). Otherwise, the next sweep inherits the same out-of-scope marker — this is not a one-off skip.

---

## 11. Definition of Done

- All **eight** Acceptance Criteria checked (AC-1 through AC-8, including the substance floor).
- `tasks/plan.md` and `tasks/todo.md` reflect actual progress.
- Working tree clean (artifacts under `tasks/` and `SPEC.md` committed); no other files modified.
- `bundle exec jekyll build` still succeeds (sanity check that lifecycle artifacts don't break the site build).
- **Spawned-issue verification (executing session owns this):** for each follow-up issue, the executing Claude Code session runs `gh issue view <N> --repo oviney/blog` and confirms it has (a) the required `agent:*` label and (b) a `Spawned from #902` line in the body. Suggested automatable batch check (run, don't script in this pass):
  ```bash
  gh issue list --repo oviney/blog --search "Spawned from #902" --json number,labels,body \
    --jq '.[] | select((.labels | map(.name) | any(test("^agent:"))) and (.body | contains("Spawned from #902"))) | .number'
  ```
  The output must equal the planned spawn set in `tasks/902-followups-plan.md`. Any divergence blocks closure.
- **Half-spawned remediation:** if verification fails mid-batch (e.g., 4 of 6 issues created, one missing a label), the executing session owns the fix. Two valid remediation paths:
  1. Patch the failing issue in place via `gh issue edit <N> --add-label "agent:..."` or `gh issue edit <N> --body-file ...`.
  2. Close the failing issue with comment `superseded by #M` and create a corrected replacement.

  Either way, `tasks/902-followups.md` is updated to record the remediation before #902 closes.
- `tasks/902-followups.md` (post-creation ledger) is committed and reflects the final spawned-vs-sequential mapping with real issue numbers, distinct from `tasks/902-followups-plan.md` (pre-creation truth).
- **Future automation (note, not a deliverable here):** the three manual gates above — every finding has a source URL, every spawned issue has `Spawned from #902`, follow-up count ≤ 6 — are cheap to script as `scripts/validate-sweep.sh`. Out of scope for this DEFINE pass (AC-7 forbids new code); capture as a candidate Section 3 / QE Automation Action finding if applicable, otherwise spawn as a separate lifecycle cycle.
