# Follow-ups Plan — Research Sweep #902 (pre-creation)

**Spec:** _(archived)_ §6, §8 · **Plan:** [plan.md](plan.md) T4
**Status:** Populated by T4; awaiting CHECKPOINT-A user review before T7 spawns issues.
**Pinned:** date floor `2026-04-15` (#816) · plan SHA `dafab0e` · synthesis SHA `624007a`

This file is **pre-creation truth**: it lists the issues we plan to spawn, the files each would touch, and any collision/sequence decisions. It is committed **before** any `gh issue create` runs.

After spawning, the post-creation ledger (real issue numbers, verification results, remediation notes) is written to [`902-followups.md`](902-followups.md). The two files are distinct per SPEC.md §6.

**Hard cap (SPEC §9):** ≤ 6 rows. **Planned row count: 4.** Cap satisfied, no override needed.

---

## Planned issues

| Rec # | Section | Title | Label | Files to change | Acceptance criterion (summary) | Collides with |
|---|---|---|---|---|---|---|
| 1 | §1 #1 | `feat(agents): add memory: frontmatter to local subagents` | `agent:qa-gatekeeper` | `.claude/agents/code-reviewer.md`, `.claude/agents/test-engineer.md`, `.claude/agents/security-auditor.md`, `.claude/agents/playwright-test-planner.md`, `.claude/agents/playwright-test-generator.md`, `.claude/agents/playwright-test-healer.md` | All 6 agent files have `memory:` in frontmatter; awk check returns 6; jekyll build succeeds | — |
| 2 | §1 #3 | `docs(agents): make AGENTS.md handoff targets explicit + Mermaid graph` | `agent:qa-gatekeeper` *(borderline — see note below)* | `AGENTS.md` | 5 persona blocks gain `Valid handoff targets:`; new top-level "Handoff Graph" with Mermaid `graph LR`; `grep -c "Valid handoff targets"` = 5; jekyll build succeeds | — |
| 3 | §3 #1 | `feat(tests): bump @playwright/test to ^1.60.0 + adopt page-level ARIA snapshots` | `agent:qa-gatekeeper` | `package.json`, `package-lock.json`, `tests/playwright-agents/`, `.github/skills/jekyll-qa/SKILL.md` | Playwright pinned ^1.60.0; lockfile regenerated; CI passes; SKILL.md updated; `npx playwright test` exits 0 | Rec 4 (`package-lock.json`, `.github/skills/jekyll-qa/SKILL.md`) — **Sequenced after Rec 4** |
| 4 | §3 #2 | `chore(deps): refresh pa11y-ci to 4.1.1 via lockfile regen (GHSA-f23m-r3pf-42rh)` | `agent:qa-gatekeeper` | `package-lock.json`, `.github/skills/jekyll-qa/SKILL.md` | `npm ls pa11y-ci` = 4.1.1; `npm audit` no longer reports the GHSA; CI passes; SKILL.md notes patch level; `package.json` semver range unchanged | Rec 3 (`package-lock.json`, `.github/skills/jekyll-qa/SKILL.md`) — **Sequenced before Rec 3** |

---

## File-overlap map

| File | Touched by |
|---|---|
| `.claude/agents/code-reviewer.md` | Rec 1 |
| `.claude/agents/test-engineer.md` | Rec 1 |
| `.claude/agents/security-auditor.md` | Rec 1 |
| `.claude/agents/playwright-test-planner.md` | Rec 1 |
| `.claude/agents/playwright-test-generator.md` | Rec 1 |
| `.claude/agents/playwright-test-healer.md` | Rec 1 |
| `AGENTS.md` | Rec 2 |
| `package.json` | Rec 3 |
| `package-lock.json` | **Rec 3 + Rec 4** ← collision |
| `tests/playwright-agents/` | Rec 3 |
| `.github/skills/jekyll-qa/SKILL.md` | **Rec 3 + Rec 4** ← collision |

---

## Collision decisions

- **`package-lock.json` + `.github/skills/jekyll-qa/SKILL.md` (Rec 3 + Rec 4):** **Sequence** (not merge). Rationale:
  - Rec 4 is a **security patch** (lodash CVE-2026-2950 via pa11y-ci 4.1.1) — small, fast, low-risk; should ship first and not be held back by Rec 3's CI verification overhead.
  - Rec 3 is a **feature bump** (Playwright 1.60.0) requiring CI runs on `test-quality.yml` + `auto-regression.yml` against the new version, plus spec updates in `tests/playwright-agents/`. Larger blast radius.
  - When Rec 3 lands, its own `npm install` will already include the patched pa11y-ci 4.1.1 from Rec 4's regenerated lockfile, so there's no rework — the second lockfile regen naturally supersedes the first cleanly.
  - Rec 3's issue body will carry **`Blocked by #<Rec4-issue-number>`** (placeholder filled by T7 once Rec 4 has a real issue number).

---

## Label notes (borderline cases for CHECKPOINT-A review)

- **Rec 1 (`.claude/agents/*.md`):** Most touched files are QA-adjacent (`test-engineer`, `playwright-test-*`, `code-reviewer`, `security-auditor`). `agent:qa-gatekeeper` is the best fit per CLAUDE.md routing table.
- **Rec 2 (`AGENTS.md`):** No clean fit in the existing roster — `AGENTS.md` is meta-documentation about agent personas, which isn't "CSS/SCSS" (creative), "posts/SEO" (editorial), or strictly "tests/CI/a11y" (QA). Tagged `agent:qa-gatekeeper` because the change introduces a structural-validation rule (handoff graph must be explicit and machine-readable), which is QA-adjacent in spirit. **User may want to change this at CHECKPOINT-A** — alternatives are "no label" (general agent) or introducing a new `governance-update` label per CLAUDE.md's note about `.github/skills/` PRs.
- **Rec 3 + Rec 4:** Unambiguous `agent:qa-gatekeeper` (tests, lockfile, jekyll-qa SKILL).

---

## Cap status

- Planned row count: **4**
- Cap: 6
- Override required: **No** (cap satisfied with 2 rows of headroom)

---

## CHECKPOINT-A gate checklist (for user)

- [ ] Review `tasks/902-body.md` (synthesized findings). Approve, or send back to T3 for edits.
- [ ] Review the table above (4 planned issues). Approve labels and titles, or amend.
- [ ] Confirm collision decision for Rec 3 ↔ Rec 4 (Sequence, Rec 4 first).
- [ ] Approve Rec 2's borderline label (`agent:qa-gatekeeper` vs. no-label vs. new `governance-update`).
- [ ] Approve total spawn count of 4 (under 6-cap).

Once approved, T6 pushes the body to #902 and T7 spawns issues in this order: **Rec 4 → Rec 1 → Rec 2 → Rec 3** (Rec 3 last so its `Blocked by` reference to Rec 4 is fillable). Rec 1 and Rec 2 are independent and can spawn in any order.
