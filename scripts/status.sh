#!/usr/bin/env bash
# status.sh — dump current state of both repos so you can walk away and resume
# Usage: bash scripts/status.sh

BLOG="oviney/blog"
AGENTS="oviney/economist-agents"

echo "╔══════════════════════════════════════════════════════╗"
echo "║           SESSION STATUS — $(date '+%Y-%m-%d %H:%M %Z')           ║"
echo "╚══════════════════════════════════════════════════════╝"

echo ""
echo "▶ OPEN PRs — $BLOG"
gh pr list --repo $BLOG --state open \
  --json number,title,isDraft,author,updatedAt \
  --jq '.[] | "  #\(.number) \(if .isDraft then "[DRAFT]" else "[READY]" end) \(.title) (\(.author.login)) — \(.updatedAt)"' \
  || echo "  none"

echo ""
echo "▶ OPEN PRs — $AGENTS"
gh pr list --repo $AGENTS --state open \
  --json number,title,isDraft,author,updatedAt \
  --jq '.[] | "  #\(.number) \(if .isDraft then "[DRAFT]" else "[READY]" end) \(.title) (\(.author.login)) — \(.updatedAt)"' \
  || echo "  none"

echo ""
echo "▶ ISSUES ASSIGNED TO @copilot — $AGENTS"
gh issue list --repo $AGENTS --state open \
  --json number,title,assignees,labels \
  --jq '.[] | select(.assignees | map(.login) | any(. == "Copilot")) | "  #\(.number) [\(.labels | map(.name) | join(","))] \(.title)"' \
  || echo "  none"

echo ""
echo "▶ ISSUES ASSIGNED TO @copilot — $BLOG"
gh issue list --repo $BLOG --state open \
  --json number,title,assignees,labels \
  --jq '.[] | select(.assignees | map(.login) | any(. == "Copilot")) | "  #\(.number) [\(.labels | map(.name) | join(","))] \(.title)"' \
  || echo "  none"

echo ""
echo "▶ UNASSIGNED OPEN ISSUES (P1/P2) — $AGENTS"
gh issue list --repo $AGENTS --state open \
  --json number,title,labels,assignees \
  --jq '.[] | select((.assignees | length) == 0) | select(.labels | map(.name) | any(test("P1|P2"))) | "  #\(.number) [\(.labels | map(.name) | join(","))] \(.title)"' \
  || echo "  none"

echo ""
echo "▶ NEXT ACTIONS"
echo "  1. Check READY PRs above → admin-merge with:"
echo "     gh pr merge <N> --repo <REPO> --admin --squash --delete-branch"
echo "  2. DRAFT PRs still in progress — check commits:"
echo "     gh pr view <N> --repo <REPO> --json commits --jq '.commits | map(.messageHeadline)'"
echo "  3. Stalled agent (no new commit in 30min) — close & reassign:"
echo "     gh pr close <N> --repo <REPO> && gh issue edit <ISSUE> --repo <REPO> --add-assignee '@copilot'"
echo ""
