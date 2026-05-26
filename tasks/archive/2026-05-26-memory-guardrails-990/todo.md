# TODO — Memory-write guardrails for code-reviewer and security-auditor (#990)

**Spec:** _(archived)_ · **Plan:** [plan.md](plan.md)
**Branch:** `feat/990-memory-discipline-guardrails` (to create)

---

## Phase 0 — Setup

- [ ] 0.1 Fetch origin/main; confirm at `0fcadaf1` (#991 merge)
- [ ] 0.2 Stash #990 lifecycle (SPEC + plan + todo)
- [ ] 0.3 Switch to `main`; `git pull --ff-only`
- [ ] 0.4 `git switch -c feat/990-memory-discipline-guardrails`
- [ ] 0.5 Pop stash
- [ ] 0.6 Archive #945 lifecycle to `tasks/archive/2026-05-25-subagent-memory-945/`
- [ ] 0.7 Commit: `docs(#990): lifecycle artifacts (SPEC + plan + todo) for memory-discipline guardrails`

## Phase 1 — Prose-body edits (one commit)

- [ ] 1.1 Insert `## Memory Discipline` section into `.claude/agents/code-reviewer.md` between line 9 (role intro end) and line 11 (`## Review Framework`) — wording per plan.md §1.1
- [ ] 1.2 Insert `## Memory Discipline` section into `.claude/agents/security-auditor.md` between line 9 and line 11 (`## Threat Model for This Blog`) — wording per plan.md §1.2
- [ ] Verify (AC-1, AC-2): `grep -c "^## Memory Discipline"` returns 1 per file
- [ ] Verify (AC-3): `grep -c "Never persist to memory"` returns 1 per file
- [ ] Verify (AC-4): ≥3 bulleted forbidden examples per section
- [ ] Verify (AC-6): frontmatter byte-identical to main
- [ ] Verify (AC-7): only the 2 target files modified in `.claude/agents/`
- [ ] Verify (AC-8): `bundle exec jekyll build` exit 0 (move `worktrees/` aside)
- [ ] Commit: `feat(#990): add Memory Discipline section to code-reviewer and security-auditor`

## Checkpoint A — Full 10-AC battery

- [ ] AC-1 — `## Memory Discipline` in code-reviewer.md
- [ ] AC-2 — `## Memory Discipline` in security-auditor.md
- [ ] AC-3 — "Never persist to memory" phrase present (1 per file)
- [ ] AC-4 — ≥3 forbidden-content bullet examples per section
- [ ] AC-5 — positive framing ("Use it for...") present per section
- [ ] AC-6 — frontmatter unchanged in both files
- [ ] AC-7 — other 4 subagents untouched
- [ ] AC-8 — `bundle exec jekyll build` exit 0
- [ ] AC-9 — `git diff --name-only main...HEAD | wc -l` → 7
- [ ] AC-10 — no protected file or governance surface touched

## Phase 2 — Ship

- [ ] Push branch
- [ ] Open PR with `Closes #990`; apply `agent:qa-gatekeeper` label only
- [ ] CI green (or admin-merge per precedent)
- [ ] Merge `--squash --delete-branch`
- [ ] Confirm Deploy Jekyll site to Pages + Production Smoke Tests pass on merge SHA
- [ ] Comment on #990 with production verification
- [ ] Update [[reference-subagent-memory]] memory: guardrails now landed for code-reviewer + security-auditor
