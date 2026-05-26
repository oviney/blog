#!/usr/bin/env bash
# scope-guard.sh — fixture tests for scripts/check-pr-scope.sh
#
# Each case builds a temporary git repo with a bare-repo origin, modifies
# one file, copies the production check-pr-scope.sh in, runs it with the
# given PR_LABELS, then asserts exit code + a stdout grep.
#
# Cases (per SPEC for #985 and #987):
#   A. AGENTS.md modified, no PR_LABELS                       → fails (exit 1)
#   B. AGENTS.md modified, PR_LABELS=protected-file-update    → passes (exit 0)
#   C. Gemfile modified, PR_LABELS=protected-file-update      → fails  (exit 1, per-file allow-list)
#   D. AGENTS.md modified, PR_LABELS=not-protected-file-update-foo (substring superset) → fails (exit 1)
#   E. 21 files modified, PR_LABELS=not-bulk-content-foo      → fails (Rule 2 trips; pins #987 anchor)
#   F. .github/skills/... modified, PR_LABELS=governance-update-experimental → fails (Rule 3 trips; pins #987 anchor)
#   G. 21 files modified, PR_LABELS=bulk-content              → passes (canonical bypass preserved)
#   H. .github/skills/... modified, PR_LABELS=governance-update → passes (canonical bypass preserved)
#   I. Static-config invariant: PROTECTED_FILE_UPDATE_BYPASS ⊆ PROTECTED_FILES
#
# Dependencies: bash, git. Same constraint as the script under test.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PROD_SCRIPT="$REPO_ROOT/scripts/check-pr-scope.sh"

PASS=0
FAIL=0
TEMP_DIRS=()

cleanup() {
  # `${TEMP_DIRS[@]:-}` survives set -u when the array is still empty
  # (e.g., trap fires before the first run_case appends).
  for d in "${TEMP_DIRS[@]:-}"; do
    [ -n "$d" ] && [ -d "$d" ] && rm -rf "$d"
  done
}
trap cleanup EXIT

# run_case <name> <pr_labels> <files_to_modify> <expected_exit> <expected_grep>
#
# files_to_modify is a newline-separated list of paths. Each path is touched
# (created if not in the baseline) on the test branch so it shows up in the
# diff vs origin/main. A single path is a valid 1-element list — Cases A–D
# continue to work unchanged under this contract.
run_case() {
  local name="$1"
  local labels="$2"
  local files_to_modify="$3"
  local expected_exit="$4"
  local expected_grep="$5"

  local file_count
  file_count=$(printf '%s\n' "$files_to_modify" | wc -l | tr -d ' ')

  echo ""
  echo "Case: $name"
  if [ "$file_count" = "1" ]; then
    echo "  file:    $files_to_modify"
  else
    echo "  files:   $file_count paths"
  fi
  echo "  labels:  '${labels:-<unset>}'"
  echo "  expect:  exit=$expected_exit, grep='$expected_grep'"

  local tmp
  tmp=$(mktemp -d)
  TEMP_DIRS+=("$tmp")

  local origin="$tmp/origin.git"
  local work="$tmp/work"
  git init --bare -q "$origin"
  git init -q "$work"

  (
    cd "$work"
    git config user.email "scope-guard-test@example.com"
    git config user.name "scope-guard-test"
    git config commit.gpgsign false

    # Baseline files so any "modify $file" target already exists.
    printf '# AGENTS\n' > AGENTS.md
    printf '# ARCHITECTURE\n' > ARCHITECTURE.md
    printf '# Gemfile\n' > Gemfile
    printf '# regular\n' > regular.md
    git add .
    git commit -q -m "baseline"

    git remote add origin "$origin"
    git push -q origin HEAD:main

    git switch -c test-branch -q
    # Touch each path; create parent dirs for nested paths
    # (e.g. .github/skills/foo/SKILL.md).
    while IFS= read -r path; do
      [ -z "$path" ] && continue
      mkdir -p "$(dirname "$path")"
      printf 'modified\n' >> "$path"
    done <<EOF
$files_to_modify
EOF
    git add .
    git commit -q -m "modify $file_count file(s)"

    mkdir -p scripts
    cp "$PROD_SCRIPT" scripts/check-pr-scope.sh
  )

  local output
  local exit_code
  set +e
  output=$(cd "$work" && PR_LABELS="$labels" bash scripts/check-pr-scope.sh 2>&1)
  exit_code=$?
  set -e

  local case_ok=1
  if [ "$exit_code" != "$expected_exit" ]; then
    echo "  FAIL: expected exit $expected_exit, got $exit_code"
    case_ok=0
  fi
  if ! printf '%s\n' "$output" | grep -qF "$expected_grep"; then
    echo "  FAIL: expected substring '$expected_grep' not found in output"
    case_ok=0
  fi

  if [ "$case_ok" = "1" ]; then
    echo "  PASS"
    PASS=$((PASS + 1))
  else
    echo "  --- script output ---"
    printf '%s\n' "$output" | sed 's/^/    /'
    echo "  ---------------------"
    FAIL=$((FAIL + 1))
  fi
}

echo "scope-guard fixture tests"
echo "  production script: $PROD_SCRIPT"

run_case "A: AGENTS.md modified, no label → guard fails" \
  "" \
  "AGENTS.md" \
  "1" \
  "VIOLATION [protected-file]: 'AGENTS.md'"

run_case "B: AGENTS.md modified, protected-file-update label → guard passes" \
  "protected-file-update" \
  "AGENTS.md" \
  "0" \
  "bypassing protection for 'AGENTS.md'"

run_case "C: Gemfile modified, protected-file-update label → guard still fails" \
  "protected-file-update" \
  "Gemfile" \
  "1" \
  "VIOLATION [protected-file]: 'Gemfile'"

# Pin the anchored-grep semantics so a future refactor can't silently
# re-introduce a substring match on the label name.
run_case "D: AGENTS.md modified, confusable label (substring superset) → guard fails" \
  "not-protected-file-update-foo" \
  "AGENTS.md" \
  "1" \
  "VIOLATION [protected-file]: 'AGENTS.md'"

# Pin the anchored-grep semantics for the bulk-content label (Rule 2).
# The label is set to a confusable substring superset that the current
# unanchored `grep -q 'bulk-content'` mistakenly matches — wrongly
# bypassing Rule 2 against a >15-file diff. Will be GREEN once
# Rule 2's check is migrated to has_label().
FILES_E=$(seq -f 'tests-e-%g.txt' 1 21)
run_case "E: 21 files modified, confusable bulk-content substring label → guard fails on scope-explosion" \
  "not-bulk-content-foo" \
  "$FILES_E" \
  "1" \
  "VIOLATION [scope-explosion]"

# Pin the anchored-grep semantics for the governance-update label (Rule 3).
# Same antipattern as Case E but on Rule 3: a confusable superset label
# wrongly bypasses the .github/skills/ check today. Will be GREEN once
# Rule 3's check is migrated to has_label().
run_case "F: .github/skills/ modified, confusable governance-update substring label → guard fails on governance-surface" \
  "governance-update-experimental" \
  ".github/skills/scope-guard-test/SKILL.md" \
  "1" \
  "VIOLATION [governance-surface]"

# Pin canonical-bypass behaviour as automated coverage (was manual-probe-only
# per SPEC AC-10). A future refactor of has_label() can't silently break the
# exact-match canonical bypass without one of these turning red.
run_case "G: 21 files modified, canonical bulk-content label → Rule 2 bypassed, guard passes" \
  "bulk-content" \
  "$FILES_E" \
  "0" \
  "bulk-content label present — skipping rule 2"

run_case "H: .github/skills/ modified, canonical governance-update label → Rule 3 bypassed, guard passes" \
  "governance-update" \
  ".github/skills/scope-guard-test/SKILL.md" \
  "0" \
  "governance-update label present — skipping rule 3"

# Static-config invariant: every entry in PROTECTED_FILE_UPDATE_BYPASS must
# also appear in PROTECTED_FILES. The two arrays live adjacent in the script
# and the bypass is meaningless for any entry not in the protected list (the
# Rule 1 loop only enters the per-file bypass check after the file matched
# the protected list). A future PR that adds an entry to the bypass without
# adding it to the protected list would silently no-op.
echo ""
echo "Case: I: PROTECTED_FILE_UPDATE_BYPASS ⊆ PROTECTED_FILES (static-config invariant)"
PROD_PROTECTED=$(awk '/^PROTECTED_FILES=\(/{f=1; next} f && /^\)$/{f=0} f' "$PROD_SCRIPT" | grep -oE '"[^"]+"' | tr -d '"')
PROD_BYPASS=$(awk '/^PROTECTED_FILE_UPDATE_BYPASS=\(/{f=1; next} f && /^\)$/{f=0} f' "$PROD_SCRIPT" | grep -oE '"[^"]+"' | tr -d '"')

case_ok=1
while IFS= read -r entry; do
  [ -z "$entry" ] && continue
  if ! printf '%s\n' "$PROD_PROTECTED" | grep -qx "$entry"; then
    echo "  FAIL: bypass entry '$entry' is not in PROTECTED_FILES"
    case_ok=0
  fi
done <<EOF
$PROD_BYPASS
EOF

if [ "$case_ok" = "1" ]; then
  echo "  PASS — all bypass entries are in the protected list ($(printf '%s\n' "$PROD_BYPASS" | grep -c .) / $(printf '%s\n' "$PROD_BYPASS" | grep -c .))"
  PASS=$((PASS + 1))
else
  FAIL=$((FAIL + 1))
fi

echo ""
echo "Summary: $PASS passed, $FAIL failed"
if [ "$FAIL" -ne 0 ]; then
  exit 1
fi
exit 0
