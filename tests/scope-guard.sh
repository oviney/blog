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
#   J. _sass/ modified, PR_LABELS=agent:qa-gatekeeper → fails (Rule 4 forbidden-zone; canonical agent label)
#   K. _sass/ modified, PR_LABELS=agent:qa-gatekeeper-trainee (substring superset) → passes (Rule 4 anchored; not an agent label)
#   L. Gemfile.lock, PR_AUTHOR=dependabot[bot]                → passes (Rule 1 Dependabot exemption, #1253)
#   M. Gemfile + Gemfile.lock, PR_AUTHOR=dependabot[bot]      → passes (both files bypassed)
#   N. Gemfile.lock + _config.yml, PR_AUTHOR=dependabot[bot]  → fails  (path gate: diff escapes the owned set)
#   O. Gemfile.lock, PR_AUTHOR unset                          → fails  (author gate; pre-#1253 behaviour)
#   P. Gemfile.lock, PR_AUTHOR=not-dependabot[bot]-x          → fails  (author anchored, cf. D/E/F/K)
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

# run_case <name> <pr_labels> <files_to_modify> <expected_exit> <expected_grep> [pr_author]
#
# files_to_modify is a newline-separated list of paths. Each path is touched
# (created if not in the baseline) on the test branch so it shows up in the
# diff vs origin/main. A single path is a valid 1-element list — Cases A–D
# continue to work unchanged under this contract.
#
# pr_author is optional and defaults to empty, so Cases A–K keep their original
# 5-argument calls. Empty means "no Dependabot exemption", which is exactly the
# behaviour that predates it — the guard fails closed when the author is unknown.
run_case() {
  local name="$1"
  local labels="$2"
  local files_to_modify="$3"
  local expected_exit="$4"
  local expected_grep="$5"
  local pr_author="${6:-}"

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
  echo "  author:  '${pr_author:-<unset>}'"
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
  output=$(cd "$work" && PR_LABELS="$labels" PR_AUTHOR="$pr_author" bash scripts/check-pr-scope.sh 2>&1)
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

# Pin the anchored has_label() semantics for the bulk-content label (Rule 2).
# A confusable substring superset ('not-bulk-content-foo') must NOT bypass
# Rule 2: an unanchored `grep -q 'bulk-content'` would wrongly match it and
# skip the >15-file check. Rule 2 was migrated to has_label() in #989; this
# case is a regression guard against reintroducing an unanchored match.
FILES_E=$(seq -f 'tests-e-%g.txt' 1 21)
run_case "E: 21 files modified, confusable bulk-content substring label → guard fails on scope-explosion" \
  "not-bulk-content-foo" \
  "$FILES_E" \
  "1" \
  "VIOLATION [scope-explosion]"

# Pin the anchored has_label() semantics for the governance-update label (Rule 3).
# Same antipattern as Case E but on Rule 3: a confusable superset label
# ('governance-update-experimental') must NOT bypass the .github/skills/ check.
# Rule 3 was migrated to has_label() in #989; this case is a regression guard.
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

# Rule 4 (agent-scope) anchoring. A _sass/ file is in the forbidden zone for
# agent:qa-gatekeeper but trips no other rule, so it cleanly isolates Rule 4.
# Case J pins the canonical exact label still routing into the forbidden-zone
# ruleset; Case K pins the anchor — a confusable superset ('…-trainee') must
# NOT be treated as the agent label (an unanchored `grep -q` would mis-route it
# and wrongly enforce the forbidden zone). Migrated to has_label() alongside
# Rules 1–3.
run_case "J: _sass/ modified, canonical agent:qa-gatekeeper label → guard fails on agent-scope" \
  "agent:qa-gatekeeper" \
  "_sass/scope-guard-test.scss" \
  "1" \
  "VIOLATION [agent-scope/agent:qa-gatekeeper]"

run_case "K: _sass/ modified, confusable agent:qa-gatekeeper-trainee substring label → not an agent label, guard passes" \
  "agent:qa-gatekeeper-trainee" \
  "_sass/scope-guard-test.scss" \
  "0" \
  "no agent label found in PR_LABELS"

# ---------------------------------------------------------------------------
# Rule 1 Dependabot exemption (#1253).
#
# Gemfile and Gemfile.lock are protected and deliberately excluded from the
# protected-file-update bypass, which made every bundler bump structurally
# unmergeable without --admin. The exemption requires BOTH an exact author
# match and no path escape, so these cases pin both gates independently:
# L/M are the allow side, N/O/P the deny side. Dropping either gate would
# still pass some of these — only the full set pins the conjunction.
# ---------------------------------------------------------------------------
run_case "L: Gemfile.lock modified by dependabot[bot] → Rule 1 bypassed, guard passes" \
  "" \
  "Gemfile.lock" \
  "0" \
  "dependabot[bot] dependency bump — bypassing protection for 'Gemfile.lock'" \
  "dependabot[bot]"

run_case "M: Gemfile + Gemfile.lock modified by dependabot[bot] → both bypassed, guard passes" \
  "" \
  "$(printf 'Gemfile\nGemfile.lock')" \
  "0" \
  "dependabot[bot] dependency bump — bypassing protection for 'Gemfile'" \
  "dependabot[bot]"

# Path gate. The bot's diff reaches outside the files it owns, so the exemption
# must not apply — to _config.yml OR to the Gemfile.lock riding alongside it.
run_case "N: Gemfile.lock + _config.yml modified by dependabot[bot] → path escape, guard fails" \
  "" \
  "$(printf 'Gemfile.lock\n_config.yml')" \
  "1" \
  "VIOLATION [protected-file]: '_config.yml'" \
  "dependabot[bot]"

# Author gate. Identical diff to Case L, but no author — must still fail.
run_case "O: Gemfile.lock modified, author unset → no exemption, guard fails" \
  "" \
  "Gemfile.lock" \
  "1" \
  "VIOLATION [protected-file]: 'Gemfile.lock'"

# Author anchoring, mirroring D/E/F/K. An unanchored match would let any author
# string *containing* the bot name qualify. Exact compare must reject this.
run_case "P: Gemfile.lock modified by confusable not-dependabot[bot]-x author → guard fails" \
  "" \
  "Gemfile.lock" \
  "1" \
  "VIOLATION [protected-file]: 'Gemfile.lock'" \
  "not-dependabot[bot]-x"

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
