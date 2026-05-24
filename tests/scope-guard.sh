#!/usr/bin/env bash
# scope-guard.sh — fixture tests for scripts/check-pr-scope.sh
#
# Each case builds a temporary git repo with a bare-repo origin, modifies
# one file, copies the production check-pr-scope.sh in, runs it with the
# given PR_LABELS, then asserts exit code + a stdout grep.
#
# Cases (matches SPEC §3 AC-4 for #985):
#   A. AGENTS.md modified, no PR_LABELS                → guard fails (exit 1)
#   B. AGENTS.md modified, PR_LABELS=protected-file-update → guard passes (exit 0)
#   C. Gemfile modified,  PR_LABELS=protected-file-update → guard still fails (exit 1)
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
  for d in "${TEMP_DIRS[@]}"; do
    [ -n "$d" ] && [ -d "$d" ] && rm -rf "$d"
  done
}
trap cleanup EXIT

# run_case <name> <pr_labels> <file_to_modify> <expected_exit> <expected_grep>
run_case() {
  local name="$1"
  local labels="$2"
  local file_to_modify="$3"
  local expected_exit="$4"
  local expected_grep="$5"

  echo ""
  echo "Case: $name"
  echo "  file:    $file_to_modify"
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
    printf 'modified\n' >> "$file_to_modify"
    git add .
    git commit -q -m "modify $file_to_modify"

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

echo ""
echo "Summary: $PASS passed, $FAIL failed"
if [ "$FAIL" -ne 0 ]; then
  exit 1
fi
exit 0
