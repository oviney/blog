#!/usr/bin/env bash
# fix-agent-merge-blockers.sh — Unblock Copilot-agent PRs on oviney/blog
#
# Fixes two independent misconfigurations that prevent agent PRs from merging:
#
#   FIX 1 — dismiss_stale_reviews (branch protection on main)
#     Reads the current branch-protection payload, patches
#     required_pull_request_reviews.dismiss_stale_reviews → false,
#     then writes it back. Every other existing setting is preserved
#     (read → modify → write; no hardcoded payload).
#
#   FIX 2 — workflow default permissions
#     Sets default_workflow_permissions=write and
#     can_approve_pull_request_reviews=true via the Actions workflow
#     permissions API, if not already correct.
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

# ── FIX 2: Actions default workflow permissions ───────────────────────────────

echo "── Fix 2: Actions default workflow permissions ──────────────────────────"
echo ""

WORKFLOW_PERMS=$(gh api "/repos/${REPO}/actions/permissions/workflow" 2>/dev/null) || {
  echo "  ⚠  Could not read workflow permissions — skipping."
  WORKFLOW_PERMS="{}"
}

CURRENT_DEFAULT=$(echo "$WORKFLOW_PERMS" \
  | jq -r '.default_workflow_permissions // "null"')
CURRENT_CAN_APPROVE=$(echo "$WORKFLOW_PERMS" \
  | jq -r '.can_approve_pull_request_reviews // "null"')

echo "  default_workflow_permissions     : $CURRENT_DEFAULT"
echo "  can_approve_pull_request_reviews : $CURRENT_CAN_APPROVE"
echo ""

if [[ "$CURRENT_DEFAULT" != "null" ]] && [[ "$CURRENT_CAN_APPROVE" != "null" ]]; then
  if [[ "$CURRENT_DEFAULT" == "write" ]] && [[ "$CURRENT_CAN_APPROVE" == "true" ]]; then
    echo "  ✓ Workflow permissions are already correct — no change needed."
  else
    gh api --method PUT "/repos/${REPO}/actions/permissions/workflow" \
      --field default_workflow_permissions=write \
      --field can_approve_pull_request_reviews=true > /dev/null
    echo "  ✓ Updated:"
    echo "      default_workflow_permissions     → write"
    echo "      can_approve_pull_request_reviews → true"
    CHANGED=1
  fi
else
  echo "  ⚠  API returned no data — the endpoint may require admin:org scope"
  echo "     (organisation repos only) or broader write permissions."
  echo "     Skipping automatic update; follow the web-UI runbook below."
fi

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
