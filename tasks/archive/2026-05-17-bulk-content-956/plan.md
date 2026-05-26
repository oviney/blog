# Plan — `bulk-content` Scope-Guard Exemption Label (#956)

**Spec:** _(archived)_
**Issue:** [#956](https://github.com/oviney/blog/issues/956)
**Date:** 2026-05-17
**Lifecycle phase:** PLAN
**Plan SHA:** `ec008ac`
**Anchors confirmed at this SHA:**
- `.github/labels.yml` schema — flat YAML list of `- name: / color: / description:` entries (no nested groups; comments mark categories)
- `governance-update` precedent — exists on GitHub (`gh label list`) but is **NOT** declared in `.github/labels.yml`. Silent drift; flagged as future-watching, NOT in scope here.
- `scripts/check-pr-scope.sh:73-79` — Rule 2 to wrap
- `scripts/check-pr-scope.sh:85-94` — Rule 3 / `governance-update` pattern to mirror
- `CLAUDE.md:65-67` — existing "Governance-surface reminder" block; new `bulk-content` mirror lives here
- `AGENTS.md` — does **not** mention `governance-update`; no `bulk-content` mention needed either (keeps convention consistent: labels documented in CLAUDE.md only)

---

## Context

Small, focused change: 3 files (`.github/labels.yml`, `scripts/check-pr-scope.sh`, `CLAUDE.md`). Well under the 15-file scope-explosion limit — **this PR does NOT need the `bulk-content` label itself**.

RED→GREEN structure is clean: the current script ignores `bulk-content` → smoke test fails → wrapper added → smoke test passes. Same TDD discipline as #951's validator extension.

**Worth-watching (NOT in this PR):** `governance-update` label drift between `.github/labels.yml` and live GitHub. Worth a separate small PR to add the existing label to YAML for source-of-truth correctness. Don't fold into #956.

---

## Dependency graph

```
T1 (read labels.yml schema + CLAUDE.md anchor — research only, no commit)
  │
  ▼
T2 (RED smoke test: confirm bulk-content is currently ignored)
  │
  ├──► T3 (implement Rule 2 skip wrapper in check-pr-scope.sh)
  │       │
  │       ▼
  │     T4 (GREEN smoke test: all 4 cases from SPEC AC-4)
  │       │
  │       ▼
  │   CHECKPOINT-A — 4-case smoke matrix output captured
  │       │
  ├──► T5 (add bulk-content to .github/labels.yml) ──┐
  │                                                  │
  └──► T6 (update CLAUDE.md governance-reminder block to mirror)  ──┐
                                                                    │
                                                                    ▼
                                                  T7 (branch + commits + PR + CI)
                                                                    │
                                                                    ▼
                                                  T8 (create label on GitHub via `gh label create` — sync workaround for the YAML-vs-live drift)
                                                                    │
                                                                    ▼
                                                  T9 (admin-merge + verify label exists in repo)
```

T3, T5, T6 are file-level independent. Sequencing T3 first because it's the load-bearing change and the smoke test is the primary verification; T5/T6 are the supporting metadata. Two commits on the branch keep the diff reviewable: **Commit A: script (T3)** then **Commit B: labels.yml + CLAUDE.md (T5 + T6)**.

---

## Phase 1 — Research (read-only)

### T1 — Confirm patterns from reference points

**Already done as part of `/plan`.** Findings recorded in this plan's "Anchors confirmed" block above. No code change. No commit.

---

## Phase 2 — RED smoke test

### T2 — Confirm `bulk-content` is currently ignored

**ACs satisfied:** AC-4 (RED baseline — establishes "before" state)
**Touches:** none (read-only)

**Steps:**

1. Create branch `chore/956-bulk-content-label`.
2. Create 30 untracked fixture files: `for i in {1..30}; do touch /tmp/scope-fixture-$i.md; cp /tmp/scope-fixture-$i.md tests/scope-fixture-$i.md; done` — then `git add tests/scope-fixture-*.md` (staged but uncommitted).
3. Run the script with `PR_LABELS="bulk-content"`:
   ```bash
   PR_LABELS="bulk-content" bash scripts/check-pr-scope.sh; echo "exit=$?"
   ```

**Expected (RED):** script reports `VIOLATION [scope-explosion]: <N> files changed (limit is 15)` and exits **1**, despite the label being present — proving `bulk-content` is currently a no-op.

4. Capture the output for the PR body's behavior matrix.
5. Restore the working tree: `git reset HEAD tests/scope-fixture-*.md && rm tests/scope-fixture-*.md`. Verify `git status --short` shows no fixture files.

---

## Phase 3 — Implementation

### T3 — Wrap Rule 2 with `bulk-content` skip in `scripts/check-pr-scope.sh`

**ACs satisfied:** AC-3, AC-5 (header comment update)
**Touches:** `scripts/check-pr-scope.sh`

**Steps:**

1. Wrap Rule 2 (lines 73-79) in an `if echo "${PR_LABELS:-}" | grep -q 'bulk-content'; then ... else ... fi` block. Use the **exact** comment style, indentation, and skip-notice phrasing as Rule 3 / `governance-update` (lines 85-94). The two override paths must read as siblings.
2. Update the script's header comment block (lines 4-25) to add `bulk-content` to the documented label semantics. New PASS example: `PASS: PR with bulk-content label and 30 changed files — Rule 2 skipped (atomic content backfill)`. Mirror placement of the existing governance-update PASS example.

**Verify (mechanical — actual smoke test is T4):**
- `bash -n scripts/check-pr-scope.sh` — syntax check exits 0
- `diff` shows ~10 added lines + comment updates
- No removal of any existing behavior (Rule 2 itself, no other rule altered)

**Commit on branch as Commit A.** Message: `chore(ci): allow bulk-content label to exempt PRs from scope-explosion check (#956)`.

---

## Phase 4 — GREEN smoke test (4 cases from SPEC AC-4)

### T4 — Run the 4-case behavior matrix

**ACs satisfied:** AC-4, AC-7 (other rules unchanged)
**Touches:** none (read-only verification using staged fixtures)

For each case below, re-stage 30 fixture files (or 30 + 1 governance file as needed), invoke the script with the specified `PR_LABELS`, capture exit code and the relevant violation/skip lines. Restore working tree between cases.

| Case | `PR_LABELS` | Staged files | Expected exit | Expected stdout key line |
|---|---|---|---|---|
| 1 | `"bulk-content"` | 30 fixtures under `tests/` | **0** | `check-pr-scope: bulk-content label present — skipping rule 2.` |
| 2 | `""` (unset) | 30 fixtures under `tests/` | **1** | `VIOLATION [scope-explosion]: 30 files changed (limit is 15).` |
| 3 | `"bulk-content"` | 30 fixtures + 1 file under `.github/skills/test-fixture/SKILL.md` | **1** | `VIOLATION [governance-surface]:` (Rule 3 fires; Rule 2 skipped) |
| 4 | `"bulk-content,governance-update"` | same as Case 3 | **0** | both `... skipping rule 2.` AND `... skipping rule 3.` |

**Verify:** all 4 outputs match expectations. **Save the literal stdout** of each invocation; paste into the PR body per AC-8.

**Cleanup invariant:** after each case, `git status --short` shows no fixture files. The smoke test never leaves residue.

---

### CHECKPOINT-A — 4-case smoke matrix passes

**Gate criteria (all must be true before T5/T6):**

- [ ] All 4 cases in T4 produce the expected exit code AND stdout key line
- [ ] Working tree is clean of fixtures between every case
- [ ] Outputs are captured verbatim for PR body
- [ ] No accidental edits to the script beyond T3's scope

If any case mis-behaves, return to T3 and fix the wrapper.

---

## Phase 5 — Metadata + documentation

### T5 — Add `bulk-content` to `.github/labels.yml`

**ACs satisfied:** AC-1
**Touches:** `.github/labels.yml`

**Steps:**

1. Choose a placement in the file — likely the same category as `governance-update` would belong to if it were declared. The labels.yml uses category headers (e.g., `# ── Defect lifecycle status ──`). Read the file to find or create an appropriate category (e.g., `# ── PR scope-guard overrides ──`).
2. Add the entry:
   ```yaml
   - name: bulk-content
     color: "fbca04"   # amber — same caution-class as governance-update
     description: "Deliberate bulk-content change (post backfill, byline migration, category rename) — bypasses Rule 2 (15-file scope-explosion). Only valid when splitting would create a worse intermediate main state."
   ```
3. Verify the YAML still parses: `python3 -c "import yaml; yaml.safe_load(open('.github/labels.yml'))"`.

**Verify:** `grep -A3 "bulk-content" .github/labels.yml` returns the entry; YAML parses clean.

---

### T6 — Mirror the governance-reminder block in `CLAUDE.md`

**ACs satisfied:** AC-6, anti-pattern list per SPEC §11
**Touches:** `CLAUDE.md`

**Steps:**

1. Insert a new block immediately after the existing "Governance-surface reminder" (`CLAUDE.md:65-67`), structured as a sibling reminder:
   ```markdown
   **Scope-explosion reminder:** PRs that are structurally atomic and cannot be split without creating a worse intermediate main state may carry the `bulk-content` label to bypass Rule 2 (15-file cap) in the scope guard. Use sparingly — see anti-patterns below.

   **`bulk-content` anti-patterns (do NOT use the label for):**
   - PRs that touch unrelated changes you just don't want to split
   - Refactors of any kind (refactors should be incremental; intermediate state is usually fine)
   - Combining with `governance-update` to bypass two guards on a single PR without strong justification (allowed but should be rare and explicitly called out in the PR description)

   **`bulk-content` valid use cases:**
   - Atomic content backfills (e.g., #951's 24-post `subtitle:` field addition)
   - Mass author / byline / category / tag rename across many `_posts/`
   - Atomic front-matter field migration that requires all posts together for the validator gate to pass
   ```
2. Keep the existing governance-update block unchanged (don't touch its wording).

**Verify:** `grep -c "bulk-content" CLAUDE.md` returns ≥ 5 (1 reminder + 3 anti-pattern bullets + 1 use-case heading and bullets).

**Commit T5 + T6 together as Commit B.** Message: `docs(scope-guard): declare bulk-content label and document anti-patterns (#956)`.

---

## Phase 6 — Ship

### T7 — Push branch, open PR, watch CI

**ACs satisfied:** AC-8 (PR body includes smoke matrix)
**Touches:** git remote.

**Steps:**

1. `git push -u origin chore/956-bulk-content-label`
2. `gh pr create` with:
   - **Summary:** Adds `bulk-content` label and wraps Rule 2 in a skip check mirroring `governance-update`/Rule 3.
   - **Behavior matrix table:** the 4 cases from T4 with actual exit codes and the literal stdout key-line per case.
   - **Test plan:** `bash scripts/check-pr-scope.sh` was invoked locally for each case; CI re-validates the script syntax.
   - **Worth-watching note:** flag the `governance-update` YAML drift as a separate small-PR follow-up.
   - **No `agent:*` label** — this touches `scripts/` (QA) AND `CLAUDE.md` + `.github/labels.yml` (governance-ish). Same cross-domain situation as #951; falls into "human PR" general-scope path.
   - **No `governance-update` label** — `.github/labels.yml` is not in `.github/skills/` or `.github/instructions/`, so it doesn't trip Rule 3. `CLAUDE.md` likewise. Verify before pushing.
3. Wait for CI; investigate any non-flake failure.

**Verify:** PR opens cleanly; all 6 CI checks expected to pass.

---

### T8 — Create label on GitHub (workaround for YAML-vs-live drift)

**ACs satisfied:** AC-2
**Touches:** GitHub repo settings (label creation, side-effect only)

**Steps:**

```bash
gh label create bulk-content \
  --repo oviney/blog \
  --color "fbca04" \
  --description "Deliberate bulk-content change (post backfill, byline migration, category rename) — bypasses Rule 2 (15-file scope-explosion). Only valid when splitting would create a worse intermediate main state."
```

**Rationale:** the repo doesn't appear to have an active label-sync GitHub Action (`governance-update` exists on GitHub but not in YAML). So the YAML is informational source-of-truth, and labels must be created manually for them to exist. Running this BEFORE the PR merges is safer — anyone who hits the script after merge will be able to apply the label without it being missing.

**Verify:** `gh label list --repo oviney/blog --search "bulk-content"` returns the new label with the expected color and description.

---

### T9 — Admin-merge + post-merge verification

**ACs satisfied:** AC-2 (final), AC-7 (final)
**Touches:** git remote (merge), GitHub PR (close).

**Steps:**

1. `gh pr merge <N> --repo oviney/blog --admin --squash --delete-branch` once CI is green.
2. Verify the issue closed via the PR's `Closes #956` footer (or close manually if not).
3. Run `gh label list --repo oviney/blog --search "bulk-content"` — confirm label still present after merge.
4. Run a final sanity invocation of the merged script locally:
   ```bash
   git pull --ff-only
   bash scripts/check-pr-scope.sh; echo "exit=$?"   # without PR_LABELS — should be clean, no fixtures, exit 0
   ```
5. Update `tasks/todo.md` to mark all phases complete.

---

## Risk register

| Risk | Mitigation |
|---|---|
| Label color collision with `governance-update` (both amber) makes them visually indistinguishable in PR triage | Acceptable — they're both caution-class. If user prefers distinction, swap `fbca04` → `ff9800` (orange) before T5 commit. |
| The smoke test's fixture-staging pattern accidentally commits fixture files | Cleanup step in T2 and T4 explicitly `git reset HEAD tests/scope-fixture-*.md && rm` after each case. Add `git status --short` assertion before each case starts. |
| `bulk-content` label collides with an existing label I missed | T1's `gh label list ... search "bulk"` confirmed clean. Re-check immediately before T8. |
| `scripts/check-pr-scope.sh` has a CI workflow that runs against the script change and breaks the script itself (chicken-and-egg) | The CI runs the script via `bash scripts/check-pr-scope.sh` against the changed-files list; the script's own change is just one of the changed files. Self-check on the implementation PR will report 3 files changed and apply Rule 3 (touches `CLAUDE.md`? No — CLAUDE.md isn't governance-surface per the regex `^\.github/(skills|instructions)/`). Clean. |
| YAML schema rejection at sync time (if a label-sync action exists silently) | T5 verifies via `python3 yaml.safe_load`. No further sync action observed at SHA `ec008ac`. |
| Anti-pattern wording in CLAUDE.md is too soft and gets ignored | Phrase the section as **hard rules** rather than guidance (e.g., "do NOT use the label for refactors"). User approved this wording strength in SPEC clarifying answer #2. |
| Worth-watching `governance-update` drift turns out to indicate a broken label-sync action that should be fixed FIRST | Spot-check `.github/workflows/` for label-sync action references. If one exists and is silently failing, surface as a separate issue but don't block #956. |
