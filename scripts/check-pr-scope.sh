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
# Label-driven exemptions (deliberate intent, used sparingly):
#   bulk-content            — skips Rule 2 (scope-explosion). Valid for atomic content
#                             backfills (post backfill, byline migration, category rename)
#                             where splitting would create a worse intermediate main state.
#   governance-update       — skips Rule 3 (governance-surface). Deliberate updates to
#                             .github/skills/ or .github/instructions/ governance files.
#   protected-file-update   — relaxes Rule 1 *per-file* for AGENTS.md and ARCHITECTURE.md
#                             only. Other protected files (_config.yml, Gemfile,
#                             Gemfile.lock, .github/CODEOWNERS, .github/copilot-instructions.md)
#                             remain unbypassable even with this label.
#   PASS: PR with bulk-content label and 30 changed files — Rule 2 skipped
#   PASS: PR with protected-file-update label modifying AGENTS.md — Rule 1 bypassed for AGENTS.md
#   FAIL: PR with protected-file-update label modifying Gemfile — Gemfile still trips Rule 1
#   FAIL: PR with bulk-content label and unrelated changes (anti-pattern, but the
#         script can't detect this — see CLAUDE.md for human review guidance)
#
# Author-driven exemption (not a label — reads PR_AUTHOR env):
#   dependabot[bot]         — bypasses Rule 1 for Gemfile and Gemfile.lock ONLY,
#                             and only when the diff touches nothing else. Those
#                             two files are protected precisely so an *agent*
#                             never edits them as a side-effect; Dependabot is
#                             the mechanism by which they are supposed to change,
#                             so without this every bundler bump needed --admin.
#   PASS: dependabot[bot] changing Gemfile.lock alone
#   PASS: dependabot[bot] changing Gemfile + Gemfile.lock
#   FAIL: dependabot[bot] changing Gemfile.lock + _config.yml — the whole diff
#         must stay inside the owned set, so both files are reported
#   FAIL: any other author changing Gemfile.lock, including 'not-dependabot[bot]-x'
#   See is_dependabot_bump() for the security constraint on PR_AUTHOR.
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

# Subset of PROTECTED_FILES that an issue-driven PR may modify by carrying the
# protected-file-update label. Kept separate from PROTECTED_FILES so infra
# files (_config.yml, Gemfile*, .github/CODEOWNERS, .github/copilot-instructions.md)
# always trip Rule 1 — even with the label.
PROTECTED_FILE_UPDATE_BYPASS=(
  "AGENTS.md"
  "ARCHITECTURE.md"
)

# Protected files Dependabot legitimately owns. Kept separate from
# PROTECTED_FILE_UPDATE_BYPASS because the two exemptions are gated on
# different things — that one on a human-applied label, this one on the PR
# author plus the shape of the diff. See is_dependabot_bump() below.
DEPENDABOT_ALLOWED_FILES=(
  "Gemfile"
  "Gemfile.lock"
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
# has_label <label-name> — exact-match check against the comma-joined
# PR_LABELS (the format github.event.pull_request.labels.*.name | join(',')
# produces in CI). Single source of truth for all label-driven bypasses so
# a future label can't accidentally reintroduce an unanchored grep.
# ---------------------------------------------------------------------------
has_label() {
  [ -z "${1:-}" ] && return 1
  printf '%s\n' "${PR_LABELS:-}" | tr ',' '\n' | grep -Fxq "$1"
}

# ---------------------------------------------------------------------------
# is_dependabot_bump — true only when BOTH gates hold:
#
#   1. PR_AUTHOR is exactly 'dependabot[bot]', and
#   2. the diff touches nothing outside DEPENDABOT_ALLOWED_FILES.
#
# Gate 2 is what makes this safe. Gate 1 alone would give a mis-scoped or
# compromised bot PR a free pass on Gemfile and Gemfile.lock; requiring the
# whole diff to stay inside the owned set means a bot PR that also reaches for
# _config.yml or .github/CODEOWNERS still trips Rule 1 — on every protected
# file in it, including the Gemfile.lock.
#
# The comparison is an exact `=`, never a pattern match: '[' and ']' are glob
# metacharacters, and an unanchored match would let 'not-dependabot[bot]-x'
# qualify. Cases L–P in tests/scope-guard.sh pin both gates.
#
# SECURITY CONSTRAINT — read before changing test-build.yml's triggers.
# Trusting PR_AUTHOR is only sound because the guard runs under `pull_request`,
# where github.event.pull_request.user.login comes from the GitHub-generated
# event payload rather than from anything inside the PR's own branch. Under
# `pull_request_target` this exemption MUST be re-reviewed. See #1253.
#
# PR_AUTHOR unset (local runs, push events) means no exemption — fails closed,
# which is the pre-#1253 behaviour.
# ---------------------------------------------------------------------------
is_dependabot_bump() {
  [ "${PR_AUTHOR:-}" = "dependabot[bot]" ] || return 1

  local changed
  while IFS= read -r changed; do
    [ -z "$changed" ] && continue
    printf '%s\n' "${DEPENDABOT_ALLOWED_FILES[@]}" | grep -qx "$changed" || return 1
  done <<EOF
$CHANGED_FILES
EOF
  return 0
}

# Evaluated once rather than per protected file — the answer is a property of
# the PR, not of the file being checked.
if is_dependabot_bump; then
  DEPENDABOT_BUMP=1
else
  DEPENDABOT_BUMP=0
fi

# ---------------------------------------------------------------------------
# Rule 1: Protected files
# ---------------------------------------------------------------------------
for protected in "${PROTECTED_FILES[@]}"; do
  if echo "$CHANGED_FILES" | grep -qx "$protected"; then
    if has_label 'protected-file-update' && \
       printf '%s\n' "${PROTECTED_FILE_UPDATE_BYPASS[@]}" | grep -qx "$protected"; then
      echo "check-pr-scope: protected-file-update label present — bypassing protection for '$protected'."
      continue
    fi
    if [ "$DEPENDABOT_BUMP" = "1" ] && \
       printf '%s\n' "${DEPENDABOT_ALLOWED_FILES[@]}" | grep -qx "$protected"; then
      echo "check-pr-scope: dependabot[bot] dependency bump — bypassing protection for '$protected'."
      continue
    fi
    echo "VIOLATION [protected-file]: '$protected' is in the protected list and must not be modified as a side-effect."
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
done

# ---------------------------------------------------------------------------
# Rule 2: >15 files changed (scope explosion)
# Skip if PR is a deliberate bulk-content change (label: bulk-content)
# ---------------------------------------------------------------------------
if has_label 'bulk-content'; then
  echo "check-pr-scope: bulk-content label present — skipping rule 2."
else
  FILE_COUNT=$(echo "$CHANGED_FILES" | wc -l | tr -d ' ')
  if [ "$FILE_COUNT" -gt 15 ]; then
    echo "VIOLATION [scope-explosion]: $FILE_COUNT files changed (limit is 15). Split this PR into smaller, focused changes."
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
fi

# ---------------------------------------------------------------------------
# Rule 3: .github/skills/ or .github/instructions/ governance surfaces
# Skip if PR is a deliberate governance update (label: governance-update)
# ---------------------------------------------------------------------------
if has_label 'governance-update'; then
  echo "check-pr-scope: governance-update label present — skipping rule 3."
else
  GOVERNANCE_CHANGES=$(echo "$CHANGED_FILES" | grep -E '^\.github/(skills|instructions)/' || true)
  if [ -n "$GOVERNANCE_CHANGES" ]; then
    echo "VIOLATION [governance-surface]: The following governance files were modified — these require a dedicated issue:"
    echo "$GOVERNANCE_CHANGES" | sed 's/^/  - /'
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
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

  # Exact-match via has_label() (same anchoring as Rules 1–3). Agent labels are
  # a fixed enum, but an unanchored grep would mis-route a confusable superset
  # label (e.g. 'agent:qa-gatekeeper-trainee') into a forbidden-zone ruleset.
  # Precedence (creative-director > qa-gatekeeper > editorial) is preserved.
  if has_label "agent:creative-director"; then
    AGENT_LABEL="agent:creative-director"
    FORBIDDEN_PATTERN="^\.github/workflows/|^tests/|^scripts/|^_posts/|^_config\.yml$"
  elif has_label "agent:qa-gatekeeper"; then
    AGENT_LABEL="agent:qa-gatekeeper"
    FORBIDDEN_PATTERN="^_sass/|^_layouts/|^_posts/|^_config\.yml$"
  elif has_label "agent:editorial-chief" || has_label "agent:editorial-manager"; then
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
