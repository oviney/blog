#!/usr/bin/env bash
# eval-agent-pr.sh — Score a Copilot-authored PR against a quality rubric.
#
# Dependencies: gh CLI, jq
#
# Usage:
#   ./scripts/eval-agent-pr.sh <pr_number>
#   ./scripts/eval-agent-pr.sh <pr_number> [owner/repo]
#
# Output:
#   .agent-evals/<pr_number>.json  (also printed to stdout)
#
# Exit codes:
#   0 — all rubric dimensions pass their hard thresholds
#   1 — one or more dimensions fail their hard threshold

set -euo pipefail

PR_NUMBER="${1:?Usage: eval-agent-pr.sh <pr_number> [owner/repo]}"
REPO="${2:-$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "oviney/blog")}"

EVAL_DIR=".agent-evals"
OUTPUT_FILE="${EVAL_DIR}/${PR_NUMBER}.json"

mkdir -p "$EVAL_DIR"

echo "Evaluating PR #${PR_NUMBER} in ${REPO}…" >&2

# ── Fetch PR metadata ─────────────────────────────────────────────────────────

PR_JSON=$(gh api "/repos/${REPO}/pulls/${PR_NUMBER}")
COMMITS_JSON=$(gh api "/repos/${REPO}/pulls/${PR_NUMBER}/commits")
REVIEWS_JSON=$(gh api "/repos/${REPO}/pulls/${PR_NUMBER}/reviews")
FILES_JSON=$(gh api "/repos/${REPO}/pulls/${PR_NUMBER}/files?per_page=100")
HEAD_SHA=$(echo "$PR_JSON" | jq -r '.head.sha')
CHECKS_JSON=$(gh api "/repos/${REPO}/commits/${HEAD_SHA}/check-runs" | jq '.check_runs')
TIMELINE_JSON=$(gh api \
  -H "Accept: application/vnd.github.mockingbird-preview+json" \
  "/repos/${REPO}/issues/${PR_NUMBER}/timeline")

# ── PR summary ────────────────────────────────────────────────────────────────

PR_TITLE=$(echo "$PR_JSON"  | jq -r '.title')
PR_STATE=$(echo "$PR_JSON"  | jq -r '.state')
PR_MERGED=$(echo "$PR_JSON" | jq '.merged // false')

# ── 1. Scope adherence ────────────────────────────────────────────────────────
# Protected files must never be touched by agents.  Flag any change to them as
# out-of-scope.  The full file list is included so reviewers can inspect scope.

PROTECTED_PATTERN='^(_config\.yml|Gemfile|Gemfile\.lock|\.github/CODEOWNERS|\.github/copilot-instructions\.md)'
CHANGED_FILES_LIST=$(echo "$FILES_JSON" | jq -r '.[].filename')
TOTAL_FILES=$(echo "$FILES_JSON" | jq 'length')
OUT_OF_SCOPE_FILES=$(echo "$CHANGED_FILES_LIST" | { grep -E "$PROTECTED_PATTERN" || true; })
OOS_COUNT=$(echo "$OUT_OF_SCOPE_FILES" | { grep -c . || true; })
# If CHANGED_FILES_LIST is empty, OOS_COUNT is incorrectly 1 from grep -c; reset
[[ "$TOTAL_FILES" -eq 0 ]] && OOS_COUNT=0

if [[ "$TOTAL_FILES" -eq 0 ]]; then
  SCOPE_PASS=false
  SCOPE_NOTE="No files changed"
elif [[ "$OOS_COUNT" -gt 0 ]]; then
  SCOPE_PASS=false
  SCOPE_NOTE="Protected files modified"
else
  SCOPE_PASS=true
  SCOPE_NOTE="All ${TOTAL_FILES} changed file(s) appear in-scope"
fi

OOS_ARRAY=$(echo "$OUT_OF_SCOPE_FILES" | jq -R -s 'split("\n") | map(select(length > 0))')
ALL_FILES_ARRAY=$(echo "$CHANGED_FILES_LIST" | jq -R -s 'split("\n") | map(select(length > 0))')

SCOPE_JSON=$(jq -n \
  --argjson pass         "$SCOPE_PASS" \
  --arg     note         "$SCOPE_NOTE" \
  --argjson total_files  "$TOTAL_FILES" \
  --argjson oos_count    "$OOS_COUNT" \
  --argjson oos_files    "$OOS_ARRAY" \
  --argjson all_files    "$ALL_FILES_ARRAY" \
  '{pass: $pass, note: $note, total_files: $total_files,
    out_of_scope_count: $oos_count, out_of_scope_files: $oos_files,
    changed_files: $all_files}')

# ── 2. Atomic commits ─────────────────────────────────────────────────────────
# Each commit should address a single concern.  Heuristic: flag any commit
# whose subject line contains two or more distinct action verbs, suggesting it
# bundles unrelated work.

COMMIT_COUNT=$(echo "$COMMITS_JSON" | jq 'length')
MULTI_CONCERN_COUNT=0
MULTI_CONCERN_SUBJECTS=()

while IFS= read -r msg; do
  subject=$(echo "$msg" | head -1)
  # Two or more action verbs separated by "and" / "&" / "," → multi-concern
  if echo "$subject" | grep -qiE \
    '(add|fix|update|remove|refactor|implement|create|delete)[^,]+(and|,)[[:space:]]+(add|fix|update|remove|refactor|implement|create|delete)'; then
    MULTI_CONCERN_COUNT=$((MULTI_CONCERN_COUNT + 1))
    MULTI_CONCERN_SUBJECTS+=("$subject")
  fi
done < <(echo "$COMMITS_JSON" | jq -r '.[].commit.message')

if [[ "$MULTI_CONCERN_COUNT" -gt 0 ]]; then
  ATOMIC_PASS=false
  ATOMIC_NOTE="${MULTI_CONCERN_COUNT} commit(s) may bundle multiple concerns"
else
  ATOMIC_PASS=true
  ATOMIC_NOTE="${COMMIT_COUNT} commit(s); each appears single-concern"
fi

MC_ARRAY=$(printf '%s\n' "${MULTI_CONCERN_SUBJECTS[@]+"${MULTI_CONCERN_SUBJECTS[@]}"}" \
  | jq -R -s 'split("\n") | map(select(length > 0))')

ATOMIC_JSON=$(jq -n \
  --argjson pass               "$ATOMIC_PASS" \
  --arg     note               "$ATOMIC_NOTE" \
  --argjson commit_count       "$COMMIT_COUNT" \
  --argjson multi_concern_count "$MULTI_CONCERN_COUNT" \
  --argjson flagged_subjects   "$MC_ARRAY" \
  '{pass: $pass, note: $note, commit_count: $commit_count,
    multi_concern_count: $multi_concern_count,
    flagged_subjects: $flagged_subjects}')

# ── 3. Test coverage ──────────────────────────────────────────────────────────
# Count LOC added to test files vs. "code" files (shell, JS/TS, Ruby, Python).
# Config/markup files (.yml, .json, .md) are excluded from the code LOC count
# because they carry no executable logic requiring test coverage.
# Hard threshold: fail when code_loc > 50 and test_loc == 0.

TEST_LOC=$(echo "$FILES_JSON" | jq \
  '[.[] | select(.filename | test("tests/|specs/|\\.test\\.|\\.spec\\.|_test\\.")) | .additions] | add // 0')
CODE_LOC=$(echo "$FILES_JSON" | jq \
  '[.[] | select(
      (.filename | test("tests/|specs/|\\.test\\.|\\.spec\\.|_test\\.") | not) and
      (.filename | test("\\.(js|ts|sh|rb|py|go)$"))
    ) | .additions] | add // 0')

if [[ "$CODE_LOC" -eq 0 ]]; then
  COVERAGE_PASS=true
  COVERAGE_RATIO="null"
  COVERAGE_NOTE="No executable code changes (config/docs only); coverage N/A"
elif [[ "$TEST_LOC" -gt 0 ]]; then
  COVERAGE_RATIO_RAW=$(echo "scale=3; $TEST_LOC / $CODE_LOC" | bc)
  COVERAGE_RATIO="$COVERAGE_RATIO_RAW"
  COVERAGE_PASS=true
  COVERAGE_NOTE="test_loc=${TEST_LOC} / code_loc=${CODE_LOC} = ${COVERAGE_RATIO_RAW}"
else
  COVERAGE_RATIO="0.000"
  if [[ "$CODE_LOC" -gt 50 ]]; then
    COVERAGE_PASS=false
    COVERAGE_NOTE="No test changes alongside ${CODE_LOC} code LOC (hard threshold: code_loc > 50 requires tests)"
  else
    COVERAGE_PASS=true
    COVERAGE_NOTE="No tests added; code_loc=${CODE_LOC} is below the 50-LOC threshold"
  fi
fi

COVERAGE_JSON=$(jq -n \
  --argjson pass      "$COVERAGE_PASS" \
  --arg     note      "$COVERAGE_NOTE" \
  --argjson test_loc  "$TEST_LOC" \
  --argjson code_loc  "$CODE_LOC" \
  --arg     ratio     "$COVERAGE_RATIO" \
  '{pass: $pass, note: $note, test_loc: $test_loc, code_loc: $code_loc,
    ratio: (if $ratio == "null" then null else ($ratio | tonumber) end)}')

# ── 4. CI status ──────────────────────────────────────────────────────────────
# All completed checks must conclude "success" or "skipped".

TOTAL_CHECKS=$(echo "$CHECKS_JSON" | jq 'length')
FAILED_CHECKS=$(echo "$CHECKS_JSON" | jq \
  '[.[] | select(.status == "completed" and
    (.conclusion != "success" and .conclusion != "skipped" and .conclusion != null))] | length')
FAILED_NAMES=$(echo "$CHECKS_JSON" | jq -r \
  '[.[] | select(.status == "completed" and
    (.conclusion != "success" and .conclusion != "skipped" and .conclusion != null)) | .name]
  | join(", ")')

if [[ "$TOTAL_CHECKS" -eq 0 ]]; then
  CI_PASS=true
  CI_NOTE="No CI checks recorded for this PR's head commit"
elif [[ "$FAILED_CHECKS" -gt 0 ]]; then
  CI_PASS=false
  CI_NOTE="${FAILED_CHECKS} check(s) failed: ${FAILED_NAMES}"
else
  CI_PASS=true
  CI_NOTE="All ${TOTAL_CHECKS} check(s) passed"
fi

CI_JSON=$(jq -n \
  --argjson pass          "$CI_PASS" \
  --arg     note          "$CI_NOTE" \
  --argjson total_checks  "$TOTAL_CHECKS" \
  --argjson failed_checks "$FAILED_CHECKS" \
  '{pass: $pass, note: $note, total_checks: $total_checks, failed_checks: $failed_checks}')

# ── 5. Review churn ───────────────────────────────────────────────────────────
# Count force-pushed events that occur *after* the first non-pending review was
# submitted.  More than 2 such force-pushes suggests significant post-review
# rework and constitutes a hard failure.

FIRST_REVIEW_AT=$(echo "$REVIEWS_JSON" | jq -r \
  '[.[] | select(.state != "PENDING")] | sort_by(.submitted_at) | .[0].submitted_at // empty')

if [[ -z "$FIRST_REVIEW_AT" ]]; then
  FORCE_PUSH_COUNT=0
  CHURN_PASS=true
  CHURN_NOTE="No non-pending reviews; churn cannot be measured"
else
  FORCE_PUSH_COUNT=$(echo "$TIMELINE_JSON" | jq \
    --arg after "$FIRST_REVIEW_AT" \
    '[.[] | select(.event == "force_pushed" and .created_at > $after)] | length')

  if [[ "$FORCE_PUSH_COUNT" -gt 2 ]]; then
    CHURN_PASS=false
    CHURN_NOTE="${FORCE_PUSH_COUNT} force-push(es) after first review (threshold: ≤ 2)"
  else
    CHURN_PASS=true
    CHURN_NOTE="${FORCE_PUSH_COUNT} force-push(es) after first review (within threshold)"
  fi
fi

CHURN_JSON=$(jq -n \
  --argjson pass             "$CHURN_PASS" \
  --arg     note             "$CHURN_NOTE" \
  --argjson force_push_count "$FORCE_PUSH_COUNT" \
  --arg     first_review_at  "${FIRST_REVIEW_AT:-}" \
  '{pass: $pass, note: $note, force_push_count: $force_push_count,
    first_review_at: (if $first_review_at == "" then null else $first_review_at end)}')

# ── Aggregate ─────────────────────────────────────────────────────────────────

ALL_PASS=$(jq -n \
  --argjson scope    "$SCOPE_PASS" \
  --argjson atomic   "$ATOMIC_PASS" \
  --argjson coverage "$COVERAGE_PASS" \
  --argjson ci       "$CI_PASS" \
  --argjson churn    "$CHURN_PASS" \
  '$scope and $atomic and $coverage and $ci and $churn')

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

RESULT=$(jq -n \
  --argjson pr_number         "$PR_NUMBER" \
  --arg     repo              "$REPO" \
  --arg     pr_title          "$PR_TITLE" \
  --arg     pr_state          "$PR_STATE" \
  --argjson pr_merged         "$PR_MERGED" \
  --arg     evaluated_at      "$TIMESTAMP" \
  --argjson all_pass          "$ALL_PASS" \
  --argjson scope_adherence   "$SCOPE_JSON" \
  --argjson atomic_commits    "$ATOMIC_JSON" \
  --argjson test_coverage     "$COVERAGE_JSON" \
  --argjson ci_status         "$CI_JSON" \
  --argjson review_churn      "$CHURN_JSON" \
  '{pr_number: $pr_number, repo: $repo, pr_title: $pr_title,
    pr_state: $pr_state, pr_merged: $pr_merged,
    evaluated_at: $evaluated_at, all_pass: $all_pass,
    rubric: {
      scope_adherence: $scope_adherence,
      atomic_commits:  $atomic_commits,
      test_coverage:   $test_coverage,
      ci_status:       $ci_status,
      review_churn:    $review_churn
    }}')

echo "$RESULT" | tee "$OUTPUT_FILE"
echo "" >&2
echo "Score written to ${OUTPUT_FILE}" >&2

# Exit non-zero when any dimension fails its hard threshold
if [[ "$ALL_PASS" == "false" ]]; then
  exit 1
fi
