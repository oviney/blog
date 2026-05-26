# Plan — Scope-guard label exemption for legitimate AGENTS.md / ARCHITECTURE.md changes (#985)

**Spec:** _(archived)_
**Issue:** [#985](https://github.com/oviney/blog/issues/985)
**Date:** 2026-05-24
**Labels:** `agent:qa-gatekeeper`, `governance-update`
**Branch:** `fix/985-scope-guard-protected-file-bypass` (to be created)
**Lifecycle phase:** PLAN

---

## Scope summary

Bash change to `scripts/check-pr-scope.sh` (per-file bypass inside Rule 1), new fixture-based test harness (`tests/scope-guard.sh`), one workflow-step wiring (`.github/workflows/test-build.yml`), and one docs row (`CLAUDE.md`). Four atomic commits. RED→GREEN sequencing — failing test harness lands first to expose the gap, then the bypass logic makes it pass.

---

## Dependency graph

```
Phase 0 (branch setup)
    │
    ▼
Phase 1 (tests/scope-guard.sh — RED)
    │   Case A passes (current behaviour: AGENTS.md no label → fail)
    │   Case B FAILS (current behaviour: AGENTS.md with label → still fails — gap exposed)
    │   Case C passes (current behaviour: Gemfile with label → fail)
    │
    ▼   Checkpoint A: confirm Case B is the only failing case
    │
Phase 2 (check-pr-scope.sh bypass — GREEN)
    │   Case A still passes (no-label behaviour unchanged)
    │   Case B now passes (label bypass works)
    │   Case C still passes (label does NOT exempt Gemfile)
    │
    ▼   Checkpoint B: all three cases pass; replay against #984 diff state confirms fix
    │
Phase 3 (CI wiring)
    │   .github/workflows/test-build.yml runs tests/scope-guard.sh
    │
    ▼
Phase 4 (CLAUDE.md docs row)
    │
    ▼   Checkpoint C: full 10-AC battery
    │
Phase 5 (ship)
```

**Why this order, not RED→GREEN→docs→CI:**
- Putting the test BEFORE the implementation surfaces the gap explicitly (the test was the reason for this PR in the first place).
- CI wiring AFTER both test + script ensures CI doesn't run a failing test against an unfixed script on any pushed commit. CI runs only on branch tip; pushing all four commits together means CI sees the final green state.
- Docs row at the end so the commit message can reference the final label name (no rework if the label name changed during build).

---

## Vertical slices

### Phase 0 — Branch setup

| Task | Action |
|---|---|
| 0.1 | Create branch `fix/985-scope-guard-protected-file-bypass` off `main` (post-#984-merge state at `4e22be8e`) |
| 0.2 | Confirm working tree clean (sans the pre-existing `security.md` case-collision artifact + untracked `worktrees/`) |

---

### Phase 1 — `tests/scope-guard.sh` (RED — fixture harness lands first)

*One atomic commit. Implements the test before the implementation it tests.*

| Task | Action |
|---|---|
| 1.1 | Create `tests/scope-guard.sh` (~80 lines). Header documents the three fixture cases and the temp-git-repo pattern. |
| 1.2 | Define `run_case <name> <pr_labels> <changed_file> <expected_exit> <expected_grep>` helper. Creates temp git repo via `mktemp -d`, `git init -q`, configures `origin` to a second temp clone (so `origin/main` resolves), commits a baseline, branches, modifies the changed file, copies the production `scripts/check-pr-scope.sh` into the temp repo, runs it with the given `PR_LABELS`, captures exit code + stdout, asserts expected exit + grep, prints pass/fail line. |
| 1.3 | Add `trap` to clean up the temp dir on exit. |
| 1.4 | Wire the three fixture cases per SPEC §3 AC-4 (Case A no-label-AGENTS.md, Case B with-label-AGENTS.md, Case C with-label-Gemfile). |
| 1.5 | Final block: `if [ $FAIL -eq 0 ]; then echo "All N cases passed"; exit 0; else exit 1; fi`. |
| 1.6 | `chmod +x tests/scope-guard.sh`. |

**Phase 1 ACs covered:** AC-4 (test structure exists).

**Phase 1 verification (expected RED):**
```bash
bash tests/scope-guard.sh
# Expected: Case A PASS, Case B FAIL, Case C PASS — overall exit 1
# The failure is the entire point — Case B is the gap we're filling next.
```

**Commit:** `test(#985): add scope-guard fixture test (RED on Case B)`

---

### Checkpoint A — Confirm the gap is real

- [ ] Case A: PASS (AGENTS.md, no label → guard fails as expected)
- [ ] Case B: **FAIL** (AGENTS.md, label → guard fails — this is the gap we're about to fix)
- [ ] Case C: PASS (Gemfile, label → guard fails as expected — label doesn't blanket-bypass)

If Case A or Case C fails, the test harness has a bug — debug before moving to Phase 2. If Case B passes, the script already has the bypass somehow — recheck the issue's premise.

---

### Phase 2 — `scripts/check-pr-scope.sh` per-file bypass (GREEN)

*One atomic commit. Smallest possible change to the script.*

| Task | Action |
|---|---|
| 2.1 | Add `PROTECTED_FILE_UPDATE_BYPASS=("AGENTS.md" "ARCHITECTURE.md")` array immediately below `PROTECTED_FILES=( … )` (around line 52). |
| 2.2 | Modify Rule 1 loop (lines 75–80) to a two-tier check: inside the existing `if echo "$CHANGED_FILES" | grep -qx "$protected"; then` block, check `if echo "${PR_LABELS:-}" | grep -q 'protected-file-update' && printf '%s\n' "${PROTECTED_FILE_UPDATE_BYPASS[@]}" | grep -qx "$protected"; then` → emit bypass log line + `continue`. |
| 2.3 | Update docblock at lines 21–29: add `protected-file-update` entry alongside `bulk-content` and `governance-update`, with one PASS example (`AGENTS.md` modified + label → bypass) and one FAIL example (`Gemfile` modified + label → still fails). |
| 2.4 | No changes to Rules 2, 3, 4 or the summary block. |

**Phase 2 ACs covered:** AC-1, AC-2, AC-3, AC-6.

**Phase 2 verification (expected GREEN):**
```bash
bash tests/scope-guard.sh
# Expected: All three cases PASS — overall exit 0
```

**Manual replay (AC-8):**
```bash
# In a separate worktree, NOT this branch's working tree
git worktree add /tmp/replay-984 4e22be8e^
cd /tmp/replay-984
git diff --name-only 4e22be8e^..4e22be8e   # confirm AGENTS.md in diff
# Now run the script as if at the merge commit's pre-state with various labels
# (replay using the new script content)
cp <branch>/scripts/check-pr-scope.sh ./scripts/check-pr-scope.sh
git diff main...4e22be8e --name-only > /tmp/changed.txt    # cheap stand-in
PR_LABELS="" bash scripts/check-pr-scope.sh    # expect FAIL on AGENTS.md
PR_LABELS="protected-file-update" bash scripts/check-pr-scope.sh   # expect PASS
git worktree remove /tmp/replay-984
```

**Commit:** `fix(#985): add per-file protected-file-update label bypass to Rule 1`

---

### Checkpoint B — All three cases green

- [ ] `bash tests/scope-guard.sh` exits 0 with all three cases PASS
- [ ] Manual replay against #984 diff state confirms the original false positive is now fixed
- [ ] `bash scripts/check-pr-scope.sh` against the current branch (no protected files) still PASSES — baseline behaviour preserved

---

### Phase 3 — CI wiring (`test-build.yml`)

*One atomic commit. Single workflow file change.*

| Task | Action |
|---|---|
| 3.1 | In `.github/workflows/test-build.yml`, add a new step under the existing `check-agent-scope` job (lines 95–109): `- name: Run scope-guard fixture tests` + `run: bash tests/scope-guard.sh`. Place it AFTER the `Check agent scope compliance` step so the production check runs first. |
| 3.2 | No `env:` block needed for the new step — `tests/scope-guard.sh` sets `PR_LABELS` internally per case. |

**Phase 3 ACs covered:** AC-5.

**Phase 3 verification:**
```bash
yq eval '.jobs.check-agent-scope.steps' .github/workflows/test-build.yml   # confirm new step present
# CI verification deferred to /ship — runs on push.
```

**Commit:** `ci(#985): run scope-guard fixture tests in check-agent-scope job`

---

### Phase 4 — `CLAUDE.md` docs row

*One atomic commit. Docs only.*

| Task | Action |
|---|---|
| 4.1 | Find the "Local Agent Labels" or similar label-documentation table in `CLAUDE.md` (line 78 area mentions `governance-update`, line 83 mentions `bulk-content`). |
| 4.2 | Add a `protected-file-update` row/paragraph alongside the existing two labels, with one-line definition + use cases ("issue-driven `AGENTS.md` or `ARCHITECTURE.md` changes; does NOT bypass `_config.yml`, `Gemfile*`, `.github/CODEOWNERS`, `.github/copilot-instructions.md`"). |
| 4.3 | If the existing label documentation lives in a tabular form, mirror it; if prose, mirror prose. |

**Phase 4 ACs covered:** AC-7.

**Phase 4 verification:**
```bash
grep -c "protected-file-update" CLAUDE.md   # expect ≥ 1
```

**Commit:** `docs(#985): document protected-file-update label in CLAUDE.md`

---

### Checkpoint C — Full 10-AC battery

| AC | Check |
|----|---|
| AC-1 | `grep -n "PROTECTED_FILE_UPDATE_BYPASS" scripts/check-pr-scope.sh` → present |
| AC-2 | Case A (no-label) FAILs, Case B (with-label-AGENTS.md) PASSes — covered by test harness |
| AC-3 | Case C (with-label-Gemfile) FAILs — covered by test harness |
| AC-4 | `bash tests/scope-guard.sh` exits 0 with 3/3 PASS |
| AC-5 | `.github/workflows/test-build.yml` invokes `tests/scope-guard.sh` |
| AC-6 | `grep -c "protected-file-update" scripts/check-pr-scope.sh` ≥ 3 (array + bypass log + docblock) |
| AC-7 | `grep -c "protected-file-update" CLAUDE.md` ≥ 1 |
| AC-8 | Manual #984-replay PASSes with label, FAILs without (Checkpoint B) |
| AC-9 | `bundle exec jekyll build` exits 0 |
| AC-10 | `git diff --name-only main...HEAD` returns ≤ 7 files (lifecycle + 4 substantive) |

**Pass criteria:** all 10 ACs green.

---

### Phase 5 — Ship

*Standard `/ship` flow.*

| Task | Action |
|---|---|
| 5.1 | Push branch `fix/985-scope-guard-protected-file-bypass`. |
| 5.2 | Open PR with `Closes #985`. Apply `agent:qa-gatekeeper` + `governance-update` labels (the script change touches `scripts/` — QA gatekeeper's domain — and the policy change is a governance update). |
| 5.3 | CI: `check-agent-scope` should pass (no protected file in this PR's diff); new scope-guard test step should pass on all three cases. |
| 5.4 | Wait for CI green. Admin-merge if blocked by 1-reviewer rule. |
| 5.5 | Post-merge: confirm Deploy Jekyll site to Pages + Production Smoke Tests pass on merge SHA. |
| 5.6 | Comment on #985 with production verification notes. |
| 5.7 | Update [[reference-scope-guard]] memory to note that #985 is merged and the workaround is no longer needed. |

---

## Risks (from SPEC §10, re-evaluated)

| Risk | Realised? | Plan response |
|---|---|---|
| `grep -q 'protected-file-update'` substring-matches a confusable label like `protected-file-update-experimental` | No (no such label exists today) | Match `bulk-content` / `governance-update` precedent of unanchored grep; document as future hardening |
| Temp-git-repo test fixtures flaky in CI | Unknown until Phase 5 CI run | Each case ~1s; if flaky, add `set -x` tracing in the test harness |
| Workflow-file edit (`.github/workflows/test-build.yml`) trips Rule 4 agent-scope check | No — `agent:qa-gatekeeper` is explicitly allowed `.github/workflows/` (script line 128, AGENTS.md line 67) | None needed |
| Script change breaks the existing guard for unrelated in-flight PRs | Mitigated by Checkpoint B (no-protected-file baseline still passes) and Case A (no-label behaviour preserved) | None additional |
| Phantom `build` check + 1-reviewer rule blocks merge | Yes — recurring | Admin-merge per #953 / #984 precedent |

---

## Out of scope (locked, per SPEC §11)

- Removing files from `PROTECTED_FILES`
- Extending bypass to infra files
- Extending `governance-update` to cover Rule 1
- Refactoring script structure
- Adding a `--self-test` mode to the script
- A separate `LABELS.md` doc
- Backfilling tests for existing `bulk-content` / `governance-update` rules
- Touching `AGENTS.md` or `ARCHITECTURE.md` (they're the test subject, not the target)
