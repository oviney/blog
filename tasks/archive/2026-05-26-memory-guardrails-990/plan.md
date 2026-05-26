# Plan — Memory-write guardrails for code-reviewer and security-auditor (#990)

**Spec:** _(archived)_
**Issue:** [#990](https://github.com/oviney/blog/issues/990)
**Date:** 2026-05-25
**Labels:** `agent:qa-gatekeeper`
**Branch:** `feat/990-memory-discipline-guardrails` (to be created)
**Lifecycle phase:** PLAN

---

## Scope summary

Two prose-body insertions: a new `## Memory Discipline` section in `.claude/agents/code-reviewer.md` and the same in `.claude/agents/security-auditor.md`. Each section is ~15 lines: positive framing of what to persist, bulleted forbidden-content list, one-sentence storage context.

**Two atomic commits:** lifecycle setup + one substantive commit covering both prose-body edits. The change is one logical concern (add memory discipline to the two highest-sensitivity agents) — splitting per-file would create reviewer noise without independent value.

---

## Dependency graph

```
Phase 0 (branch + lifecycle commit)
    │
    ▼
Phase 1 (prose-body edits — both files in one commit)
    │   AC battery: grep / build / scope checks all green
    │
    ▼   Checkpoint A: full 10-AC battery
    │
Phase 2 (ship)
```

No cross-file dependencies. The two edits are independent and uniform in pattern (same heading, same 3-paragraph structure, different agent-specific examples).

---

## Vertical slices

### Phase 0 — Branch setup

| Task | Action |
|---|---|
| 0.1 | Sync `main`: `git fetch origin main`; `git switch main`; `git pull --ff-only` (current main at `0fcadaf1`, the #991 merge). |
| 0.2 | Stash #990 lifecycle (`SPEC.md` + `tasks/plan.md` + `tasks/todo.md`) before switching branches. |
| 0.3 | `git switch -c feat/990-memory-discipline-guardrails`. |
| 0.4 | Pop stash. |
| 0.5 | Archive #945 lifecycle artifacts (`tasks/plan.md`, `tasks/todo.md` from main HEAD) to `tasks/archive/2026-05-25-subagent-memory-945/`. |
| 0.6 | Commit lifecycle: `docs(#990): lifecycle artifacts (SPEC + plan + todo) for memory-discipline guardrails`. |

---

### Phase 1 — Prose-body edits (one commit, two files)

*One atomic commit. Each file gets one new `## Memory Discipline` section inserted between the role intro paragraph and the first framework section.*

#### Task 1.1 — `.claude/agents/code-reviewer.md`

Insert between current line 9 (end of role intro paragraph) and current line 11 (`## Review Framework`):

```markdown
## Memory Discipline

You have a project-scoped persistent memory store. Use it for repo-wide review patterns that compound across sessions: this repo's `has_label()` helper convention, the scope-guard rule numbering, recurring PR-history pitfalls (e.g. the case-collision artifact on `SECURITY.md` ↔ `security.md`), and frontmatter conventions that catch reviewers off guard.

**Never persist to memory:**

- Secrets, API tokens, or credentials seen in any PR diff
- Unreleased code excerpts or fix-for-CVE patch contents
- Customer PII or internal URLs / email addresses that appear in issue bodies
- The specific content of any one PR you reviewed (review *patterns* generalise; specific diffs do not)

Memory is stored locally on the maintainer's machine (`~/.claude/projects/`), not synced anywhere. Treat what you persist as if it were grep-able by anyone with shell access to that machine.
```

#### Task 1.2 — `.claude/agents/security-auditor.md`

Insert between current line 9 (end of role intro paragraph) and current line 11 (`## Threat Model for This Blog`):

```markdown
## Memory Discipline

You have a project-scoped persistent memory store. Use it for the repo's threat model that compounds across sessions: governance-surface boundaries (`.github/skills/`, `.github/instructions/`), protected-file rules, dependency hygiene posture, recurring antipatterns (e.g. the substring-match label-grep antipattern closed by #987), and supply-chain assumptions.

**Never persist to memory:**

- Any string you would flag as a finding (tokens, keys, credentials)
- Dependency-CVE specifics from in-flight advisories that haven't published
- Internal threat-intel sources, vendor contacts, or incident details
- Customer PII appearing in any reviewed surface

Memory is stored locally on the maintainer's machine (`~/.claude/projects/`), not synced anywhere. Anything you persist is grep-able by anyone with shell access to that machine. Audit before write.
```

#### Phase 1 ACs covered

AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8.

#### Phase 1 verification

```bash
# AC-1, AC-2 — section headers
grep -c "^## Memory Discipline" .claude/agents/code-reviewer.md      # expect 1
grep -c "^## Memory Discipline" .claude/agents/security-auditor.md   # expect 1

# AC-3 — forbidden phrase
grep -c "Never persist to memory" .claude/agents/code-reviewer.md      # expect 1
grep -c "Never persist to memory" .claude/agents/security-auditor.md   # expect 1

# AC-4 — at least 3 bulleted forbidden examples per section (4 in each per the wording above)
awk '/^\*\*Never persist to memory:\*\*/,/^$/' .claude/agents/code-reviewer.md | grep -c '^- '      # expect ≥3 (actual: 4)
awk '/^\*\*Never persist to memory:\*\*/,/^$/' .claude/agents/security-auditor.md | grep -c '^- '   # expect ≥3 (actual: 4)

# AC-6 — frontmatter unchanged
diff <(awk '/^---$/{f=!f;next} f' .claude/agents/code-reviewer.md) \
     <(git show main:.claude/agents/code-reviewer.md | awk '/^---$/{f=!f;next} f')   # expect empty diff
diff <(awk '/^---$/{f=!f;next} f' .claude/agents/security-auditor.md) \
     <(git show main:.claude/agents/security-auditor.md | awk '/^---$/{f=!f;next} f')   # expect empty diff

# AC-7 — other 4 agents untouched
git diff --name-only main...HEAD -- .claude/agents/ | grep -v 'code-reviewer\|security-auditor'    # expect empty

# AC-8 — build
mv worktrees /tmp/_w && mv .worktrees /tmp/_dw && bundle exec jekyll build; mv /tmp/_w worktrees && mv /tmp/_dw .worktrees
```

**Commit:** `feat(#990): add Memory Discipline section to code-reviewer and security-auditor`

---

### Checkpoint A — Full 10-AC battery

| AC | Check |
|----|---|
| AC-1 | `grep -c "^## Memory Discipline" .claude/agents/code-reviewer.md` → 1 |
| AC-2 | `grep -c "^## Memory Discipline" .claude/agents/security-auditor.md` → 1 |
| AC-3 | `grep -c "Never persist to memory"` → 1 per file (both files) |
| AC-4 | `awk` between `^**Never persist to memory:**` and next blank line returns ≥3 bullet lines per file |
| AC-5 | Each section opens with "Use it for..." paragraph naming ≥2 categories of what TO persist |
| AC-6 | `awk` frontmatter diff against `main` returns empty for both files |
| AC-7 | `git diff --name-only main...HEAD -- .claude/agents/` lists only the 2 target files |
| AC-8 | `bundle exec jekyll build` exit 0 |
| AC-9 | `git diff --name-only main...HEAD \| wc -l` → 7 |
| AC-10 | No protected file or governance surface touched |

**Pass criteria:** all 10 ACs green. Mechanical change; investigate any FAIL immediately rather than ship-and-hope.

---

### Phase 2 — Ship

*Standard `/ship` flow.*

| Task | Action |
|---|---|
| 2.1 | Push branch `feat/990-memory-discipline-guardrails`. |
| 2.2 | Open PR with `Closes #990`; apply `agent:qa-gatekeeper` label only. No `governance-update` or `protected-file-update` needed. |
| 2.3 | CI green expected. |
| 2.4 | Admin-merge if blocked by 1-reviewer rule. |
| 2.5 | Confirm Deploy Jekyll site to Pages + Production Smoke Tests pass on merge SHA. |
| 2.6 | Comment on #990 with production verification notes. |
| 2.7 | Update [[reference-subagent-memory]] memory: remove the "guardrails not yet landed" caveat; note that code-reviewer and security-auditor now have explicit `Never persist to memory` rules. |

---

## Risks (from SPEC §10, re-evaluated)

| Risk | Realised? | Plan response |
|---|---|---|
| Agent ignores soft instruction and writes secret anyway | Mitigated only by storage being local + 700 perms | Document Watch item; no runtime enforcement in this PR |
| Wording too restrictive → agent persists nothing | Positive framing prevents over-rejection; AC-5 enforces it | None additional |
| Section placement disrupts structure | Pure insertion; existing sections byte-identical | AC-6, AC-7 verify |
| Heading collides with existing | Neither file has `## Memory*` heading today | None additional |
| Reviewer asks for other 4 agents | SPEC §11 documents the rationale; file follow-up if asked | None additional |
| Phantom `build` + 1-reviewer block | Yes — recurring | Admin-merge per precedent |
| Local `bundle exec jekyll build` fails on `worktrees/` | Recurring | Move aside before AC-8 |

---

## Out of scope (locked, per SPEC §11)

- Other 4 subagents
- Scope-guard rule for prose-body changes
- Runtime enforcement (`memory_redact:` field)
- Frontmatter edits
- Auditing existing memory files
- `AGENTS.md` / governance surfaces
