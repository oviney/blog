#!/usr/bin/env bash
# analyse-changes.sh — per-build change analysis to minimal test plan
#
# Usage: bash scripts/analyse-changes.sh <BASE_SHA> <HEAD_SHA>
#
# Reads changed file paths and maps them to test groups defined in
# scripts/test-groups.json. Outputs a JSON test plan to stdout so callers
# can decide which Playwright groups to execute.
#
# Output format:
#   {
#     "run_type": "partial",
#     "groups": ["content", "links"],
#     "skipped": ["visual", "performance", "security"],
#     "skip_reason": "Only _posts/** changed",
#     "force_full": false
#   }
#
# Exit codes: 0 = success, 1 = missing arguments or required tooling.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GROUPS_FILE="${SCRIPT_DIR}/test-groups.json"

# ---------------------------------------------------------------------------
# All known test groups (used to compute skipped list)
# ---------------------------------------------------------------------------
ALL_KNOWN_GROUPS=("content" "links" "navigation" "visual" "accessibility" "search" "performance" "security")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
usage() {
  echo "Usage: bash scripts/analyse-changes.sh <BASE_SHA> <HEAD_SHA>" >&2
  exit 1
}

# Emit a full-suite test plan
emit_full() {
  local reason="$1"
  local groups_json="["
  local first=true
  for g in "${ALL_KNOWN_GROUPS[@]}"; do
    [[ "$first" == "true" ]] || groups_json+=","
    groups_json+="\"$g\""
    first=false
  done
  groups_json+="]"
  local reason_escaped="${reason//\"/\\\"}"
  printf '{"run_type":"full","groups":%s,"skipped":[],"skip_reason":"%s","force_full":true}\n' \
    "$groups_json" "$reason_escaped"
}

# fnmatch-style glob match using bash's case statement
glob_match() {
  local path="$1"
  local pattern="$2"
  case "$path" in
    $pattern) return 0 ;;
    *) return 1 ;;
  esac
}

# ---------------------------------------------------------------------------
# Argument validation
# ---------------------------------------------------------------------------
if [[ $# -lt 2 ]]; then
  usage
fi

BASE_SHA="$1"
HEAD_SHA="$2"

if ! command -v jq &>/dev/null; then
  echo '{"run_type":"full","groups":["ALL"],"skipped":[],"skip_reason":"jq not available","force_full":true}' >&2
  emit_full "jq not available"
  exit 0
fi

if [[ ! -f "$GROUPS_FILE" ]]; then
  emit_full "test-groups.json not found"
  exit 0
fi

# ---------------------------------------------------------------------------
# Get changed files
# ---------------------------------------------------------------------------
CHANGED_FILES=$(git diff --name-only "$BASE_SHA" "$HEAD_SHA" 2>/dev/null || true)

if [[ -z "$CHANGED_FILES" ]]; then
  # No diff (e.g., first push, shallow clone) — run full suite to be safe
  emit_full "No changed files detected"
  exit 0
fi

# ---------------------------------------------------------------------------
# Walk each changed file through the pattern map
# ---------------------------------------------------------------------------
declare -A MATCHED_GROUPS  # deduplication set
FORCE_FULL=false
SKIP_REASON=""
MATCHED_PATTERNS=()

# Read patterns and their groups from JSON
mapfile -t PATTERNS < <(jq -r 'keys[]' "$GROUPS_FILE")

for file in $CHANGED_FILES; do
  file_matched=false

  for pattern in "${PATTERNS[@]}"; do
    if glob_match "$file" "$pattern"; then
      file_matched=true

      # Read this pattern's groups as a newline-separated list
      mapfile -t groups < <(jq -r --arg p "$pattern" '.[$p][]' "$GROUPS_FILE" 2>/dev/null || true)

      for g in "${groups[@]}"; do
        if [[ "$g" == "ALL" ]]; then
          FORCE_FULL=true
          SKIP_REASON="Path matching $pattern forces full suite"
          break 3   # exit all loops — we're done
        fi
        MATCHED_GROUPS["$g"]=1
        MATCHED_PATTERNS+=("$pattern")
      done
      # A file can match multiple patterns; continue checking all of them
    fi
  done

  if [[ "$file_matched" == "false" ]]; then
    # Unmatched path → safe fallback: full suite
    FORCE_FULL=true
    SKIP_REASON="Unmatched path ($file) triggers full suite"
    break
  fi
done

# ---------------------------------------------------------------------------
# Build output JSON
# ---------------------------------------------------------------------------
if [[ "$FORCE_FULL" == "true" ]]; then
  emit_full "${SKIP_REASON:-Full suite triggered}"
  exit 0
fi

# Collect unique matched groups
SELECTED=()
for g in "${!MATCHED_GROUPS[@]}"; do
  SELECTED+=("$g")
done

# Compute skipped groups
SKIPPED=()
for g in "${ALL_KNOWN_GROUPS[@]}"; do
  if [[ -z "${MATCHED_GROUPS[$g]+_}" ]]; then
    SKIPPED+=("$g")
  fi
done

# Determine unique matched patterns for skip_reason
UNIQUE_PATTERNS=()
declare -A seen_patterns
for p in "${MATCHED_PATTERNS[@]}"; do
  if [[ -z "${seen_patterns[$p]+_}" ]]; then
    UNIQUE_PATTERNS+=("$p")
    seen_patterns["$p"]=1
  fi
done

if [[ ${#UNIQUE_PATTERNS[@]} -gt 0 ]]; then
  PATTERNS_STR=$(IFS=', '; echo "${UNIQUE_PATTERNS[*]}")
  SKIP_REASON="Only paths matching: ${PATTERNS_STR}"
else
  SKIP_REASON="Partial run"
fi

# Build JSON arrays
groups_json="["
first=true
for g in "${SELECTED[@]}"; do
  [[ "$first" == "true" ]] || groups_json+=","
  groups_json+="\"$g\""
  first=false
done
groups_json+="]"

skipped_json="["
first=true
for g in "${SKIPPED[@]}"; do
  [[ "$first" == "true" ]] || skipped_json+=","
  skipped_json+="\"$g\""
  first=false
done
skipped_json+="]"

# Escape skip reason for JSON
SKIP_REASON_ESCAPED="${SKIP_REASON//\"/\\\"}"

RUN_TYPE="partial"
if [[ ${#SELECTED[@]} -eq ${#ALL_KNOWN_GROUPS[@]} ]]; then
  RUN_TYPE="full"
fi

printf '{"run_type":"%s","groups":%s,"skipped":%s,"skip_reason":"%s","force_full":false}\n' \
  "$RUN_TYPE" "$groups_json" "$skipped_json" "$SKIP_REASON_ESCAPED"
