# SPEC — `bulk-content` Scope-Guard Exemption Label (#956)

**Status:** Draft — awaiting approval
**Issue:** [#956](https://github.com/oviney/blog/issues/956)
**Labels:** `agent:qa-gatekeeper`
**Date:** 2026-05-17
**Lifecycle phase:** DEFINE
**Spawned from:** discovered while shipping #951 — PR #955 hit the 15-file scope-explosion rule with no override mechanism.

---

## 1. Situation

`scripts/check-pr-scope.sh:73-79` enforces an **unconditional** 15-file maximum on any PR. Rule 3 (governance-surface) already has a deliberate-intent override via the `governance-update` label (mirrored at lines 85-94). Rule 2 has no equivalent.

This bit us shipping #951: the SPEC required all 24 posts to be backfilled atomically with the validator gate, so the 26-file PR was structurally unsplittable without creating a half-broken `main` state. We admin-bypassed CI to ship #951. This issue closes the methodology gap so the next bulk-content PR (post backfill, byline migration, category rename, author rename, mass front-matter field addition) doesn't need a bypass.

Repo state at SHA `ec008ac`:
- `scripts/check-pr-scope.sh:73-79` — Rule 2, unconditional
- `scripts/check-pr-scope.sh:85-94` — Rule 3, governance-update precedent
- `.github/labels.yml` — declares labels; `governance-update` already lives here
- `gh label list` shows `governance-update` description: "Deliberate governance/skill file update — bypasses governance-surface scope check" — the model wording

---

## 2. Objective

Add a `bulk-content` label to the repo. When a PR carries it, `check-pr-scope.sh` skips **Rule 2 only** (the 15-file scope-explosion cap). All other rules — protected files (Rule 1), governance-surface (Rule 3), agent-scope (Rule 4) — apply unchanged.

The label is intentionally narrow: it does NOT mean "trust this PR." It means "this change is structurally atomic and splitting it would create a worse outcome." Reviewers and the label itself should treat it as suspect by default.

---

## 3. Acceptance Criteria

- [ ] **AC-1** `bulk-content` label declared in `.github/labels.yml` with a clear description that names the rule it exempts and warns against overuse.
- [ ] **AC-2** Label exists in the repo on GitHub (created via `gh label create` or whatever mechanism `.github/labels.yml` uses to sync — verify both).
- [ ] **AC-3** `scripts/check-pr-scope.sh` Rule 2 wrapped in a `PR_LABELS contains "bulk-content"` skip check, mirroring the Rule 3 / `governance-update` pattern at lines 85-94. Emits the same one-line skip notice when present.
- [ ] **AC-4** Behavior matrix verified by inline smoke-test invocations (paste output into PR body):
  - `PR_LABELS="bulk-content"` + 30-file fixture → Rule 2 skipped, exits 0 (assuming no other violations)
  - `PR_LABELS=""` + 30-file fixture → Rule 2 fires, exits 1
  - `PR_LABELS="bulk-content"` + 30 files **including** `.github/skills/foo/SKILL.md` (no `governance-update` label) → Rule 2 skipped BUT Rule 3 fires, exits 1
  - `PR_LABELS="bulk-content,governance-update"` + 30 files including `.github/skills/foo/SKILL.md` → both Rules 2 and 3 skipped, exits 0
- [ ] **AC-5** `scripts/check-pr-scope.sh` header comment (lines 4-25) updated to document the `bulk-content` semantics alongside the existing `governance-update` mention. New PASS/FAIL example: `PASS: PR with bulk-content label and 30 changed files — Rule 2 skipped (atomic content backfill)`.
- [ ] **AC-6** `CLAUDE.md` documents when to use `bulk-content` in the existing governance-reminder section that mentions `governance-update`, with explicit anti-pattern guidance: do NOT use `bulk-content` just because you don't want to split a PR; use it when splitting creates an intermediate `main` state worse than the unsplit PR.
- [ ] **AC-7** No change to Rule 1 (protected files), Rule 3 (governance-surface), Rule 4 (agent-scope) — verified by running the script with various fixtures and confirming behaviour is unchanged.
- [ ] **AC-8** PR body includes the four-case behavior matrix from AC-4 with actual exit codes and the script's stdout, plus a note that `bash scripts/check-pr-scope.sh` was invoked locally with each `PR_LABELS` combination.

---

## 4. Commands

```bash
# Local smoke test (no real PR needed)
PR_LABELS="bulk-content" \
  bash scripts/check-pr-scope.sh; echo "exit=$?"

# Verify label exists in repo after merge
gh label list --repo oviney/blog --search "bulk-content"

# Verify in-repo declaration
grep -A3 "bulk-content" .github/labels.yml
```

For the smoke test, since the script diffs against `origin/main`, a temporary fixture branch with 30 trivial file edits (e.g., `touch tests/fixture-{1..30}.txt`) is the simplest way to exercise the file-count branch. Don't commit the fixtures; just `git add -N` and run the script locally.

---

## 5. Files to change

| File | Change |
|---|---|
| `.github/labels.yml` | Declare `bulk-content` with description naming the Rule 2 exemption + anti-pattern warning |
| `scripts/check-pr-scope.sh` | Wrap Rule 2 (lines 73-79) in `if PR_LABELS contains "bulk-content" → skip; else → enforce`. Add to header comment (lines 4-25). |
| `CLAUDE.md` | Add one-line `bulk-content` usage note alongside the existing `governance-update` mention |
| (optional) `AGENTS.md` | Same one-line note if the repo's convention is to document labels in both files — verify |

Expected file count: **3 or 4**. Well under the 15-file scope-explosion limit — this PR doesn't need its own exemption.

---

## 6. Script change pattern (mirrors Rule 3 / `governance-update`)

Reference pattern at `scripts/check-pr-scope.sh:85-94`:

```bash
if echo "${PR_LABELS:-}" | grep -q 'governance-update'; then
  echo "check-pr-scope: governance-update label present — skipping rule 3."
else
  # Rule 3 body
fi
```

Apply the same wrapper to Rule 2:

```bash
# Rule 2: >15 files changed (scope explosion)
# Skip if PR is a deliberate bulk-content change (label: bulk-content)
if echo "${PR_LABELS:-}" | grep -q 'bulk-content'; then
  echo "check-pr-scope: bulk-content label present — skipping rule 2."
else
  FILE_COUNT=$(echo "$CHANGED_FILES" | wc -l | tr -d ' ')
  if [ "$FILE_COUNT" -gt 15 ]; then
    echo "VIOLATION [scope-explosion]: $FILE_COUNT files changed (limit is 15). Split this PR into smaller, focused changes."
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
fi
```

Use the **exact same indentation, comment style, and skip-notice phrasing** as Rule 3 so the two override paths read as siblings. A future reader should immediately see `bulk-content` and `governance-update` as two instances of the same pattern.

---

## 7. Label declaration in `.github/labels.yml`

Pattern depends on the file's current format. Likely something like:

```yaml
- name: bulk-content
  color: "<distinct from governance-update; suggest a yellow/amber to signal caution>"
  description: "Deliberate bulk-content change (post backfill, byline migration, category rename) — bypasses Rule 2 (15-file scope-explosion). Only valid when splitting would create a worse intermediate main state."
```

Verify the file's actual schema before writing. Implementation step 1 is to read `.github/labels.yml` and find the `governance-update` entry to use as the template.

---

## 8. Boundaries

| Always | Ask first | Never |
|---|---|---|
| Mirror the Rule 3 / `governance-update` pattern exactly — comment style, indentation, skip-notice wording | Whether to also add a `governance-update`-style note to `AGENTS.md` (only if convention says both files document labels) | Add overrides to Rule 1 (protected files) — those are hard guards |
| Verify the label exists on GitHub (`gh label list`), not just in the YAML, before closing | Whether to weaken any **other** rule along the way | Add overrides to Rule 4 (agent-scope) — that's #951's separate problem; don't conflate |
| Document the anti-pattern (don't use this just to skip splitting) in CLAUDE.md | — | Use the `bulk-content` label on this PR itself (it touches ~4 files, well under 15) |
| Smoke-test all 4 cases from AC-4 locally before pushing | — | Modify Rule 2's underlying behavior (the 15-file limit stays 15 when the label is absent) |

---

## 9. Out of Scope

- Lowering the 15-file limit
- Adding overrides for Rules 1, 3, or 4
- Adding a general `--force` flag to the scope guard
- Reducing other CI checks' strictness
- Refactoring `check-pr-scope.sh` (resist the temptation; one-purpose PRs)
- Adding a formal shell-script test framework (bats, shellspec) — out of scope; smoke tests in PR body suffice
- Backfilling the `bulk-content` label onto #955 retroactively (it's already merged)

---

## 10. Definition of Done

- All 8 ACs checked.
- PR description includes the 4-case behavior matrix with actual exit codes pasted in from local invocation.
- `gh label list --repo oviney/blog --search bulk-content` returns the label with the correct description after merge.
- `grep -A3 "bulk-content" .github/labels.yml` returns the entry.
- The PR does NOT itself carry the `bulk-content` label (would be ironic and undermine the point).
- Merged via standard PR flow; admin-merge acceptable per repo convention if CI is otherwise green.

---

## 11. Anti-patterns to surface in CLAUDE.md

The doc change should explicitly call out misuses to forestall them:

- ❌ Using `bulk-content` because you don't want the friction of two PRs for unrelated changes
- ❌ Using `bulk-content` for a refactor that touches 20 files (refactors should be split; intermediate state is usually fine for refactors)
- ❌ Using `bulk-content` alongside `governance-update` to bypass two guards on a single PR without strong justification (allowed but should be rare and called out in the PR description)
- ✅ Using `bulk-content` for: post backfills, mass byline / author changes, category or tag renames touching many `_posts/`, atomic front-matter field migrations
