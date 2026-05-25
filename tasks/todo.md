# TODO — Add `memory:` frontmatter to local subagents (#945)

**Spec:** [../SPEC.md](../SPEC.md) · **Plan:** [plan.md](plan.md)
**Branch:** `feat/945-subagent-memory-frontmatter` (to create)

---

## Phase 0 — Setup

- [ ] 0.1 Fetch origin/main; confirm at `7ac6e91e` (#989 merge)
- [ ] 0.2 Stash #945 lifecycle (SPEC + plan + todo)
- [ ] 0.3 Switch to `main`; `git pull --ff-only`
- [ ] 0.4 `git switch -c feat/945-subagent-memory-frontmatter`
- [ ] 0.5 Pop stash
- [ ] 0.6 Archive #987 lifecycle to `tasks/archive/2026-05-25-scope-guard-987/`
- [ ] 0.7 Commit: `docs(#945): lifecycle artifacts (SPEC + plan + todo) for subagent memory frontmatter`

## Phase 1 — Frontmatter edits (one commit)

- [ ] 1.1 `.claude/agents/code-reviewer.md` — insert `memory: project  # repo-wide review patterns and PR-history pitfalls accumulate across sessions` after `description:`
- [ ] 1.2 `.claude/agents/security-auditor.md` — insert `memory: project  # repo-wide threat model and governance-surface boundaries persist`
- [ ] 1.3 `.claude/agents/test-engineer.md` — insert `memory: project  # Playwright suite shape and CI flake catalog persist across sessions`
- [ ] 1.4 `.claude/agents/playwright-test-planner.md` — insert `memory: project  # page-structure inventory and viewport conventions persist`
- [ ] 1.5 `.claude/agents/playwright-test-generator.md` — insert `memory: project  # locator and spec-file conventions accumulate across sessions`
- [ ] 1.6 `.claude/agents/playwright-test-healer.md` — insert `memory: project  # per-spec flake patterns and remediation recipes accumulate`
- [ ] Verify `awk` count → 6
- [ ] Verify `grep -c '^memory:.*#'` returns 1 per file
- [ ] Verify `yq eval '.memory' <file>` returns `project` for each
- [ ] Verify `bundle exec jekyll build` exits 0 (move `worktrees/` aside first)
- [ ] Commit: `feat(#945): add memory: project frontmatter to all 6 subagents`

## Checkpoint A — Full 10-AC battery

- [ ] AC-1 — `grep -l '^memory:' .claude/agents/*.md | wc -l` → 6
- [ ] AC-2 — `awk` count → 6
- [ ] AC-3 — every value is `project` (no `local`)
- [ ] AC-4 — 1 `#` comment per file
- [ ] AC-5 — no frontmatter key reordering
- [ ] AC-6 — no markdown body changes
- [ ] AC-7 — `bundle exec jekyll build` exit 0
- [ ] AC-8 — no protected file or governance surface touched
- [ ] AC-9 — YAML parses cleanly
- [ ] AC-10 — `git diff --name-only main...HEAD | wc -l` → 11

## Phase 2 — Ship

- [ ] Push branch
- [ ] Open PR with `Closes #945`; apply `agent:qa-gatekeeper` label only
- [ ] CI green (or admin-merge per precedent)
- [ ] Merge `--squash --delete-branch`
- [ ] Confirm Deploy Jekyll site to Pages + Production Smoke Tests pass on merge SHA
- [ ] Comment on #945 with production verification
- [ ] Update memory: note that subagents now have project-scoped persistent memory
