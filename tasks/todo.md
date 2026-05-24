# TODO — Make AGENTS.md handoff targets explicit + Mermaid graph (#946)

**Spec:** [../SPEC.md](../SPEC.md) · **Plan:** [plan.md](plan.md)
**Branch:** `docs/946-agents-handoff-graph` (to create)

---

## Phase 0 — Setup

- [ ] Create branch `docs/946-agents-handoff-graph` off `main` (post-#953-merge state)

## Phase 1 — Per-persona handoff rows (one commit)

- [ ] 1.1 Add `**Valid handoff targets**` row to Creative Director table → `Editorial Chief, QA Gatekeeper`
- [ ] 1.2 Add `**Valid handoff targets**` row to QA Gatekeeper table → `Creative Director, Editorial Chief`
- [ ] 1.3 Add `**Valid handoff targets**` row to Editorial Chief table → `Creative Director, QA Gatekeeper`
- [ ] 1.4 Add `**Valid handoff targets**` row to Audience Researcher table → `Creative Director, Editorial Chief, QA Gatekeeper`
- [ ] 1.5 Add `**Valid handoff targets**` row to General Agent table → `_(terminal — handles work end-to-end)_`
- [ ] Verify: `grep -c "Valid handoff targets" AGENTS.md` == 5
- [ ] Verify: `bundle exec jekyll build` exits 0
- [ ] Commit: `docs(#946): add Valid handoff targets row to each persona`

## Checkpoint A — Topology lock

- [ ] Cross-read every Phase 1 row against existing `**Handoff triggers**:` prose (lines 56, 72, 88, 104)
- [ ] Confirm 9 directed edges + 1 terminal node match exactly

## Phase 2 — `## Handoff Graph` section (one commit)

- [ ] 2.1 Insert new `## Handoff Graph` section before `## Protected Files (all agents)` (currently line 122)
- [ ] 2.2 Add 1–2 sentence intro positioning the graph as derived from per-persona rows
- [ ] 2.3 Add Mermaid `graph LR` code fence with all 9 edges + terminal General Agent node
- [ ] Verify: `grep -c "## Handoff Graph" AGENTS.md` == 1
- [ ] Verify: `bundle exec jekyll build` exits 0
- [ ] Verify (AC-7): start local dev server, confirm Mermaid renders (or confirm GitHub-side render via PR diff preview if AGENTS.md is not exposed as a Jekyll page)
- [ ] Commit: `docs(#946): add Handoff Graph section with Mermaid diagram`

## Checkpoint B — Pre-PR final check

- [ ] AC-1 — all 5 personas have the row
- [ ] AC-2 — `grep -c` returns 5
- [ ] AC-3 — `## Handoff Graph` section exists between roster and Protected Files
- [ ] AC-4 — Mermaid encodes the 9 edges + 1 terminal node from Checkpoint A
- [ ] AC-5 — General Agent row reads `_(terminal — handles work end-to-end)_`
- [ ] AC-6 — `bundle exec jekyll build` exit 0
- [ ] AC-7 — Mermaid renders (local or GitHub)
- [ ] AC-8 — `grep -c "Handoff triggers" AGENTS.md` == 4 (prose untouched)

## Phase 3 — Ship (`/ship` flow)

- [ ] Push branch
- [ ] Open PR with `Closes #946`; no `governance-update` label needed
- [ ] CI green (or admin-merge as maintainer per #953 precedent if phantom `build` + 1-reviewer block)
- [ ] Merge `--squash --delete-branch`
- [ ] Confirm Deploy Jekyll site to Pages + Production Smoke Tests pass on merge SHA
- [ ] Comment on #946 with production verification
