#!/usr/bin/env bash
# scripts/select-tests.sh
#
# Inspect changed files and determine which Playwright test groups to run.
# Outputs a TEST_GROUPS environment variable (comma-separated REQ IDs) and
# a FULL_SUITE boolean flag.
#
# Usage:
#   source scripts/select-tests.sh          # sets TEST_GROUPS, FULL_SUITE in current shell
#   bash  scripts/select-tests.sh           # prints export statements for eval
#   bash  scripts/select-tests.sh >> $GITHUB_ENV   # GitHub Actions mode
#
# In GitHub Actions, pass --github to write directly to $GITHUB_ENV / $GITHUB_STEP_SUMMARY.

set -euo pipefail

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

GITHUB_MODE=false
if [[ "${1:-}" == "--github" ]]; then
  GITHUB_MODE=true
fi

log() { echo "  [select-tests] $*" >&2; }

# ---------------------------------------------------------------------------
# Determine changed files
# ---------------------------------------------------------------------------

# Diff against the merge base with the target branch, NOT HEAD~1.
#
# HEAD~1 only ever exposes the most recent commit. On any PR with more than one
# commit that silently hides earlier changes from selection — a PR whose first
# commit edits _layouts/ and whose second edits a doc would be classified
# "docs-only" and skip Playwright entirely. BASE_REF lets the workflow pass the
# PR's base; we fall back through origin/main to HEAD~1 so local runs still work.
BASE_REF="${BASE_REF:-origin/main}"

CHANGED_FILES=""
DIFF_BASE=""

if git rev-parse --verify "$BASE_REF" >/dev/null 2>&1; then
  # merge-base keeps us honest when the branch is behind: we want what THIS
  # branch changed, not everything that landed on main in the meantime.
  DIFF_BASE=$(git merge-base "$BASE_REF" HEAD 2>/dev/null || true)
fi

if [[ -n "$DIFF_BASE" ]]; then
  log "Diffing against merge-base with ${BASE_REF} (${DIFF_BASE:0:8})"
  CHANGED_FILES=$(git diff --name-only "$DIFF_BASE" HEAD 2>/dev/null || true)
elif git rev-parse HEAD~1 >/dev/null 2>&1; then
  log "No usable ${BASE_REF} – falling back to HEAD~1 (may under-select)"
  CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD 2>/dev/null || true)
else
  log "Cannot determine changed files – treating as full suite"
  CHANGED_FILES="UNKNOWN"
fi

# An empty diff is ambiguous (no changes, or a broken base). Never interpret it
# as "nothing to test" — fail safe to the full suite.
if [[ -z "$CHANGED_FILES" ]]; then
  log "Empty diff – treating as full suite"
  CHANGED_FILES="UNKNOWN"
fi

# ---------------------------------------------------------------------------
# Pattern matching → group accumulation
# NOTE: Do NOT use GROUPS as a variable name — it is a Bash built-in that
# holds the current user's supplementary group IDs.
# ---------------------------------------------------------------------------

REQ_GROUPS=""
RUN_FULL_SUITE=false
SKIP_PLAYWRIGHT=false
SELECTION_REASON=""
WORKFLOW_ONLY=true

add_req() {
  local g="$1"
  if [[ -z "$REQ_GROUPS" ]]; then
    REQ_GROUPS="$g"
  elif [[ "$REQ_GROUPS" != *"$g"* ]]; then
    REQ_GROUPS="$REQ_GROUPS,$g"
  fi
}

trigger_full_suite() {
  RUN_FULL_SUITE=true
  REQ_GROUPS="ALL"
  SELECTION_REASON="${SELECTION_REASON} ${1};"
}

while IFS= read -r file; do
  [[ -z "$file" ]] && continue

  # _sass/ or assets/css/ → visual, a11y, nav
  if [[ "$file" == _sass/* ]] || [[ "$file" == assets/css/* ]]; then
    WORKFLOW_ONLY=false
    add_req "REQ-VISUAL-01"
    add_req "REQ-A11Y-01"
    add_req "REQ-NAV-01"
    SELECTION_REASON="${SELECTION_REASON} CSS/SASS change;"
  fi

  # _layouts/ or _includes/ → ALL (high-risk)
  if [[ "$file" == _layouts/* ]] || [[ "$file" == _includes/* ]]; then
    WORKFLOW_ONLY=false
    trigger_full_suite "layout/includes change"
  fi

  # _posts/ or _drafts/ → content + links
  if [[ "$file" == _posts/* ]] || [[ "$file" == _drafts/* ]]; then
    WORKFLOW_ONLY=false
    add_req "REQ-CONTENT-01"
    add_req "REQ-CONTENT-02"
    add_req "REQ-LINKS-01"
    SELECTION_REASON="${SELECTION_REASON} posts/drafts change;"
  fi

  # assets/js/ → nav, search, a11y
  if [[ "$file" == assets/js/* ]]; then
    WORKFLOW_ONLY=false
    add_req "REQ-NAV-02"
    add_req "REQ-SEARCH-01"
    add_req "REQ-A11Y-02"
    SELECTION_REASON="${SELECTION_REASON} JS assets change;"
  fi

  # .github/workflows/ → CI-only, no Playwright
  if [[ "$file" == .github/workflows/* ]]; then
    SELECTION_REASON="${SELECTION_REASON} CI-workflow-only change;"
    # Keep WORKFLOW_ONLY=true unless something else also changed
  fi

  # package.json / package-lock.json → security + full suite
  if [[ "$file" == "package.json" ]] || [[ "$file" == "package-lock.json" ]]; then
    WORKFLOW_ONLY=false
    add_req "REQ-SEC-01"
    trigger_full_suite "package.json change"
  fi

  # _config*.yml → ALL (high-risk)
  if [[ "$file" == _config*.yml ]]; then
    WORKFLOW_ONLY=false
    trigger_full_suite "_config change"
  fi

  # Any other non-doc, non-workflow file triggers at least a minimal run
  if [[ "$file" != .github/workflows/* ]] && \
     [[ "$file" != "CHANGELOG.md" ]] && \
     [[ "$file" != "README.md" ]] && \
     [[ "$file" != vendor/* ]] && \
     [[ "$file" != *.md ]] && \
     [[ "$file" != docs/* ]]; then
    WORKFLOW_ONLY=false
  fi

done <<< "$CHANGED_FILES"

# Default: if no specific groups matched and it's not CI-only, run full suite
if [[ -z "$REQ_GROUPS" ]] && [[ "$WORKFLOW_ONLY" == false ]]; then
  trigger_full_suite "unclassified file change"
fi

# If only workflow files changed, skip Playwright entirely
if [[ "$WORKFLOW_ONLY" == true ]] && [[ -z "$REQ_GROUPS" ]]; then
  SKIP_PLAYWRIGHT=true
  REQ_GROUPS="NONE"
  SELECTION_REASON="${SELECTION_REASON} CI-workflow-only change – Playwright skipped;"
fi

# Build Playwright --grep expression from groups
build_grep_expression() {
  local groups="$1"
  if [[ "$groups" == "ALL" ]] || [[ "$groups" == "NONE" ]]; then
    echo ""
    return
  fi
  # Convert "REQ-NAV-01,REQ-CONTENT-01" → "@REQ-NAV-01|@REQ-CONTENT-01"
  local expr=""
  IFS=',' read -ra parts <<< "$groups"
  for part in "${parts[@]}"; do
    part=$(echo "$part" | xargs)  # trim whitespace
    [[ -z "$part" ]] && continue
    if [[ -z "$expr" ]]; then
      expr="@${part}"
    else
      expr="${expr}|@${part}"
    fi
  done
  echo "$expr"
}

GREP_EXPR=$(build_grep_expression "$REQ_GROUPS")

# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

log "TEST_GROUPS=$REQ_GROUPS"
log "FULL_SUITE=$RUN_FULL_SUITE"
log "SKIP_PLAYWRIGHT=$SKIP_PLAYWRIGHT"
log "GREP_EXPR=$GREP_EXPR"
log "REASON=${SELECTION_REASON:-none}"

if [[ "$GITHUB_MODE" == true ]]; then
  # Write to GitHub Actions environment file
  {
    echo "TEST_GROUPS=${REQ_GROUPS}"
    echo "FULL_SUITE=${RUN_FULL_SUITE}"
    echo "SKIP_PLAYWRIGHT=${SKIP_PLAYWRIGHT}"
    echo "PLAYWRIGHT_GREP=${GREP_EXPR}"
    echo "SELECTION_REASON=${SELECTION_REASON:-none}"
  } >> "$GITHUB_ENV"
  echo "✅ Test selection written to \$GITHUB_ENV" >&2
else
  # Print export statements so callers can eval the output
  echo "export TEST_GROUPS='${REQ_GROUPS}'"
  echo "export FULL_SUITE='${RUN_FULL_SUITE}'"
  echo "export SKIP_PLAYWRIGHT='${SKIP_PLAYWRIGHT}'"
  echo "export PLAYWRIGHT_GREP='${GREP_EXPR}'"
  echo "export SELECTION_REASON='${SELECTION_REASON:-none}'"
fi
