#!/usr/bin/env bash
# require-up-to-date-branches.sh — Enable required_status_checks.strict on main
#
# Patches only one field in main's branch protection:
#
#   required_status_checks.strict → true
#
# This forces every PR to have a base commit equal to the current tip of main
# before it can merge, closing the phantom cherry-pick failure mode documented
# in the RCA at https://github.com/oviney/blog/issues/590.
#
# Pattern: read → modify → write → verify (read-modify-write)
#   1. Reads the current /repos/{owner}/{repo}/branches/main/protection payload.
#   2. If required_status_checks.strict is already true, prints ✓ and exits 0.
#   3. Otherwise, builds a PUT payload preserving every other existing setting
#      and patches required_status_checks.strict → true.
#   4. Verifies the write took effect by re-reading and comparing.
#
# Usage:
#   bash scripts/require-up-to-date-branches.sh [owner/repo]
#
# Defaults:
#   repo = oviney/blog    branch = main
#
# Requirements:
#   - gh CLI v2.0+, authenticated as a repository admin
#   - jq
#
# Idempotency:
#   The script reads current state before every write.  If the setting is
#   already correct it prints a ✓ and exits 0 without making any API call.
#   Safe to re-run at any time.
#
# Related: https://github.com/oviney/blog/issues/592
#          https://github.com/oviney/blog/issues/590 (RCA)

set -euo pipefail

REPO="${1:-oviney/blog}"
BRANCH="main"

# ── helpers ──────────────────────────────────────────────────────────────────

require_cmd() {
  if ! command -v "$1" &>/dev/null; then
    echo "ERROR: '$1' is required but not found on PATH." >&2
    exit 1
  fi
}

require_cmd gh
require_cmd jq

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  Require Up-to-Date Branches  —  $(date '+%Y-%m-%d %H:%M %Z')"
echo "  Repo  : $REPO"
echo "  Branch: $BRANCH"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# ── Step 1: Read current branch protection ───────────────────────────────────

echo "── Step 1: Reading branch protection for '${REPO}:${BRANCH}' ──────────"
echo ""

PROTECTION=$(gh api "/repos/${REPO}/branches/${BRANCH}/protection" 2>/dev/null) || {
  echo "  ERROR: Could not read branch protection for '${REPO}:${BRANCH}'." >&2
  echo "         Ensure you are authenticated as a repository admin." >&2
  exit 1
}

CURRENT_STRICT=$(echo "$PROTECTION" \
  | jq -r '.required_status_checks.strict // "null"')

echo "  required_status_checks.strict (current): $CURRENT_STRICT"
echo ""

# ── Step 2: Check if already correct ─────────────────────────────────────────

if [[ "$CURRENT_STRICT" == "true" ]]; then
  echo "  ✓ required_status_checks.strict is already true — no change needed."
  echo ""
  echo "═══════════════════════════════════════════════════════════════════"
  echo "  Done — setting was already correct.  No API writes performed."
  echo "═══════════════════════════════════════════════════════════════════"
  echo ""
  exit 0
fi

# ── Step 3: Build patched PUT payload ────────────────────────────────────────

echo "── Step 3: Building PUT payload (preserving all other settings) ────────"
echo ""

PAYLOAD=$(echo "$PROTECTION" | jq '
  {
    required_status_checks: (
      if .required_status_checks == null then null
      else {
        strict:   true,
        contexts: (.required_status_checks.contexts // [])
      }
      end
    ),
    enforce_admins: (.enforce_admins.enabled // false),
    required_pull_request_reviews: (
      if .required_pull_request_reviews == null then null
      else {
        dismiss_stale_reviews:           (.required_pull_request_reviews.dismiss_stale_reviews           // false),
        require_code_owner_reviews:      (.required_pull_request_reviews.require_code_owner_reviews      // false),
        required_approving_review_count: (.required_pull_request_reviews.required_approving_review_count // 1),
        require_last_push_approval:      (.required_pull_request_reviews.require_last_push_approval      // false)
      }
      end
    ),
    restrictions: (
      if .restrictions == null then null
      else {
        users: ([.restrictions.users[]?.login] // []),
        teams: ([.restrictions.teams[]?.slug]  // []),
        apps:  ([.restrictions.apps[]?.slug]   // [])
      }
      end
    )
  }
')

echo "  Payload built.  Patched field:"
echo "    required_status_checks.strict: $CURRENT_STRICT → true"
echo ""

# ── Step 4: Write the patched payload ────────────────────────────────────────

echo "── Step 4: Writing branch protection via PUT ───────────────────────────"
echo ""

gh api --method PUT "/repos/${REPO}/branches/${BRANCH}/protection" \
  --input - <<< "$PAYLOAD" > /dev/null || {
  echo "  ERROR: PUT /repos/${REPO}/branches/${BRANCH}/protection failed." >&2
  exit 1
}

echo "  PUT accepted."
echo ""

# ── Step 5: Verify the write took effect ─────────────────────────────────────

echo "── Step 5: Verifying write ─────────────────────────────────────────────"
echo ""

VERIFY=$(gh api "/repos/${REPO}/branches/${BRANCH}/protection" 2>/dev/null) || {
  echo "  ERROR: Could not re-read branch protection after write." >&2
  exit 1
}

VERIFIED_STRICT=$(echo "$VERIFY" | jq -r '.required_status_checks.strict // "null"')

if [[ "$VERIFIED_STRICT" == "true" ]]; then
  echo "  ✓ required_status_checks.strict → true  (confirmed)"
else
  echo "  ✗ Verification failed: expected true, got '$VERIFIED_STRICT'" >&2
  exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  Done — required_status_checks.strict has been set to true."
echo "  PRs targeting main must now be up to date before merging."
echo "═══════════════════════════════════════════════════════════════════"
echo ""
