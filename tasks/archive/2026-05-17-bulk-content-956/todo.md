# TODO — `bulk-content` Scope-Guard Exemption Label (#956)

**Spec:** _(archived)_ · **Plan:** [plan.md](plan.md)
**Plan SHA:** `ec008ac` · 3 files to touch (`.github/labels.yml`, `scripts/check-pr-scope.sh`, `CLAUDE.md`)

---

## Phase 1 — Research (done in /plan)
- [x] **T1** `.github/labels.yml` schema confirmed (flat list, no nested groups); `governance-update` lives on GitHub but **not** in YAML (drift — flagged as future-watching, NOT in scope); `CLAUDE.md:65-67` is the anchor; `AGENTS.md` doesn't mention governance labels (skip).

## Phase 2 — RED smoke test
- [x] **T2** RED confirmed: temp-committed 30 fixtures, `PR_LABELS="bulk-content" bash scripts/check-pr-scope.sh` → exit 1 with `VIOLATION [scope-explosion]` (label ignored). Reset cleanly.

## Phase 3 — Implementation
- [x] **T3** Wrapped Rule 2 with `bulk-content` skip mirroring Rule 3 / `governance-update`; updated header comment to document both exemption labels alongside agent-routing examples. Committed as `dcbfcd8`.

## Phase 4 — GREEN smoke test + CHECKPOINT-A
- [x] **T4** All 4 cases produced expected exit codes and key-line outputs (Case 1: skip+exit 0; Case 2: Rule 2 fires; Case 3: Rule 2 skip + Rule 3 fire; Case 4: both skip + exit 0). Outputs captured for PR body.
- [x] **CHECKPOINT-A** All cases pass; `git status --short` clean between every case; no fixture residue.

## Phase 5 — Metadata + documentation
- [x] **T5** `bulk-content` added to `.github/labels.yml` (color `8957e5` purple per `/review` revision — avoids amber collision with `severity:S4:cosmetic`; description 96 chars under GH's 100-char limit). Committed in `3837a91`, revised in `7d53c57`.
- [x] **T6** Inserted `Scope-explosion reminder` block in `CLAUDE.md` after line 67 with valid-use-case list AND anti-pattern list; double-bypass anti-pattern strengthened per `/review` to "requires explicit PR-description justification". Committed in `3837a91`, revised in `7d53c57`.

## Phase 5.5 — /review pass (added per lifecycle audit)
- [x] **/review** via `code-reviewer` agent — **Approve with revisions**. Two Majors applied (description >100 chars trimmed to 96; color amber→purple to avoid severity:S4 collision); one anti-pattern Nit strengthened; one Minor deferred (substring `grep -q` hardening — would need both Rule 2 and Rule 3 together; separate PR). Committed as `7d53c57`.

## Phase 6 — Ship
- [ ] **T7** Push branch; `gh pr create` with 4-case behavior matrix in body; **no `agent:*` label**, **no `governance-update` label** (PR doesn't touch `.github/skills/` or `.github/instructions/`); wait for CI.
- [ ] **T8** `gh label create bulk-content` on GitHub (color `8957e5`, description matching YAML) — workaround for absent label-sync.
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
