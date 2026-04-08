#!/usr/bin/env bash
# check-pr-scope.sh — pre-push scope self-check for agent PRs
#
# Usage: bash scripts/check-pr-scope.sh
#
# Diffs the current branch against origin/main and flags:
#   1. Changes to any protected file
#   2. More than 15 files changed (scope explosion heuristic)
#   3. Changes to .github/skills/ or .github/instructions/ governance surfaces
#   4. Changes to files forbidden for the active agent label (reads PR_LABELS env)
#
# Agent-scope pass/fail examples:
#   PASS: agent:creative-director PR changes only _sass/ and _layouts/
#   FAIL: agent:creative-director PR changes .github/workflows/test-build.yml
#   PASS: agent:qa-gatekeeper PR changes tests/ and scripts/
#   FAIL: agent:qa-gatekeeper PR changes _posts/ or _sass/
#   PASS: agent:editorial-chief PR changes _posts/ and docs/
#   FAIL: agent:editorial-chief PR changes _sass/ or .github/workflows/
#   PASS: PR with no agent label (human PR) — agent-scope check is always skipped
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
# Rule 4: Agent-specific scope rules (only when PR_LABELS env var is set)
#
# When running in CI the caller sets:
#   PR_LABELS=${{ join(github.event.pull_request.labels.*.name, ',') }}
# When running as a pre-push hook PR_LABELS is unset; this rule is skipped.
# ---------------------------------------------------------------------------
if [ -z "${PR_LABELS:-}" ]; then
  echo "check-pr-scope: PR_LABELS not set — skipping agent-scope check."
else
  AGENT_LABEL=""
  FORBIDDEN_PATTERN=""

  if echo "$PR_LABELS" | grep -q "agent:creative-director"; then
    AGENT_LABEL="agent:creative-director"
    FORBIDDEN_PATTERN="^\.github/workflows/|^tests/|^scripts/|^_posts/|^_config\.yml$"
  elif echo "$PR_LABELS" | grep -q "agent:qa-gatekeeper"; then
    AGENT_LABEL="agent:qa-gatekeeper"
    FORBIDDEN_PATTERN="^_sass/|^_layouts/|^_posts/|^_config\.yml$"
  elif echo "$PR_LABELS" | grep -qE "agent:editorial-chief|agent:editorial-manager"; then
    AGENT_LABEL="agent:editorial-chief"
    FORBIDDEN_PATTERN="^_sass/|^_layouts/|^\.github/workflows/|^tests/|^scripts/|^_config\.yml$"
  fi

  if [ -z "$AGENT_LABEL" ]; then
    echo "check-pr-scope: no agent label found in PR_LABELS — skipping agent-scope check (human PR)."
  else
    echo "check-pr-scope: applying MUST-NOT-TOUCH rules for '$AGENT_LABEL'..."
    SCOPE_VIOLATIONS=$(echo "$CHANGED_FILES" | grep -E "$FORBIDDEN_PATTERN" || true)
    if [ -n "$SCOPE_VIOLATIONS" ]; then
      echo "VIOLATION [agent-scope/$AGENT_LABEL]: The following files are in a forbidden zone for this label:"
      echo "$SCOPE_VIOLATIONS" | sed 's/^/  - /'
      VIOLATIONS=$((VIOLATIONS + 1))
    else
      echo "  ✓ No agent-scope violations for '$AGENT_LABEL'."
    fi
  fi
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
