#!/usr/bin/env bash
# agent-status.sh — Fleet status check for Copilot Coding Agent
#
# Uses `gh agent-task list` (gh v2.80.0+, public preview) cross-referenced
# with `gh pr list --state open` so cancelled/merged tasks are filtered out.
#
# Usage: bash scripts/agent-status.sh [repo]

set -euo pipefail

REPO="${1:-oviney/blog}"

echo ""
echo "═══════════════════════════════════════════════════"
echo " Agent Fleet Status — $(date '+%Y-%m-%d %H:%M')"
echo " Repo: $REPO"
echo "═══════════════════════════════════════════════════"
echo ""

# Get list of open PR numbers for this repo
OPEN_PRS=$(gh pr list --repo "$REPO" --state open --json number --jq '.[].number' | tr '\n' ' ')

if [[ -z "${OPEN_PRS// }" ]]; then
  echo "No open pull requests."
  echo ""
  exit 0
fi

# Cross-reference agent tasks with open PRs
gh agent-task list 2>/dev/null | awk -F'\t' -v repo="$REPO" -v open_prs=" $OPEN_PRS " '
BEGIN { ready=0; in_progress=0 }
$3 == repo {
  pr_num = $2; sub(/^#/, "", pr_num)

  # Only include PRs that are still open
  if (index(open_prs, " " pr_num " ") == 0) next

  line = sprintf("  #%-5s %-22s %s\n", pr_num, $4, $1)
  if ($4 ~ /Ready/) { ready_list = ready_list line; ready++ }
  else { in_progress_list = in_progress_list line; in_progress++ }
}
END {
  if (ready > 0) {
    print "── Ready for review (action: REVIEW) ───────────"
    print ""
    printf "%s\n", ready_list
  }
  if (in_progress > 0) {
    print "── In progress (action: WAIT) ──────────────────"
    print ""
    printf "%s\n", in_progress_list
  }
  if (ready + in_progress == 0) {
    print "No active agent tasks on open PRs."
    print ""
  }
  print "═══════════════════════════════════════════════════"
  printf " Summary: %d ready for review | %d in progress\n", ready, in_progress
  print "═══════════════════════════════════════════════════"
  print ""
}
'
