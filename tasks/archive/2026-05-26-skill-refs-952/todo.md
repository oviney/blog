# TODO — Reference Claude Code `/goal` + `claude agents` in 2 SKILL files (#952)

**Spec:** _(archived)_ · **Plan:** [plan.md](plan.md)
**Branch:** `feat/952-claude-code-skill-refs`

## Phase 0 — Setup ✓

- [x] Branched off main at `6ac2e1c7`
- [x] Archived #997 lifecycle to `tasks/archive/2026-05-26-expand-memory-997/`
- [ ] Commit lifecycle artifacts

## Phase 1 — SKILL edits (one commit)

- [ ] 1.1 Add 2 rows to `## Slash Commands` table in `.github/skills/using-agent-skills/SKILL.md`
- [ ] 1.2 Add 1 paragraph after merge-decision-process block in `.github/skills/jekyll-qa/SKILL.md`
- [ ] Verify ACs (per SPEC §4)
- [ ] Commit: `feat(#952): reference /goal and claude agents in using-agent-skills and jekyll-qa SKILLs`

## Phase 2 — Ship

- [ ] Push branch
- [ ] Open PR with `Closes #952`, **`agent:qa-gatekeeper` + `governance-update`** labels
- [ ] CI green (or admin-merge)
- [ ] Squash-merge, delete branch
- [ ] Post-deploy verify
- [ ] Comment on #952
