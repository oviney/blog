#!/usr/bin/env bash
# fix-agent-merge-blockers.sh — Unblock Copilot-agent PRs on oviney/blog
#
# Fixes one misconfiguration and prints a manual runbook for a second:
#
#   FIX 1 — dismiss_stale_reviews (branch protection on main)
#     Reads the current branch-protection payload, patches
#     required_pull_request_reviews.dismiss_stale_reviews → false,
#     then writes it back. Every other existing setting is preserved
#     (read → modify → write; no hardcoded payload).
#
#   INFO — Actions workflow permissions (read-only)
#     Reports default_workflow_permissions and can_approve_pull_request_reviews
#     for operator awareness.  No changes are made: can_approve_pull_request_reviews
#     MUST stay false (security risk if set to true) and default_workflow_permissions
#     is unrelated to the gate blocker.
#
#   RUNBOOK — Actions fork-PR approval policy (no REST API)
#     GitHub does not expose the "Require approval for outside
#     collaborators / first-time contributors" toggle via REST API for
#     individual repositories.  The script prints the exact web-UI
#     steps an operator must follow to flip that setting.
#
# Usage:
#   bash scripts/fix-agent-merge-blockers.sh [owner/repo]
#
# Defaults:
#   repo = oviney/blog    branch = main
#
# Requirements:
#   - gh CLI v2.0+, authenticated as a repository admin
#   - jq
#
# Idempotency:
#   The script reads current state before every write.  If a setting is
#   already correct it prints a ✓ and moves on.  Safe to re-run at any
#   time; exits 0 whenever all API-configurable settings are correct.
#
# Related: https://github.com/oviney/blog/issues/586

set -euo pipefail

REPO="${1:-oviney/blog}"
BRANCH="main"
CHANGED=0

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
echo "  Agent Merge Unblocker  —  $(date '+%Y-%m-%d %H:%M %Z')"
echo "  Repo  : $REPO"
echo "  Branch: $BRANCH"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# ── FIX 1: dismiss_stale_reviews ─────────────────────────────────────────────

echo "── Fix 1: dismiss_stale_reviews (branch protection) ────────────────────"
echo ""

PROTECTION=$(gh api "/repos/${REPO}/branches/${BRANCH}/protection" 2>/dev/null) || {
  echo "  ERROR: Could not read branch protection for '${REPO}:${BRANCH}'." >&2
  echo "         Ensure you are authenticated as a repository admin." >&2
  exit 1
}

CURRENT_DISMISS=$(echo "$PROTECTION" \
  | jq -r '.required_pull_request_reviews.dismiss_stale_reviews // "null"')

if [[ "$CURRENT_DISMISS" == "false" ]]; then
  echo "  ✓ dismiss_stale_reviews is already false — no change needed."
else
  echo "  Current value : $CURRENT_DISMISS"
  echo "  Target value  : false"
  echo "  Applying patch…"

  # Build the PUT payload by transforming the GET response.
  # Only dismiss_stale_reviews is changed; everything else is preserved.
  PAYLOAD=$(echo "$PROTECTION" | jq '
    {
      required_status_checks: (
        if .required_status_checks == null then null
        else {
          strict:   (.required_status_checks.strict   // false),
          contexts: (.required_status_checks.contexts // [])
        }
        end
      ),
      enforce_admins: (.enforce_admins.enabled // false),
      required_pull_request_reviews: (
        if .required_pull_request_reviews == null then null
        else {
          dismiss_stale_reviews:          false,
          require_code_owner_reviews:     (.required_pull_request_reviews.require_code_owner_reviews     // false),
          required_approving_review_count: (.required_pull_request_reviews.required_approving_review_count // 1),
          require_last_push_approval:     (.required_pull_request_reviews.require_last_push_approval     // false)
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

  gh api --method PUT "/repos/${REPO}/branches/${BRANCH}/protection" \
    --input - <<< "$PAYLOAD" > /dev/null

  # Confirm the change took effect
  VERIFY=$(gh api "/repos/${REPO}/branches/${BRANCH}/protection" \
    | jq -r '.required_pull_request_reviews.dismiss_stale_reviews')

  if [[ "$VERIFY" == "false" ]]; then
    echo "  ✓ dismiss_stale_reviews → false  (confirmed)"
    CHANGED=1
  else
    echo "  ✗ Update did not take effect (got: $VERIFY)" >&2
    exit 1
  fi
fi

echo ""

# ── INFO: Actions default workflow permissions (read-only) ───────────────────
#
# These values are reported for operator awareness only.  The script does NOT
# write to the workflow-permissions endpoint because:
#
#   default_workflow_permissions     — unrelated to the workflow-gate blocker.
#   can_approve_pull_request_reviews — MUST remain false (the default).  Setting
#     it to true would allow the GITHUB_TOKEN inside any Actions workflow to
#     approve pull requests, enabling a workflow to self-approve and satisfy
#     branch protection with no human in the loop.  That is a security risk
#     unrelated to fixing #586.
#
# The actual fix for the gate blocker is the web-UI runbook printed below.

echo "── Info: Actions workflow permissions (read-only, no changes made) ─────"
echo ""

WORKFLOW_PERMS=$(gh api "/repos/${REPO}/actions/permissions/workflow" 2>/dev/null) || {
  echo "  ⚠  Could not read workflow permissions (may require admin scope)."
  WORKFLOW_PERMS="{}"
}

CURRENT_DEFAULT=$(echo "$WORKFLOW_PERMS" \
  | jq -r '.default_workflow_permissions // "unavailable"')
CURRENT_CAN_APPROVE=$(echo "$WORKFLOW_PERMS" \
  | jq -r '.can_approve_pull_request_reviews // "unavailable"')

echo "  default_workflow_permissions     : $CURRENT_DEFAULT  (informational)"
echo "  can_approve_pull_request_reviews : $CURRENT_CAN_APPROVE  (informational)"
echo ""
echo "  No changes made — see comments in the script for rationale."
echo ""

# ── RUNBOOK: Actions fork-PR approval policy ─────────────────────────────────
#
# GitHub does NOT expose the "Require approval for outside collaborators /
# first-time contributors" policy via REST API for individual repositories.
# The corresponding org-level endpoint (PUT /orgs/{org}/actions/permissions)
# is scoped to organisations and requires admin:org; it is not available on a
# user-owned repo.  This setting MUST be changed manually in the web UI.

echo "── Runbook: Actions fork-PR approval policy (web UI required) ──────────"
echo ""
echo "  GitHub's REST API does NOT expose the workflow-run approval gate for"
echo "  individual (user-owned) repositories.  You must flip this toggle by"
echo "  hand:"
echo ""
echo "  Step 1. Open:  https://github.com/${REPO}/settings/actions"
echo ""
echo "  Step 2. Locate section:"
echo "            \"Fork pull request workflows from outside collaborators\""
echo ""
echo "  Step 3. Change the selection to:"
echo "            ○ Require approval for all outside collaborators (current)"
echo "            ● Require approval for first-time contributors who are new to GitHub"
echo "          — OR, if you are comfortable with the risk —"
echo "            ● Not required"
echo ""
echo "          Choosing \"first-time contributors who are new to GitHub\" is the"
echo "          recommended minimum; it stops blocking the GitHub Copilot bot"
echo "          actor (a GitHub-owned actor, not an outside collaborator) while"
echo "          still protecting against unknown first-time external contributors."
echo ""
echo "  Step 4. Click [Save] at the bottom of the Actions settings page."
echo ""
echo "  Why: The current \"all outside collaborators\" policy treats the GitHub"
echo "       Copilot bot as a first-time contributor, causing every workflow"
echo "       run on a copilot/* branch to end in 'action_required' (0 s"
echo "       duration) before any test can execute.  The branch protection"
echo "       'build' context therefore never receives a passing result, leaving"
echo "       every agent PR BLOCKED permanently.  See: oviney/blog#586"
echo ""

# ── Summary ───────────────────────────────────────────────────────────────────

echo "═══════════════════════════════════════════════════════════════════"
if [[ "$CHANGED" -eq 1 ]]; then
  echo "  Done — one or more settings were updated. See ✓ lines above."
else
  echo "  Done — all API-configurable settings were already correct."
fi
echo "  ⚠  Complete the web-UI step above to fix the workflow-gate blocker."
echo "═══════════════════════════════════════════════════════════════════"
echo ""
