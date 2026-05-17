# TODO — `bulk-content` Scope-Guard Exemption Label (#956)

**Spec:** [../SPEC.md](../SPEC.md) · **Plan:** [plan.md](plan.md)
**Plan SHA:** `ec008ac` · 3 files to touch (`.github/labels.yml`, `scripts/check-pr-scope.sh`, `CLAUDE.md`)

---

## Phase 1 — Research (done in /plan)
- [x] **T1** `.github/labels.yml` schema confirmed (flat list, no nested groups); `governance-update` lives on GitHub but **not** in YAML (drift — flagged as future-watching, NOT in scope); `CLAUDE.md:65-67` is the anchor; `AGENTS.md` doesn't mention governance labels (skip).

## Phase 2 — RED smoke test
- [ ] **T2** Create branch `chore/956-bulk-content-label`; stage 30 fixture files under `tests/`; run `PR_LABELS="bulk-content" bash scripts/check-pr-scope.sh` → expect exit 1 (Rule 2 fires despite label). Capture output. Restore working tree.

## Phase 3 — Implementation
- [ ] **T3** Wrap Rule 2 in `scripts/check-pr-scope.sh:73-79` with `bulk-content` skip check (mirror Rule 3 / `governance-update` pattern exactly). Update header comment (lines 4-25) to document the new label. Commit A on branch.

## Phase 4 — GREEN smoke test + CHECKPOINT-A
- [ ] **T4** Run 4-case behavior matrix (per SPEC AC-4):
  - Case 1: `bulk-content` + 30 files → exit 0, Rule 2 skipped
  - Case 2: no label + 30 files → exit 1, Rule 2 fires
  - Case 3: `bulk-content` + governance file → exit 1, Rule 3 fires, Rule 2 skipped
  - Case 4: `bulk-content,governance-update` + governance file → exit 0, both rules skipped
- [ ] **CHECKPOINT-A** — All 4 cases match expected exit code + stdout; outputs captured for PR body; no fixture residue.

## Phase 5 — Metadata + documentation
- [ ] **T5** Add `bulk-content` to `.github/labels.yml` (amber color `fbca04` matching governance-update caution class; description per SPEC §7). Verify YAML parses.
- [ ] **T6** Insert `bulk-content` reminder block in `CLAUDE.md` after line 67, plus anti-pattern list (refactors, unrelated changes, double-bypass) and valid-use-case list. Commit B on branch (T5 + T6 bundle).

## Phase 6 — Ship
- [ ] **T7** Push branch; `gh pr create` with 4-case behavior matrix in body + worth-watching note about `governance-update` YAML drift; **no `agent:*` label** (cross-domain), **no `governance-update` label** (not touching `.github/skills/` or `.github/instructions/`); wait for CI.
- [ ] **T8** Create the label on GitHub via `gh label create bulk-content` (workaround for the YAML-vs-live drift since no active label-sync action observed).
- [ ] **T9** `gh pr merge --admin --squash --delete-branch` once CI green; pull main; verify label persists; sanity-run script on clean tree.

---

## Acceptance criteria checklist (mirrors SPEC §3)

- [ ] **AC-1** `bulk-content` declared in `.github/labels.yml` with clear description naming Rule 2 + anti-pattern warning
- [ ] **AC-2** Label exists in repo on GitHub (verified via `gh label list`)
- [ ] **AC-3** Rule 2 wrapped in `bulk-content` skip mirroring Rule 3 / `governance-update`
- [ ] **AC-4** Behavior matrix verified — 4 cases produce expected exit codes
- [ ] **AC-5** `scripts/check-pr-scope.sh` header comment documents `bulk-content` alongside `governance-update`
- [ ] **AC-6** `CLAUDE.md` documents when to use `bulk-content` + anti-patterns
- [ ] **AC-7** No change to Rules 1, 3, or 4 (verified by Case 2 + Case 3 + Case 4 outputs)
- [ ] **AC-8** PR body includes the 4-case behavior matrix with actual exit codes + literal stdout
