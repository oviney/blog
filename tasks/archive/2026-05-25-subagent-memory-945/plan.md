# Plan — Add `memory:` frontmatter to local subagents (#945)

**Spec:** _(archived)_
**Issue:** [#945](https://github.com/oviney/blog/issues/945)
**Date:** 2026-05-25
**Labels:** `agent:qa-gatekeeper`
**Branch:** `feat/945-subagent-memory-frontmatter` (to be created)
**Lifecycle phase:** PLAN

---

## Scope summary

Mechanical fan-out: add one `memory: project` line (with an agent-specific inline `#` justification comment) to each of six `.claude/agents/*.md` files. No body edits, no new files, no test surface to write.

**Two atomic commits:** lifecycle setup, then all 6 subagent edits in one commit. The change is one logical concern (enable memory persistence across all subagents) and one uniform edit per file — splitting it further would create commit-noise without independent reviewability.

---

## Dependency graph

```
Phase 0 (branch + lifecycle commit)
    │
    ▼
Phase 1 (frontmatter edits — all 6 files in one commit)
    │   AC battery: awk/grep/yq/build all green
    │
    ▼   Checkpoint A: full 10-AC battery
    │
Phase 2 (ship)
```

No cross-file dependencies — all 6 edits are independent. The only ordering is "lifecycle first so the spec/plan/todo are on the branch before the substantive change lands".

---

## Vertical slices

### Phase 0 — Branch setup

| Task | Action |
|---|---|
| 0.1 | Sync `main`: `git fetch origin main`; `git switch main`; `git pull --ff-only` (current main at `7ac6e91e`, the #989 merge). |
| 0.2 | Stash #945 lifecycle (`SPEC.md` + `tasks/plan.md` + `tasks/todo.md`) before switching branches. |
| 0.3 | `git switch -c feat/945-subagent-memory-frontmatter`. |
| 0.4 | Pop stash. |
| 0.5 | Archive #987 lifecycle artifacts (`tasks/plan.md`, `tasks/todo.md` from main HEAD) to `tasks/archive/2026-05-25-scope-guard-987/`. |
| 0.6 | Commit lifecycle: `docs(#945): lifecycle artifacts (SPEC + plan + todo) for subagent memory frontmatter`. |

---

### Phase 1 — Frontmatter edits (one commit, six files)

*One atomic commit. Each file gets exactly one new line inserted immediately after `description:`. No reorder, no body change.*

| Task | File | New line (inserted after `description:`) |
|---|---|---|
| 1.1 | `.claude/agents/code-reviewer.md` | `memory: project  # repo-wide review patterns and PR-history pitfalls accumulate across sessions` |
| 1.2 | `.claude/agents/security-auditor.md` | `memory: project  # repo-wide threat model and governance-surface boundaries persist` |
| 1.3 | `.claude/agents/test-engineer.md` | `memory: project  # Playwright suite shape and CI flake catalog persist across sessions` |
| 1.4 | `.claude/agents/playwright-test-planner.md` | `memory: project  # page-structure inventory and viewport conventions persist` |
| 1.5 | `.claude/agents/playwright-test-generator.md` | `memory: project  # locator and spec-file conventions accumulate across sessions` |
| 1.6 | `.claude/agents/playwright-test-healer.md` | `memory: project  # per-spec flake patterns and remediation recipes accumulate` |

**Phase 1 ACs covered:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9.

**Phase 1 verification:**
```bash
# Count
awk '/^---$/{f=!f;next} f && /^memory:/{print FILENAME}' .claude/agents/*.md | wc -l   # AC-2: 6

# Every memory: line has a #-comment (per-file count)
for f in .claude/agents/*.md; do
  grep -c '^memory:.*#' "$f"   # expect 1 per file
done

# YAML parses (AC-9)
for f in .claude/agents/*.md; do
  yq eval '.memory' "$f"   # expect "project"
done

# Build (AC-7)
mv worktrees /tmp/_w && mv .worktrees /tmp/_dw && bundle exec jekyll build; mv /tmp/_w worktrees && mv /tmp/_dw .worktrees
```

**Commit:** `feat(#945): add memory: project frontmatter to all 6 subagents`

---

### Checkpoint A — Full 10-AC battery

| AC | Check |
|----|---|
| AC-1 | `grep -l '^memory:' .claude/agents/*.md \| wc -l` → 6 |
| AC-2 | `awk '/^---$/{f=!f;next} f && /^memory:/{print FILENAME}' .claude/agents/*.md \| wc -l` → 6 |
| AC-3 | `awk '/^---$/{f=!f;next} f && /^memory:/' .claude/agents/*.md \| grep -v 'project' \| wc -l` → 0 (no non-`project` values) |
| AC-4 | `grep -c '^memory:.*#' .claude/agents/*.md` reports 1 match per file |
| AC-5 | Frontmatter key order unchanged for each file (`git diff main...HEAD -- .claude/agents/*.md` shows only `+memory:` insertions, no reordering) |
| AC-6 | `git diff main...HEAD` confined to YAML frontmatter region (no body changes) |
| AC-7 | `bundle exec jekyll build` exit 0 (move local `worktrees/` aside first) |
| AC-8 | No file under `.github/skills/`, `.github/instructions/`, `.github/copilot-instructions.md`, `_config.yml`, `Gemfile*`, `.github/CODEOWNERS`, `AGENTS.md`, `ARCHITECTURE.md` modified |
| AC-9 | `yq eval '.memory' <file>` returns `project` for each of the 6 files |
| AC-10 | `git diff --name-only main...HEAD \| wc -l` → 11 |

**Pass criteria:** all 10 ACs green. Mechanical change so all should pass first try; investigate any FAIL immediately rather than ship-and-hope.

---

### Phase 2 — Ship

*Standard `/ship` flow.*

| Task | Action |
|---|---|
| 2.1 | Push branch `feat/945-subagent-memory-frontmatter`. |
| 2.2 | Open PR with `Closes #945`; apply `agent:qa-gatekeeper` label (no `governance-update` or `protected-file-update` needed — no governance surface or protected file touched). |
| 2.3 | CI green expected — the scope guard runs with #989's anchored `has_label()` helper; no false positives. |
| 2.4 | Admin-merge if blocked by 1-reviewer rule (per repeated precedent). |
| 2.5 | Confirm Deploy Jekyll site to Pages + Production Smoke Tests pass on merge SHA. |
| 2.6 | Comment on #945 with production verification notes. |
| 2.7 | Memory: note in [[reference-scope-guard]] or new memory entry that subagents now have project-scoped memory; useful for future agents that wonder "do I have persistent memory here?". |

---

## Risks (from SPEC §10, re-evaluated)

| Risk | Realised? | Plan response |
|---|---|---|
| YAML parse error | Mitigated by `yq` AC-9 check | None additional |
| Inline `#` misinterpreted as value | YAML 1.1/1.2 spec-compliant; verified `yq` round-trips | None additional |
| Older Claude Code ignores `memory:` field | Graceful degradation (unknown key inert) | None additional |
| Subagent stores sensitive PR content in project-scope memory | Cross-cutting governance concern out of scope per #945 | Watch item #902 |
| Local `bundle exec jekyll build` fails due to `worktrees/` pollution | Recurring; documented in earlier PR memory | Move `worktrees/` aside before AC-7 verification, restore after |
| Phantom `build` + 1-reviewer block | Yes — recurring | Admin-merge per precedent |
| Scope-guard tripping on this PR | Won't — `.claude/agents/` is not protected and not in any agent's forbidden pattern for `agent:qa-gatekeeper` | None needed |

---

## Out of scope (locked, per SPEC §11)

- `~/.claude/agents/*.md` user-global subagents
- Deciding what subagents *store* in memory
- Managed Agents "dreaming" feature
- Markdown body edits
- New/removed subagents
- `AGENTS.md` / governance surfaces
- Fixture tests for `memory:` field
