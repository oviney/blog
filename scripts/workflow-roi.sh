#!/usr/bin/env bash
# workflow-roi.sh — measures the value each GitHub Actions workflow has
# produced in the last 30 days, then files a consolidated review issue.
#
# Per workflow it reports:
#   - runs_30d        — total runs in the last 30 days
#   - success_rate_30d — successful runs ÷ total runs (rounded to whole %)
#   - avg_duration    — mean run duration in minutes
#   - last_run        — ISO date of the most recent run (any conclusion)
#
# The output is a markdown table sorted by runs_30d descending. Workflows
# with zero runs in the window are listed in a separate "retirement
# candidates" section.
#
# When run via CI (GH_TOKEN + GITHUB_REPOSITORY set), files a single issue
# titled "Workflow ROI Review — <date>" labelled `agent:qa-gatekeeper` and
# `monitoring`. Deduplicates by title prefix (one open issue at a time).
#
# Usage:
#   GH_TOKEN=<token> GITHUB_REPOSITORY=owner/repo bash scripts/workflow-roi.sh
#
# Local-only dry run (prints to stdout, no issue filed):
#   DRY_RUN=1 bash scripts/workflow-roi.sh
#
# Dependencies: gh + jq + bash. No other tools required.

set -euo pipefail

REPO="${GITHUB_REPOSITORY:-oviney/blog}"
DRY_RUN="${DRY_RUN:-0}"
WINDOW_DAYS="${WINDOW_DAYS:-30}"
SINCE=$(date -u -v-"${WINDOW_DAYS}"d '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null \
        || date -u -d "${WINDOW_DAYS} days ago" '+%Y-%m-%dT%H:%M:%SZ')
TODAY=$(date -u '+%Y-%m-%d')

# ---------------------------------------------------------------------------
# Fetch workflows
# ---------------------------------------------------------------------------
echo "workflow-roi: fetching workflow list for ${REPO}..." >&2
WORKFLOWS=$(gh api "repos/${REPO}/actions/workflows" --paginate \
              --jq '.workflows[] | {id, name, path, state}')

if [ -z "$WORKFLOWS" ]; then
  echo "workflow-roi: no workflows found — bailing." >&2
  exit 0
fi

# Build a row per workflow.
ROWS=$(echo "$WORKFLOWS" | jq -c '.' | while read -r WF; do
  ID=$(echo "$WF" | jq -r '.id')
  NAME=$(echo "$WF" | jq -r '.name')
  PATH_=$(echo "$WF" | jq -r '.path')
  STATE=$(echo "$WF" | jq -r '.state')

  RUNS=$(gh api "repos/${REPO}/actions/workflows/${ID}/runs?per_page=100&created=>=${SINCE}" \
           --jq '.workflow_runs' 2>/dev/null || echo '[]')

  TOTAL=$(echo "$RUNS" | jq 'length')
  SUCCESS=$(echo "$RUNS" | jq '[.[] | select(.conclusion=="success")] | length')
  FAILURE=$(echo "$RUNS" | jq '[.[] | select(.conclusion=="failure")] | length')

  if [ "$TOTAL" -gt 0 ]; then
    SUCCESS_RATE=$(( SUCCESS * 100 / TOTAL ))
    AVG_DURATION_S=$(echo "$RUNS" | jq -r '
      [.[] | select(.run_started_at and .updated_at)
           | (((.updated_at | fromdateiso8601) - (.run_started_at | fromdateiso8601)))]
      | if length == 0 then 0 else (add / length | floor) end')
    AVG_DURATION_M=$(( AVG_DURATION_S / 60 ))
    LAST_RUN=$(echo "$RUNS" | jq -r '.[0].run_started_at // "—"' | cut -c1-10)
  else
    SUCCESS_RATE=0
    AVG_DURATION_M=0
    LAST_RUN="—"
  fi

  # JSONL row; sort + table-format below
  jq -nc \
    --arg name "$NAME" --arg path "$PATH_" --arg state "$STATE" --arg last "$LAST_RUN" \
    --argjson total "$TOTAL" --argjson success "$SUCCESS" --argjson failure "$FAILURE" \
    --argjson rate "$SUCCESS_RATE" --argjson dur "$AVG_DURATION_M" \
    '{name:$name, path:$path, state:$state, total:$total, success:$success,
      failure:$failure, rate:$rate, dur:$dur, last:$last}'
done | jq -sc 'sort_by(-.total)')

ACTIVE=$(echo "$ROWS" | jq -c '[.[] | select(.total > 0)]')
RETIREMENT_CANDIDATES=$(echo "$ROWS" | jq -c '[.[] | select(.total == 0)]')
ACTIVE_COUNT=$(echo "$ACTIVE" | jq 'length')
RETIRE_COUNT=$(echo "$RETIREMENT_CANDIDATES" | jq 'length')
TOTAL_RUNS=$(echo "$ACTIVE" | jq '[.[].total] | add // 0')

# ---------------------------------------------------------------------------
# Build report body
# ---------------------------------------------------------------------------
build_table_row() {
  local row="$1"
  jq -r '. | "| `\(.name)` | \(.total) | \(.rate)% | \(.dur) min | \(.last) | `\(.path)` |"' <<<"$row"
}

REPORT_FILE=$(mktemp)
{
  echo "# Workflow ROI Review — ${TODAY}"
  echo ""
  echo "Window: last ${WINDOW_DAYS} days (since \`${SINCE}\`)"
  echo "Repo: \`${REPO}\`"
  echo ""
  echo "**Summary:** ${ACTIVE_COUNT} active workflows with ${TOTAL_RUNS} total runs; ${RETIRE_COUNT} workflows with **zero runs** (retirement candidates)."
  echo ""
  echo "## Active workflows (sorted by run count, desc)"
  echo ""
  echo "| Workflow | Runs | Success | Avg duration | Last run | Path |"
  echo "|---|---:|---:|---:|---|---|"
  if [ "$ACTIVE_COUNT" -gt 0 ]; then
    echo "$ACTIVE" | jq -c '.[]' | while read -r row; do
      build_table_row "$row"
    done
  else
    echo "| _(none)_ | | | | | |"
  fi
  echo ""
  echo "## Retirement candidates — zero runs in last ${WINDOW_DAYS} days"
  echo ""
  if [ "$RETIRE_COUNT" -gt 0 ]; then
    echo "These workflows have not run in the window. Consider retiring or extracting per \`CLAUDE.md\` Product Boundary guidance:"
    echo ""
    echo "$RETIREMENT_CANDIDATES" | jq -r '.[] | "- `\(.path)` (\(.name))"'
  else
    echo "_(none — every workflow ran at least once in the window.)_"
  fi
  echo ""
  echo "## How to act on this"
  echo ""
  echo "1. **Retire** — \`git rm .github/workflows/<file>\` for clearly-dead workflows (zero runs + no future trigger). Land in one PR per cluster."
  echo "2. **Extract** — workflows that prove broadly reusable belong in a separate repo (per \`CLAUDE.md\` Product Boundary)."
  echo "3. **Repair** — workflows with <50% success rate over the window need investigation, not retirement."
  echo "4. **Keep** — high-run, high-success workflows are paying back; no action."
  echo ""
  echo "---"
  echo ""
  echo "_Filed automatically by \`scripts/workflow-roi.sh\` via \`.github/workflows/workflow-roi.yml\` (monthly cron). Spawned from issue [#1007](https://github.com/${REPO}/issues/1007)._"
} > "$REPORT_FILE"

# ---------------------------------------------------------------------------
# Output or file issue
# ---------------------------------------------------------------------------
if [ "$DRY_RUN" = "1" ] || [ -z "${GH_TOKEN:-}" ]; then
  echo "workflow-roi: DRY_RUN — printing to stdout." >&2
  cat "$REPORT_FILE"
  rm -f "$REPORT_FILE"
  exit 0
fi

ISSUE_TITLE="Workflow ROI Review — ${TODAY}"

EXISTING=$(gh issue list --repo "$REPO" --state open --search "in:title \"Workflow ROI Review\"" --json number,title --jq '.[0].number // empty')

if [ -n "$EXISTING" ]; then
  echo "workflow-roi: open ROI issue #${EXISTING} found — posting comment instead of new issue." >&2
  gh issue comment "$EXISTING" --repo "$REPO" --body-file "$REPORT_FILE"
else
  echo "workflow-roi: filing new issue '${ISSUE_TITLE}'..." >&2
  gh issue create --repo "$REPO" --title "$ISSUE_TITLE" --body-file "$REPORT_FILE" \
    --label "agent:qa-gatekeeper" --label "monitoring"
fi

rm -f "$REPORT_FILE"
