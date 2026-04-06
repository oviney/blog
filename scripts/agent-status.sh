#!/usr/bin/env bash
# agent-status.sh — Quick check on Copilot agent activity
#
# Usage: bash scripts/agent-status.sh

set -euo pipefail

STALE_HOURS=2
NOW=$(date +%s)

echo ""
echo "═══════════════════════════════════════════════════"
echo " Agent Status Check — $(date '+%Y-%m-%d %H:%M')"
echo "═══════════════════════════════════════════════════"

echo ""
echo "── Open PRs ──────────────────────────────────────"
echo ""

gh pr list --state open --json number,title,updatedAt,isDraft,author \
  --jq '.[] | "\(.number)|\(.title)|\(.updatedAt)|\(if .isDraft then "DRAFT" else "OPEN" end)|\(.author.login)"' |
while IFS='|' read -r num title updated status author; do
  updated_epoch=$(date -juf "%Y-%m-%dT%H:%M:%SZ" "$updated" +%s 2>/dev/null || date -d "$updated" +%s 2>/dev/null || echo 0)
  now_utc=$(date -u +%s)
  hours_ago=$(( (now_utc - updated_epoch) / 3600 ))

  if (( hours_ago > STALE_HOURS )); then
    indicator="⚠️  STALE (${hours_ago}h)"
  else
    indicator="✅ Active (${hours_ago}h ago)"
  fi

  printf "  #%-4s [%s] %s\n" "$num" "$status" "$title"
  printf "         %s — author: %s\n\n" "$indicator" "$author"
done

echo "── Assigned Issues (no PR yet) ─────────────────"
echo ""

gh issue list --state open --assignee "copilot-swe-agent[bot]" --json number,title,updatedAt \
  --jq '.[] | "\(.number)|\(.title)|\(.updatedAt)"' |
while IFS='|' read -r num title updated; do
  # Check if a PR exists for this issue
  pr_count=$(gh pr list --state open --search "linked:$num" --json number --jq 'length' 2>/dev/null || echo "0")

  updated_epoch=$(date -juf "%Y-%m-%dT%H:%M:%SZ" "$updated" +%s 2>/dev/null || date -d "$updated" +%s 2>/dev/null || echo 0)
  now_utc=$(date -u +%s)
  hours_ago=$(( (now_utc - updated_epoch) / 3600 ))

  if [[ "$pr_count" == "0" ]]; then
    printf "  #%-4s %s\n" "$num" "$title"
    printf "         ⚠️  No PR found — last activity: %sh ago\n\n" "$hours_ago"
  fi
done

echo "═══════════════════════════════════════════════════"
echo ""
