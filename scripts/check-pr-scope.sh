#!/usr/bin/env bash
# check-pr-scope.sh — pre-push scope self-check for agent PRs
#
# Usage: bash scripts/check-pr-scope.sh
#
# Diffs the current branch against origin/main and flags:
#   1. Changes to any protected file
#   2. More than 15 files changed (scope explosion heuristic)
#   3. Changes to .github/skills/ or .github/instructions/ governance surfaces
#
# Dependencies: git and bash only. No other tools required.
# Exit codes: 0 = clean, 1 = one or more violations found.

set -euo pipefail

VIOLATIONS=0
BASE="origin/main"

# ---------------------------------------------------------------------------
# Protected files — changes to these always require a dedicated human-approved
# issue; an agent should never touch them as a side-effect.
# ---------------------------------------------------------------------------
PROTECTED_FILES=(
  "_config.yml"
  "Gemfile"
  "Gemfile.lock"
  ".github/CODEOWNERS"
  ".github/copilot-instructions.md"
  "AGENTS.md"
  "ARCHITECTURE.md"
)

# ---------------------------------------------------------------------------
# Fetch origin/main so the diff baseline is available even in shallow clones.
# ---------------------------------------------------------------------------
if ! git fetch origin main --quiet 2>/dev/null; then
  echo "WARN: Could not fetch origin/main; diff may be incomplete." >&2
  echo "      Ensure you have network connectivity and push access to the remote." >&2
fi

# Build the list of files changed on this branch vs origin/main.
CHANGED_FILES=$(git diff --name-only "$BASE"...HEAD 2>/dev/null || git diff --name-only HEAD)

if [ -z "$CHANGED_FILES" ]; then
  echo "check-pr-scope: no files changed relative to $BASE — nothing to check."
  exit 0
fi

echo "check-pr-scope: checking $(echo "$CHANGED_FILES" | wc -l | tr -d ' ') changed file(s) against scope rules..."
echo ""

# ---------------------------------------------------------------------------
# Rule 1: Protected files
# ---------------------------------------------------------------------------
for protected in "${PROTECTED_FILES[@]}"; do
  if echo "$CHANGED_FILES" | grep -qx "$protected"; then
    echo "VIOLATION [protected-file]: '$protected' is in the protected list and must not be modified as a side-effect."
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
done

# ---------------------------------------------------------------------------
# Rule 2: >15 files changed (scope explosion)
# ---------------------------------------------------------------------------
FILE_COUNT=$(echo "$CHANGED_FILES" | wc -l | tr -d ' ')
if [ "$FILE_COUNT" -gt 15 ]; then
  echo "VIOLATION [scope-explosion]: $FILE_COUNT files changed (limit is 15). Split this PR into smaller, focused changes."
  VIOLATIONS=$((VIOLATIONS + 1))
fi

# ---------------------------------------------------------------------------
# Rule 3: .github/skills/ or .github/instructions/ governance surfaces
# ---------------------------------------------------------------------------
GOVERNANCE_CHANGES=$(echo "$CHANGED_FILES" | grep -E '^\.github/(skills|instructions)/' || true)
if [ -n "$GOVERNANCE_CHANGES" ]; then
  echo "VIOLATION [governance-surface]: The following governance files were modified — these require a dedicated issue:"
  echo "$GOVERNANCE_CHANGES" | sed 's/^/  - /'
  VIOLATIONS=$((VIOLATIONS + 1))
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
if [ "$VIOLATIONS" -eq 0 ]; then
  echo "check-pr-scope: PASSED — no scope violations found."
  exit 0
else
  echo "check-pr-scope: FAILED — $VIOLATIONS violation(s) found. Fix them before pushing."
  exit 1
fi
