# SPEC — Add `memory:` frontmatter to local subagents (#945)

**Status:** Draft — awaiting approval
**Issue:** [#945](https://github.com/oviney/blog/issues/945)
**Labels:** `agent:qa-gatekeeper`
**Date:** 2026-05-25
**Lifecycle phase:** DEFINE
**Spawned from:** Research Sweep [#902](https://github.com/oviney/blog/issues/902) (2026-05-01)

---

## 1. Situation

Claude Code v2.1.33+ added a `memory:` frontmatter field on subagent definitions that gives each subagent its own persistent markdown knowledge store across sessions. v2.1.117 (2026-04-22) extended this with `@mention` syntax and per-agent `mcpServers` loading. Today the six `.claude/agents/*.md` definitions in this repo restart cold every invocation — each PR review, test plan, or security audit re-derives repo context from scratch.

Current frontmatter shapes in `.claude/agents/`:

| File | Current frontmatter keys |
|---|---|
| `code-reviewer.md` | `name`, `description` |
| `security-auditor.md` | `name`, `description` |
| `test-engineer.md` | `name`, `description` |
| `playwright-test-planner.md` | `name`, `description`, `tools`, `model`, `color` |
| `playwright-test-generator.md` | `name`, `description`, `tools`, `model`, `color` |
| `playwright-test-healer.md` | `name`, `description`, `tools`, `model`, `color` |

None of the six declare a `memory:` field today. Adding one enables persistent per-agent knowledge accumulation across sessions.

This session's earlier work — three scope-guard PRs and the AGENTS.md handoff graph — is exactly the kind of context these subagents would benefit from carrying forward: code-reviewer accumulating "this repo uses `has_label()` for label checks, not inline greps"; security-auditor accumulating "labels are gated by collaborator triage permission, not fork PRs"; test-engineer accumulating "the scope-guard harness lives at `tests/scope-guard.sh` with 8 fixture cases".

---

## 2. Objective

Add a `memory:` field to every `.claude/agents/*.md` YAML frontmatter, scoped `project` for all six (repo-wide knowledge is the dominant pattern for these personas), with a one-line inline YAML comment justifying the scope choice. No prose body changes. No new files.

---

## 3. Design Decisions (confirmed 2026-05-25)

| Decision | Choice | Rationale |
|---|---|---|
| Scope per agent | **All 6 → `memory: project`** | Every persona's accumulated knowledge is repo-wide: review patterns, threat models, flake catalogs, locator conventions. Session-private context is the wrong abstraction here. |
| Justification placement | **Inline YAML comment on the `memory:` line** | Justification sits adjacent to the value it justifies. Compact, grep-able, no prose body churn, single source of truth. |
| Justification style | **One short phrase per agent**, describing what kind of knowledge accumulates | e.g. `memory: project  # repo-wide review patterns accumulate across sessions`. Specific to the agent's role; not boilerplate. |
| Field placement | **Immediately after `description:`** | Natural reading order: name → description → memory scope → (optional tools/model/color). Consistent across all six files. |
| Tools/model/color preservation | **Unchanged** | The 3 playwright-test-* agents have richer frontmatter. Only the `memory:` line is added; existing keys keep their positions. |
| Markdown body | **Untouched** | The AC permits justification "in the file (one-line frontmatter comment or short note in the prose)". The frontmatter comment satisfies it; no prose edits needed. |
| New files | **None** | This PR is purely frontmatter additions across 6 existing files. |

---

## 4. Acceptance Criteria

- [ ] **AC-1** Every `.claude/agents/*.md` file's YAML frontmatter contains a `memory:` line.
- [ ] **AC-2** `awk '/^---$/{f=!f;next} f && /^memory:/{print FILENAME}' .claude/agents/*.md | wc -l` returns `6`.
- [ ] **AC-3** Every `memory:` value is `project` (no `local` values; verified per Decision §3).
- [ ] **AC-4** Every `memory:` line carries an inline `#` YAML comment justifying the scope choice — agent-specific, not boilerplate. `grep -c '^memory:.*#' .claude/agents/*.md` reports 1 match per file across all six.
- [ ] **AC-5** No existing frontmatter key is removed or reordered. The 3 simple agents retain `name`, `description`. The 3 playwright-test agents retain `name`, `description`, `tools`, `model`, `color`. Verified by diffing each file's frontmatter against `main`.
- [ ] **AC-6** No markdown body changes — only the YAML frontmatter inside the `---` fences. Verified by `git diff main...HEAD` showing only frontmatter region edits.
- [ ] **AC-7** `bundle exec jekyll build` exits 0. (Trivial — `.claude/` is outside the Jekyll source — but the check is cheap and lives in the issue AC.)
- [ ] **AC-8** No file outside `.claude/agents/`, the lifecycle directory, or the archive carry-over is modified. No governance surface (`.github/skills/`, `.github/instructions/`, `.github/copilot-instructions.md`) touched. No protected file touched.
- [ ] **AC-9** YAML remains valid for each file. Verified by parsing the frontmatter as YAML (`yq eval '.memory' <file>` returns `project` for each).
- [ ] **AC-10** Scope-guard boundary: `git diff --name-only main...HEAD` returns exactly — 6 `.claude/agents/*.md` + 3 lifecycle (`SPEC.md`, `tasks/plan.md`, `tasks/todo.md`) + 2 carry-over archive (`tasks/archive/2026-05-25-scope-guard-987/{plan,todo}.md`) = **11 files**. Well under the 15-file scope-explosion cap (no `bulk-content` label needed).

---

## 5. Commands

```bash
# Validation
bundle exec jekyll build                                                    # AC-7
awk '/^---$/{f=!f;next} f && /^memory:/{print FILENAME}' .claude/agents/*.md | wc -l   # AC-2 — expect 6
grep -c '^memory:' .claude/agents/*.md                                      # AC-1/AC-3 — every file: 1
grep -c '^memory:.*#' .claude/agents/*.md                                   # AC-4 — every file: 1
yq eval '.memory' .claude/agents/code-reviewer.md                           # AC-9 — expect "project" (cross-check one file)
git diff --name-only main...HEAD | wc -l                                    # AC-10 — expect 11
```

---

## 6. Project Structure (touched files)

```
.claude/agents/code-reviewer.md              M   + memory: project (review patterns)
.claude/agents/security-auditor.md           M   + memory: project (threat model)
.claude/agents/test-engineer.md              M   + memory: project (test architecture, flake catalog)
.claude/agents/playwright-test-planner.md    M   + memory: project (page-structure inventory)
.claude/agents/playwright-test-generator.md  M   + memory: project (locator conventions)
.claude/agents/playwright-test-healer.md     M   + memory: project (flake patterns per spec)
SPEC.md                                      M   This file
tasks/plan.md                                M   #945 plan
tasks/todo.md                                M   #945 todo
tasks/archive/2026-05-25-scope-guard-987/    A   Carry-over: archived #987 plan + todo (2 files)
```

**Total scope:** 6 substantive + 3 lifecycle + 2 archive carry-over = **11 files**.

---

## 7. Code Style

- **YAML frontmatter style** — single space after `memory:`, single space before `#` comment, comment value is a short noun phrase (no period). Example: `memory: project  # repo-wide review patterns accumulate across sessions`.
- **No reflow** — preserve existing key order; insert `memory:` immediately after `description:` (which sometimes spans multiple lines via single-quotes in the playwright-test-generator file).
- **No body edits** — every byte change is inside the `---` fences.
- **Justification phrasing** — agent-specific, not generic. Each comment names the kind of knowledge that accumulates (e.g. "review patterns", "threat model", "flake catalog"). Not "Project scope" or "Repo-wide" — those are tautologies.
- **No trailing whitespace** on the new line.

Per-agent justification text (proposed; final wording in plan.md):

| Agent | Justification comment |
|---|---|
| code-reviewer | `# repo-wide review patterns and PR-history pitfalls accumulate across sessions` |
| security-auditor | `# repo-wide threat model and governance-surface boundaries persist` |
| test-engineer | `# Playwright suite shape and CI flake catalog persist across sessions` |
| playwright-test-planner | `# page-structure inventory and viewport conventions persist` |
| playwright-test-generator | `# locator and spec-file conventions accumulate across sessions` |
| playwright-test-healer | `# per-spec flake patterns and remediation recipes accumulate` |

---

## 8. Testing Strategy

| Layer | Check |
|---|---|
| Static | `awk` AC-2 returns 6; `grep` AC-1/AC-3/AC-4 each return 6 |
| Static | YAML parses for each of the 6 files (AC-9) |
| Diff | `git diff main...HEAD --name-only` returns 11 files; every `.claude/agents/*.md` change is confined to within the frontmatter fences (AC-5, AC-6, AC-8, AC-10) |
| Build | `bundle exec jekyll build` exits 0 (AC-7) |

No fixture tests, no Playwright spec — this is a metadata-only change in a directory outside the Jekyll source.

No CI gate addition required — the existing `check-agent-scope` job covers the `.claude/agents/` boundary indirectly via Rule 4 (`agent:qa-gatekeeper` is permitted to touch `tests/`, but `.claude/agents/` isn't in any forbidden pattern, so Rule 4 won't trip).

---

## 9. Boundaries

**Always:**
- Insert `memory:` immediately after `description:` in each file.
- Use `memory: project` for all six files (per Decision §3).
- Add an agent-specific inline YAML `#` comment justifying the scope.
- Run the AC battery (`awk`/`grep`/`yq`/`jekyll build`) before pushing.

**Ask first about:**
- Switching any agent from `project` to `local`.
- Adding a `memory:` field to subagents outside `.claude/agents/` (e.g. `~/.claude/agents/` user-global) — out of scope per #945.
- Editing the markdown body of any subagent file — out of scope; this PR is frontmatter-only.
- Adding a new subagent file as part of this PR — out of scope.

**Never:**
- Modify any of the protected files (`_config.yml`, `Gemfile`, `Gemfile.lock`, `.github/CODEOWNERS`, `.github/copilot-instructions.md`, `AGENTS.md`, `ARCHITECTURE.md`). [Per scope guard.]
- Modify governance surface (`.github/skills/`, `.github/instructions/`). [No `governance-update` label needed.]
- Reorder or remove existing frontmatter keys.
- Change the markdown body of any `.claude/agents/*.md` file.

---

## 10. Risks

| Risk | Mitigation |
|---|---|
| YAML parse error from a stray indentation or quote in the new `memory:` line | AC-9 (YAML parses); local verification via `yq eval '.memory' <file>` per file before commit. |
| Inline `#` comment misinterpreted as part of the value by some YAML parser | YAML 1.1/1.2 both treat `#` outside quoted strings as a comment delimiter. `memory: project  # ...` is the canonical form. Verified by precedent in many Claude Code subagent examples and by the AC-9 yq check. |
| Claude Code v2.1.33+ requirement — older versions of Claude Code may not honour the `memory:` field | Unsupported runtimes treat unknown frontmatter keys as inert (per YAML spec); no degradation. Worst case: the field is read but ignored. Out of scope per #945. |
| Subagent that gets `memory: project` writes sensitive PR-review content into a persistent file | Cross-cutting governance concern, not introduced by this PR. The memory feature stores markdown in a user-scope path; the user can audit/redact. Scope review of stored memory contents is Worth-Watching from #902. |
| `bundle exec jekyll build` failing for unrelated reasons (e.g. local worktrees/ pollution as seen in earlier PRs) | Verify with worktrees moved aside, matching the local-build hygiene pattern documented in the [[reference-scope-guard]] session. |

---

## 11. Out of Scope

Per issue #945:

- Adding `memory:` to user-global subagents (`~/.claude/agents/*.md`) — outside this repo.
- Deciding what subagents should *store* in memory — subagents self-curate; this issue only enables the mechanism.
- Migrating to the Claude Managed Agents "dreaming" feature — Watch item in #902.
- Editing the markdown body of any subagent file.
- Adding or removing subagents.
- Touching `AGENTS.md` or governance surfaces.
- Adding fixture tests for the `memory:` field (no behavioural surface to test).
