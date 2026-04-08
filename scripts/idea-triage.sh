#!/usr/bin/env bash
# idea-triage.sh — scans the repo for improvement signals and files GitHub issues
#
# Signals checked:
#   1. Missing images    — image: front-matter path not found in assets/images/
#   2. Stale skill files — .github/skills/*/SKILL.md not modified in 90+ days
#   3. Test coverage gap — fewer spec files in tests/playwright-agents/ than layouts in _layouts/
#   4. Stale post links  — _posts/ with date: older than 365 days containing dead external URLs
#
# Issues are labelled "triage" and "P3:low". Deduplication prevents filing the
# same issue twice while an open issue with that title already exists.
#
# Usage: GH_TOKEN=<token> GITHUB_REPOSITORY=owner/repo bash scripts/idea-triage.sh

set -euo pipefail

REPO="${GITHUB_REPOSITORY:-oviney/blog}"
LABEL_TRIAGE="triage"
LABEL_PRIORITY="P3:low"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

ensure_label() {
  local name="$1" color="$2" description="$3"
  gh label create "$name" \
    --color "$color" \
    --description "$description" \
    --repo "$REPO" 2>/dev/null || true
}

# Returns true (exit 0) when an open issue with exactly this title exists.
issue_exists() {
  local title="$1"
  local count
  # Search narrows results; jq exact-matches the title.
  count=$(gh issue list \
    --repo "$REPO" \
    --state open \
    --search "\"$title\" in:title" \
    --limit 100 \
    --json title 2>/dev/null \
    | jq --arg t "$title" '[.[] | select(.title == $t)] | length')
  [[ "${count:-0}" -gt 0 ]]
}

# Create an issue unless one with the same title is already open.
file_issue() {
  local title="$1"
  local body="$2"
  if issue_exists "$title"; then
    echo "  [skip] open issue already exists: $title"
    return
  fi
  gh issue create \
    --repo "$REPO" \
    --title "$title" \
    --body "$body" \
    --label "$LABEL_TRIAGE" \
    --label "$LABEL_PRIORITY" \
    && echo "  [filed] $title" \
    || echo "  [error] failed to file: $title" >&2
}

# ---------------------------------------------------------------------------
# Ensure required labels exist
# ---------------------------------------------------------------------------

echo "Ensuring labels…"
ensure_label "$LABEL_TRIAGE"   "e4e669" "Automated triage finding"
ensure_label "$LABEL_PRIORITY" "fef2c0" "Priority: low"

# ---------------------------------------------------------------------------
# Signal 1: Missing images
# ---------------------------------------------------------------------------

echo ""
echo "=== Signal 1: Missing images ==="

while IFS= read -r post; do
  img=$(grep -m1 '^image:' "$post" 2>/dev/null \
        | sed 's/^image:[[:space:]]*//' \
        | tr -d '"' || true)
  [[ -z "$img" ]] && continue

  # Strip leading slash to get the repo-relative path.
  img_path="${img#/}"

  if [[ ! -f "$img_path" ]]; then
    title="triage: missing image — ${img}"
    body="## Missing Image Detected

The post \`${post}\` references an image that does not exist:

\`\`\`
image: ${img}
\`\`\`

**Expected file:** \`${img_path}\`

**Action required:** Add the missing image file or correct the \`image:\` front-matter value.

_Filed automatically by the [idea-triage workflow](../../actions/workflows/idea-triage.yml)._"
    file_issue "$title" "$body"
  fi
done < <(find _posts -name "*.md" 2>/dev/null | sort)

# ---------------------------------------------------------------------------
# Signal 2: Stale skill files (not modified in 90+ days)
# ---------------------------------------------------------------------------

echo ""
echo "=== Signal 2: Stale skill files ==="

# NOTE: GNU date (-d) is used throughout; this script is designed to run on
# Ubuntu-based GitHub Actions runners. macOS/BSD runners would need `date -v`.
NINETY_DAYS_AGO=$(date -d "90 days ago" +%s)

for skill_file in .github/skills/*/SKILL.md; do
  [[ -f "$skill_file" ]] || continue

  last_modified_str=$(git log -1 --format="%ci" -- "$skill_file" 2>/dev/null || true)
  [[ -z "$last_modified_str" ]] && continue

  last_modified_ts=$(date -d "$last_modified_str" +%s 2>/dev/null || true)
  [[ -z "$last_modified_ts" ]] && continue

  if [[ "$last_modified_ts" -lt "$NINETY_DAYS_AGO" ]]; then
    skill_name=$(basename "$(dirname "$skill_file")")
    days_old=$(( ($(date +%s) - last_modified_ts) / 86400 ))
    last_modified_date="${last_modified_str%% *}"
    title="triage: stale skill file — ${skill_name}"
    body="## Stale Skill File

The skill file \`${skill_file}\` has not been updated in **${days_old} days** (last modified: ${last_modified_date}).

Skill files should be reviewed every 90 days to ensure they reflect current agent conventions, tooling changes, and process improvements.

**Action required:** Review and update \`${skill_file}\` with any relevant changes since ${last_modified_date}.

_Filed automatically by the [idea-triage workflow](../../actions/workflows/idea-triage.yml)._"
    file_issue "$title" "$body"
  else
    skill_name=$(basename "$(dirname "$skill_file")")
    echo "  [ok] ${skill_name} — updated recently ($(date -d "$last_modified_str" +%Y-%m-%d))"
  fi
done

# ---------------------------------------------------------------------------
# Signal 3: Test coverage gap
# ---------------------------------------------------------------------------

echo ""
echo "=== Signal 3: Test coverage gap ==="

spec_count=$(find tests/playwright-agents -maxdepth 1 -name "*.spec.ts" 2>/dev/null | wc -l)
layout_count=$(find _layouts -name "*.html" 2>/dev/null | wc -l)

echo "  Spec files: ${spec_count}, Layouts: ${layout_count}"

if [[ "$spec_count" -lt "$layout_count" ]]; then
  title="triage: test coverage gap — fewer specs than layouts"
  spec_list=$(find tests/playwright-agents -maxdepth 1 -name "*.spec.ts" 2>/dev/null | sort | sed 's/^/- /')
  layout_list=$(find _layouts -name "*.html" 2>/dev/null | sort | sed 's/^/- /')
  body="## Test Coverage Gap

The repository has **${layout_count} layout files** in \`_layouts/\` but only **${spec_count} Playwright spec files** in \`tests/playwright-agents/\`.

Every layout should ideally have corresponding Playwright test coverage.

**Layouts (${layout_count}):**
${layout_list}

**Spec files (${spec_count}):**
${spec_list}

**Action required:** Add Playwright spec files to cover layouts that lack dedicated tests.

_Filed automatically by the [idea-triage workflow](../../actions/workflows/idea-triage.yml)._"
  file_issue "$title" "$body"
else
  echo "  [ok] coverage adequate (${spec_count} specs ≥ ${layout_count} layouts)"
fi

# ---------------------------------------------------------------------------
# Signal 4: Stale posts with dead external URLs
# ---------------------------------------------------------------------------

echo ""
echo "=== Signal 4: Stale posts with dead external URLs ==="

CUTOFF_DATE=$(date -d "365 days ago" +%Y-%m-%d)
echo "  Cutoff date: ${CUTOFF_DATE}"

while IFS= read -r post; do
  post_date=$(grep -m1 '^date:' "$post" 2>/dev/null \
              | sed 's/^date:[[:space:]]*//' \
              | tr -d '"' \
              | cut -d' ' -f1 || true)
  [[ -z "$post_date" ]] && continue

  # ISO date strings (YYYY-MM-DD) sort lexicographically, so < works correctly.
  if [[ "$post_date" < "$CUTOFF_DATE" ]]; then
    echo "  Checking ${post} (dated ${post_date})…"
    dead_urls=()
    url_checks=0
    max_url_checks=20   # cap per post to avoid timeout

    while IFS= read -r url; do
      [[ -z "$url" ]] && continue
      (( url_checks >= max_url_checks )) && { echo "    [cap] reached ${max_url_checks} URL check limit for this post"; break; } || true
      (( url_checks++ )) || true
      # curl returns exit 0 as long as the connection was attempted;
      # --write-out captures the HTTP status without --fail so we see 404/410.
      http_code=$(curl \
        --head \
        --silent \
        --max-time 10 \
        --location \
        --write-out "%{http_code}" \
        --output /dev/null \
        "$url" 2>/dev/null || echo "000")
      if [[ "$http_code" == "404" || "$http_code" == "410" ]]; then
        dead_urls+=("${url} (HTTP ${http_code})")
        echo "    [dead] ${url} → HTTP ${http_code}"
      fi
    done < <(grep -oE 'https?://[^ )>\"]+' "$post" 2>/dev/null \
             | sed 's/[.,;:!?)"\x27]+$//' \
             | sort -u)

    if [[ ${#dead_urls[@]} -gt 0 ]]; then
      post_basename=$(basename "$post")
      title="triage: dead links in post — ${post_basename}"
      dead_list=$(printf -- '- %s\n' "${dead_urls[@]}")
      body="## Stale Post With Dead External Links

The post \`${post}\` (dated \`${post_date}\`) is more than 365 days old and contains dead external URLs:

${dead_list}

**Action required:** Update or remove the dead links in this post.

_Filed automatically by the [idea-triage workflow](../../actions/workflows/idea-triage.yml)._"
      file_issue "$title" "$body"
    else
      echo "    [ok] no dead URLs found"
    fi
  fi
done < <(find _posts -name "*.md" 2>/dev/null | sort)

echo ""
echo "=== Triage complete ==="
