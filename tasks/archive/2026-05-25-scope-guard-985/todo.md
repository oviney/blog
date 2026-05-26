# TODO — Scope-guard label exemption (#985)

**Spec:** _(archived)_ · **Plan:** [plan.md](plan.md)
**Branch:** `fix/985-scope-guard-protected-file-bypass` (to create)

---

## Phase 0 — Setup

- [ ] 0.1 Create branch `fix/985-scope-guard-protected-file-bypass` off `main` (at `4e22be8e`)
- [ ] 0.2 Confirm working tree clean apart from known artifacts (`security.md` case-collision; untracked `worktrees/`)

## Phase 1 — Test harness (RED) — one commit

- [ ] 1.1 Create `tests/scope-guard.sh` with header docblock
- [ ] 1.2 Implement `run_case` helper (temp git repo with origin fixture, run real script, capture exit + stdout, assert)
- [ ] 1.3 Add `trap` to clean up temp dirs on exit/error
- [ ] 1.4 Wire three fixture cases (A: no-label-AGENTS.md, B: with-label-AGENTS.md, C: with-label-Gemfile)
- [ ] 1.5 Add pass/fail summary block at end
- [ ] 1.6 `chmod +x tests/scope-guard.sh`
- [ ] Verify (RED): `bash tests/scope-guard.sh` → exit 1; Case A PASS, Case B FAIL, Case C PASS
- [ ] Commit: `test(#985): add scope-guard fixture test (RED on Case B)`

## Checkpoint A — Gap confirmed

- [ ] Case A: PASS (no-label AGENTS.md still trips guard)
- [ ] Case B: FAIL (label doesn't yet bypass — the gap)
- [ ] Case C: PASS (label correctly does NOT bypass Gemfile)

## Phase 2 — Bypass logic (GREEN) — one commit

- [ ] 2.1 Add `PROTECTED_FILE_UPDATE_BYPASS=("AGENTS.md" "ARCHITECTURE.md")` array below `PROTECTED_FILES`
- [ ] 2.2 Add two-tier check inside Rule 1 loop (label + per-file allow-list → emit bypass log + `continue`)
- [ ] 2.3 Update docblock at lines 21–29: document `protected-file-update` label with PASS/FAIL examples
- [ ] 2.4 Confirm Rules 2, 3, 4 untouched
- [ ] Verify (GREEN): `bash tests/scope-guard.sh` → exit 0; all three cases PASS
- [ ] Verify (baseline): `bash scripts/check-pr-scope.sh` from this branch → PASS (no protected files in diff)
- [ ] Manual replay (AC-8): worktree at `4e22be8e^`, run with/without `PR_LABELS` → matches expected
- [ ] Commit: `fix(#985): add per-file protected-file-update label bypass to Rule 1`

## Checkpoint B — All three cases green

- [ ] Test harness: 3/3 PASS
- [ ] Manual #984-replay: with-label PASS, without-label FAIL
- [ ] No-protected-file baseline: PASS (regression guard)

## Phase 3 — CI wiring — one commit

- [ ] 3.1 Add new step to `check-agent-scope` job in `.github/workflows/test-build.yml`: `- name: Run scope-guard fixture tests` + `run: bash tests/scope-guard.sh`, placed AFTER the production check
- [ ] Verify the new step is present
- [ ] Commit: `ci(#985): run scope-guard fixture tests in check-agent-scope job`

## Phase 4 — Docs — one commit

- [ ] 4.1 Locate label documentation in `CLAUDE.md` (existing references at lines 78, 83, 99 for `governance-update` and `bulk-content`)
- [ ] 4.2 Add `protected-file-update` documentation alongside in matching format (table row or prose paragraph)
- [ ] Verify: `grep -c "protected-file-update" CLAUDE.md` ≥ 1
- [ ] Commit: `docs(#985): document protected-file-update label in CLAUDE.md`

## Checkpoint C — Full 10-AC battery before ship

- [ ] AC-1 — `PROTECTED_FILE_UPDATE_BYPASS` present in script
- [ ] AC-2 — Case A FAIL (without label), Case B PASS (with label)
- [ ] AC-3 — Case C FAIL (Gemfile + label still trips)
- [ ] AC-4 — `bash tests/scope-guard.sh` exits 0 (3/3 PASS)
- [ ] AC-5 — Workflow invokes the test
- [ ] AC-6 — `grep -c "protected-file-update" scripts/check-pr-scope.sh` ≥ 3
- [ ] AC-7 — `grep -c "protected-file-update" CLAUDE.md` ≥ 1
- [ ] AC-8 — Manual replay matches expectations
- [ ] AC-9 — `bundle exec jekyll build` exit 0
- [ ] AC-10 — `git diff --name-only main...HEAD | wc -l` ≤ 7

## Phase 5 — Ship (`/ship` flow)

- [ ] Push branch
- [ ] Open PR with `Closes #985`; apply `agent:qa-gatekeeper` + `governance-update` labels
- [ ] CI green (or admin-merge if blocked by phantom `build` + 1-reviewer rule per #953/#984 precedent)
- [ ] Merge `--squash --delete-branch`
- [ ] Confirm Deploy Jekyll site to Pages + Production Smoke Tests pass on merge SHA
- [ ] Comment on #985 with production verification
- [ ] Update [[reference-scope-guard]] memory: workaround no longer needed once merged
