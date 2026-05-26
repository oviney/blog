# SPEC — Reference Claude Code `/goal` + `claude agents` in 2 SKILL files (#952)

**Status:** Draft — auto-approved per /goal directive (well-scoped per issue body)
**Issue:** [#952](https://github.com/oviney/blog/issues/952)
**Labels:** `agent:qa-gatekeeper`, `governance-update` (touches `.github/skills/`)
**Date:** 2026-05-26
**Branch:** `feat/952-claude-code-skill-refs`

---

## 1. Situation

Claude Code v2.1.139 (2026-05-11) added `/goal` (autonomous-loop completion conditions) and `claude agents` (inspect active subagent sessions). The repo's two operational SKILL files don't reference either:

- `.github/skills/using-agent-skills/SKILL.md` — describes the spec/plan/build/test/review/ship lifecycle
- `.github/skills/jekyll-qa/SKILL.md` — QA gatekeeper workflow

Adding references gives operators a concrete mechanism for the existing "verify before complete" guidance. This session itself exercised `/goal` heavily (3 invocations to date) and would have benefited from documenting it earlier.

---

## 2. Objective

Add one-line references to `/goal` and `claude agents` in each of the 2 SKILL files, anchored to a specific lifecycle phase or workflow step (per issue AC). No structural changes; pure additions. PR carries `governance-update` label because `.github/skills/` is a governance surface.

---

## 3. Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Scope | **`using-agent-skills/SKILL.md` + `jekyll-qa/SKILL.md`** | Per issue. |
| `using-agent-skills/SKILL.md` placement | **Extend the existing `## Slash Commands` table** at line 115 with 2 new rows | Natural home — same table style as `/spec`, `/plan`, etc. |
| `jekyll-qa/SKILL.md` placement | **Add a one-line note adjacent to `### 2.6. PR Merge Decision Matrix`** | This is the "verify before merge" section the issue calls out. |
| Wording style | **Match existing table-row style** in `using-agent-skills`; **operational prose** in `jekyll-qa` | Consistent with each file's existing voice. |
| Label | **`governance-update`** required | `.github/skills/` is a governance surface per the scope guard. |

---

## 4. Acceptance Criteria

- [ ] **AC-1** `.github/skills/using-agent-skills/SKILL.md` references both `/goal` and `claude agents` in the `## Slash Commands` table.
- [ ] **AC-2** `.github/skills/jekyll-qa/SKILL.md` references at least one of `/goal` or `claude agents` adjacent to the merge-decision section.
- [ ] **AC-3** Per issue's mechanical AC: `grep -E "/goal|claude agents" .github/skills/using-agent-skills/SKILL.md .github/skills/jekyll-qa/SKILL.md | wc -l` returns ≥ 2.
- [ ] **AC-4** Each reference is anchored to a lifecycle phase or workflow step (not free-floating bullet).
- [ ] **AC-5** `bundle exec jekyll build` exits 0.
- [ ] **AC-6** No structural changes to either SKILL file — only additive rows/lines.
- [ ] **AC-7** PR carries `governance-update` label preemptively (scope guard requirement).
- [ ] **AC-8** Scope: 2 substantive + 3 lifecycle + 2 archive = **7 files**.
- [ ] **AC-9** No protected file touched.

---

## 5. Commands

```bash
bundle exec jekyll build                                                            # AC-5
grep -E "/goal|claude agents" .github/skills/using-agent-skills/SKILL.md .github/skills/jekyll-qa/SKILL.md | wc -l   # AC-3 ≥ 2
git diff --name-only main...HEAD | wc -l                                            # AC-8 → 7
```

---

## 6. Project Structure

```
.github/skills/using-agent-skills/SKILL.md  M   + 2 rows in Slash Commands table
.github/skills/jekyll-qa/SKILL.md           M   + 1 line adjacent to PR Merge Decision Matrix
SPEC.md                                     M
tasks/plan.md                               M
tasks/todo.md                               M
tasks/archive/2026-05-26-expand-memory-997/  A   (2 files)
```

Total: 7 files.

---

## 7. Wording (final form)

### using-agent-skills/SKILL.md — extend the `## Slash Commands` table

Add two rows after `/ship`:

```markdown
| `/goal <directive>` | sets an autonomous-loop completion condition; useful during **DEFINE** (sketch the goal), **BUILD** (auto-progress through tasks), and **SHIP** (auto-merge after CI). See `claude agents` to observe in-flight state. |
| `claude agents` (view) | lists every active subagent session. Inspect during long parallel fan-outs — e.g., a `/ship` review with code-reviewer + security-auditor + test-engineer concurrently. |
```

### jekyll-qa/SKILL.md — add note adjacent to PR Merge Decision Matrix

Insert one paragraph immediately after the decision-process block (~line 478), before "Merge with Overrides":

```markdown
**Autonomous-loop note:** When the merge decision happens under an active `/goal` directive (Claude Code v2.1.139+), the loop stops on this gate until the merge succeeds or the override is documented. Use `claude agents` to confirm no parallel review (code-reviewer, security-auditor, test-engineer) is still in flight before applying an admin-merge.
```

---

## 8. Boundaries

**Always:** insert per §7 wording; preserve existing table/section structure; run AC battery before commit.
**Ask first about:** material wording changes; placement elsewhere; expanding to other SKILL files.
**Never:** modify protected files (`_config.yml`, `Gemfile*`, `AGENTS.md`, `ARCHITECTURE.md`, `.github/CODEOWNERS`, `.github/copilot-instructions.md`); reorder existing SKILL sections; remove existing content.

---

## 9. Risks

| Risk | Mitigation |
|---|---|
| `governance-update` label not applied → scope guard fails | Apply at PR open time; the label-bypass machinery from #989 anchors the check |
| Wording references features that aren't documented elsewhere in the repo | The features are upstream Claude Code v2.1.139+ — referencing them is the *point* of this PR |
| Phantom `build` + 1-reviewer block | Admin-merge per precedent |

---

## 10. Out of Scope

Per issue #952:
- `.claude-plugin.json` packaging (Watch item from #943)
- Refactoring existing SKILL structure
- OTEL `agent_id` / `parent_agent_id` documentation
- `continueOnBlock` hook documentation
- Expanding to SKILL files other than the 2 named
