#!/usr/bin/env bash
# content-inventory.sh — regenerate published-post metrics for ROADMAP.md
#
# Published-post counts and the category mix in ROADMAP.md are maintained by
# hand, which makes drift likely. This script recomputes them from _posts/
# front matter so the numbers can be regenerated instead of edited manually.
#
# Usage:
#   bash scripts/content-inventory.sh             # human-readable report
#   bash scripts/content-inventory.sh --markdown  # Markdown table (paste into ROADMAP.md)
#   bash scripts/content-inventory.sh --check      # compare against ROADMAP.md; exit 1 on drift
#
# "Published" = every *.md / *.markdown file under _posts/ (Jekyll publishes
# all of them; no future-dated posts exist today). Categories are read from the
# inline front-matter form `categories: ["A", "B"]`; a post may count toward
# more than one category.
#
# Portable to bash 3.2 (macOS): no mapfile / associative arrays.
#
# Exit codes: 0 = success (or --check found no drift), 1 = --check found drift.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
POSTS_DIR="$REPO_ROOT/_posts"
ROADMAP="$REPO_ROOT/ROADMAP.md"

MODE="report"
case "${1:-}" in
  --markdown) MODE="markdown" ;;
  --check)    MODE="check" ;;
  "")         MODE="report" ;;
  *) echo "Unknown option: $1" >&2; echo "Usage: $0 [--markdown|--check]" >&2; exit 1 ;;
esac

# ---------------------------------------------------------------------------
# Compute metrics from _posts/ front matter.
# ---------------------------------------------------------------------------
TOTAL_POSTS=$(find "$POSTS_DIR" -maxdepth 1 \( -name "*.md" -o -name "*.markdown" \) | wc -l | tr -d ' ')

# Emit one category name per line, across all posts.
all_categories() {
  find "$POSTS_DIR" -maxdepth 1 \( -name "*.md" -o -name "*.markdown" \) -print0 \
    | xargs -0 awk '
        FNR == 1 { fm = 0 }
        /^---[[:space:]]*$/ { fm++; next }
        fm == 1 && /^categories:/ {
          line = $0
          sub(/^categories:[[:space:]]*/, "", line)
          gsub(/[][]/, "", line)                       # strip [ ]
          n = split(line, arr, ",")
          for (i = 1; i <= n; i++) {
            v = arr[i]
            gsub(/^[[:space:]]+|[[:space:]]+$/, "", v) # trim
            gsub(/^["'\'']|["'\'']$/, "", v)           # strip surrounding quotes
            if (v != "") print v
          }
          next
        }
        fm >= 2 { nextfile }
      '
}

# "count<TAB>name" lines, sorted by count desc then name asc.
CATEGORY_TABLE="$(all_categories | sort | uniq -c \
  | sort -k1,1nr -k2 \
  | sed -E 's/^[[:space:]]*([0-9]+)[[:space:]]+(.*)$/\1	\2/')"

actual_count_for() {
  awk -F'\t' -v n="$1" '$2 == n { print $1; found = 1 } END { if (!found) print 0 }' <<<"$CATEGORY_TABLE"
}

# ---------------------------------------------------------------------------
# Output modes.
# ---------------------------------------------------------------------------
case "$MODE" in
  report)
    echo "Content inventory — $TOTAL_POSTS published posts"
    echo "------------------------------------------------"
    while IFS=$'\t' read -r count name; do
      [[ -n "$name" ]] && printf '  %-24s %s\n' "$name" "$count"
    done <<<"$CATEGORY_TABLE"
    ;;

  markdown)
    echo "| Category | Posts |"
    echo "|----------|-------|"
    while IFS=$'\t' read -r count name; do
      [[ -n "$name" ]] && printf '| %s | %s |\n' "$name" "$count"
    done <<<"$CATEGORY_TABLE"
    echo
    echo "_Total published posts: ${TOTAL_POSTS}. Regenerate with \`bash scripts/content-inventory.sh\`._"
    ;;

  check)
    [[ -f "$ROADMAP" ]] || { echo "ROADMAP.md not found at $ROADMAP" >&2; exit 1; }
    DRIFT=0

    # Documented total: the "| Published posts | N |" table row.
    DOC_TOTAL=$(grep -oE '^\| Published posts \| *[0-9]+' "$ROADMAP" | grep -oE '[0-9]+$' || true)
    if [[ "$DOC_TOTAL" != "$TOTAL_POSTS" ]]; then
      echo "DRIFT: published posts — ROADMAP says '${DOC_TOTAL:-<none>}', actual is ${TOTAL_POSTS}"
      DRIFT=1
    fi

    # Documented per-category: "- **Name** (N posts)" lines under Topic priorities.
    while IFS= read -r line; do
      [[ -n "$line" ]] || continue
      name=$(sed -E 's/.*\*\*([^*]+)\*\*.*/\1/' <<<"$line")
      doc_count=$(grep -oE '\(([0-9]+) posts?\)' <<<"$line" | grep -oE '[0-9]+')
      actual=$(actual_count_for "$name")
      if [[ "$doc_count" != "$actual" ]]; then
        echo "DRIFT: ${name} — ROADMAP says ${doc_count}, actual is ${actual}"
        DRIFT=1
      fi
    done < <(grep -oE '\*\*[^*]+\*\* \([0-9]+ posts?\)' "$ROADMAP")

    if [[ "$DRIFT" -eq 0 ]]; then
      echo "OK: ROADMAP.md metrics match _posts/ (${TOTAL_POSTS} posts)."
      exit 0
    fi
    exit 1
    ;;
esac
