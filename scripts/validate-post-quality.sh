#!/usr/bin/env bash
# validate-post-quality.sh — editorial quality gate for _posts/
#
# Validates every _posts/*.md file against the Economist-inspired quality
# baseline.  Each check is classified as either ERROR (blocks merge) or
# WARNING (non-blocking, informational).
#
# Usage:
#   bash scripts/validate-post-quality.sh          # validate all posts
#   bash scripts/validate-post-quality.sh --help   # show this header
#
# Exit codes:
#   0 — all checks pass
#   1 — one or more ERRORs
#   2 — warnings only (non-blocking)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

ERRORS=0
WARNINGS=0

VALID_CATEGORIES=(
  "Quality Engineering"
  "Software Engineering"
  "Test Automation"
  "Security"
)

# ---------------------------------------------------------------------------
# Helper: extract a scalar front-matter value for a given key.
# Returns the raw value (without the "key:" prefix), or an empty string.
# ---------------------------------------------------------------------------
fm_value() {
  local file="$1" key="$2"
  awk '/^---/{n++; if(n==2) exit} n==1' "$file" \
    | grep -E "^${key}:" \
    | head -1 \
    | sed "s/^${key}:[[:space:]]*//" \
    || true
}

# ---------------------------------------------------------------------------
# Helper: extract the body content (everything after the second --- fence).
# ---------------------------------------------------------------------------
body_content() {
  local file="$1"
  awk '/^---/{n++; next} n>=2' "$file"
}

# ---------------------------------------------------------------------------
# Determine which posts to check.
# ---------------------------------------------------------------------------
if [[ "${1:-}" == "--help" ]]; then
  head -16 "$0" | tail -15
  exit 0
fi

POSTS=$(find "$REPO_ROOT/_posts" -maxdepth 1 \( -name "*.md" -o -name "*.markdown" \) | sort)

if [[ -z "$POSTS" ]]; then
  echo "validate-post-quality: no posts found."
  exit 0
fi

POST_COUNT=$(echo "$POSTS" | wc -l | tr -d ' ')
echo "validate-post-quality: checking $POST_COUNT post(s)..."
echo ""

# ---------------------------------------------------------------------------
# Validate each post.
# ---------------------------------------------------------------------------
for post in $POSTS; do
  [[ -f "$post" ]] || continue
  rel="${post#$REPO_ROOT/}"
  post_errors=0
  post_warnings=0

  # Skip files without front matter
  if ! head -1 "$post" | grep -q "^---$"; then
    echo "❌  $rel — missing front-matter opening fence (---)"
    ERRORS=$((ERRORS + 1))
    continue
  fi

  # ------------------------------------------------------------------
  # 1. Hero image — must be set and not blog-default.svg  [ERROR]
  # ------------------------------------------------------------------
  image_val=$(fm_value "$post" "image")
  if [[ -z "$image_val" ]]; then
    echo "❌  $rel — hero image not set"
    ERRORS=$((ERRORS + 1))
    post_errors=$((post_errors + 1))
  elif [[ "$image_val" == *"blog-default.svg"* ]]; then
    echo "❌  $rel — hero image is the default placeholder (blog-default.svg)"
    ERRORS=$((ERRORS + 1))
    post_errors=$((post_errors + 1))
  fi

  # ------------------------------------------------------------------
  # 2. Hero image file — file must exist in assets/images/  [ERROR]
  # ------------------------------------------------------------------
  if [[ -n "$image_val" && "$image_val" != *"blog-default.svg"* ]]; then
    image_rel="${image_val#/}"
    image_abs="$REPO_ROOT/$image_rel"
    if [[ ! -f "$image_abs" ]]; then
      echo "❌  $rel — hero image file does not exist: '$image_val'"
      ERRORS=$((ERRORS + 1))
      post_errors=$((post_errors + 1))
    fi
  fi

  # ------------------------------------------------------------------
  # 3. SEO description — present and ≤160 chars  [ERROR]
  # ------------------------------------------------------------------
  desc_val=$(fm_value "$post" "description")
  # Strip surrounding quotes for length check
  desc_clean=$(echo "$desc_val" | sed 's/^["'"'"']//; s/["'"'"']$//')
  if [[ -z "$desc_val" ]]; then
    echo "❌  $rel — missing SEO description"
    ERRORS=$((ERRORS + 1))
    post_errors=$((post_errors + 1))
  else
    desc_len=${#desc_clean}
    if [[ $desc_len -gt 160 ]]; then
      echo "❌  $rel — SEO description too long (${desc_len} chars, max 160)"
      ERRORS=$((ERRORS + 1))
      post_errors=$((post_errors + 1))
    fi
  fi

  # ------------------------------------------------------------------
  # 4. Author — must be "Ouray Viney"  [ERROR]
  # ------------------------------------------------------------------
  author_val=$(fm_value "$post" "author")
  author_clean=$(echo "$author_val" | sed 's/^["'"'"']//; s/["'"'"']$//')
  if [[ "$author_clean" != "Ouray Viney" ]]; then
    echo "❌  $rel — author must be \"Ouray Viney\" (got: '$author_clean')"
    ERRORS=$((ERRORS + 1))
    post_errors=$((post_errors + 1))
  fi

  # ------------------------------------------------------------------
  # 5. Category — each value must be one of 4 valid values  [ERROR]
  # ------------------------------------------------------------------
  cat_val=$(fm_value "$post" "categories")
  # Parse YAML array: ["Quality Engineering", "Test Automation"] → individual items
  # Strip outer brackets, split on '", "' or '","', then validate each.
  cat_inner=$(echo "$cat_val" | sed 's/^\[//; s/\]$//')
  cat_error=false
  while IFS= read -r single_cat; do
    single_cat=$(echo "$single_cat" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//; s/^["'"'"']//; s/["'"'"']$//')
    [[ -z "$single_cat" ]] && continue
    item_valid=false
    for valid in "${VALID_CATEGORIES[@]}"; do
      if [[ "$single_cat" == "$valid" ]]; then
        item_valid=true
        break
      fi
    done
    if [[ "$item_valid" != "true" ]]; then
      echo "❌  $rel — invalid category: '$single_cat'"
      ERRORS=$((ERRORS + 1))
      post_errors=$((post_errors + 1))
      cat_error=true
    fi
  done < <(echo "$cat_inner" | sed 's/", "/\n/g; s/","/\n/g')

  # ------------------------------------------------------------------
  # 6. References — ## References section with ≥3 items  [WARNING]
  # ------------------------------------------------------------------
  body=$(body_content "$post")
  has_refs=$(echo "$body" | grep -c "^## References" || true)
  if [[ $has_refs -eq 0 ]]; then
    echo "⚠️   $rel — missing '## References' section"
    WARNINGS=$((WARNINGS + 1))
    post_warnings=$((post_warnings + 1))
  else
    # Count list items (numbered or bulleted) in the References section
    ref_items=$(awk '/^## References/{found=1; next} found && /^## /{exit} found && /^[0-9]+\.|^- |^\* /' "$post" | wc -l | tr -d ' ')
    if [[ $ref_items -lt 3 ]]; then
      echo "⚠️   $rel — References section has only $ref_items item(s) (minimum 3)"
      WARNINGS=$((WARNINGS + 1))
      post_warnings=$((post_warnings + 1))
    fi
  fi

  # ------------------------------------------------------------------
  # 7. Word count — ≥800 words  [WARNING]
  # ------------------------------------------------------------------
  word_count=$(echo "$body" | wc -w | tr -d ' ')
  if [[ $word_count -lt 800 ]]; then
    echo "⚠️   $rel — under 800 words ($word_count words)"
    WARNINGS=$((WARNINGS + 1))
    post_warnings=$((post_warnings + 1))
  fi

  # ------------------------------------------------------------------
  # 8. H2 subheadings — ≥3  [WARNING]
  # ------------------------------------------------------------------
  h2_count=$(echo "$body" | grep -c "^## " || true)
  if [[ $h2_count -lt 3 ]]; then
    echo "⚠️   $rel — fewer than 3 H2 subheadings ($h2_count found)"
    WARNINGS=$((WARNINGS + 1))
    post_warnings=$((post_warnings + 1))
  fi

  # ------------------------------------------------------------------
  # 9. Data chart — /assets/charts/<slug>.* exists or embedded  [WARNING]
  # ------------------------------------------------------------------
  slug=$(basename "$post" .md | sed 's/^[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}-//')
  chart_file=$(find "$REPO_ROOT/assets/charts" -maxdepth 1 -name "${slug}.*" 2>/dev/null | head -1 || true)
  chart_inline=$(echo "$body" | grep -c "assets/charts/" || true)
  if [[ -z "$chart_file" && "$chart_inline" -eq 0 ]]; then
    echo "⚠️   $rel — no data chart found (assets/charts/${slug}.* or inline reference)"
    WARNINGS=$((WARNINGS + 1))
    post_warnings=$((post_warnings + 1))
  fi

  # ------------------------------------------------------------------
  # 10. Image style — image_alt must not contain bad terms  [WARNING]
  # ------------------------------------------------------------------
  alt_val=$(fm_value "$post" "image_alt")
  alt_lower=$(echo "$alt_val" | tr '[:upper:]' '[:lower:]')
  for term in $(echo "$alt_lower" | grep -oiE 'watercolour|pastel|whimsical' || true); do
    echo "⚠️   $rel — image_alt contains prohibited style term: '$term'"
    WARNINGS=$((WARNINGS + 1))
    post_warnings=$((post_warnings + 1))
  done

  # ------------------------------------------------------------------
  # 11. Published status — no published: false  [ERROR]
  # ------------------------------------------------------------------
  pub_val=$(fm_value "$post" "published")
  if [[ "$pub_val" == "false" ]]; then
    echo "❌  $rel — published: false (unpublished post in _posts/)"
    ERRORS=$((ERRORS + 1))
    post_errors=$((post_errors + 1))
  fi

  # Print pass marker for clean posts
  if [[ $post_errors -eq 0 && $post_warnings -eq 0 ]]; then
    echo "✅  $rel"
  fi
done

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "───────────────────────────────────────────────────"
echo "validate-post-quality: $POST_COUNT post(s) checked"
echo "  Errors:   $ERRORS"
echo "  Warnings: $WARNINGS"
echo "───────────────────────────────────────────────────"

if [[ $ERRORS -gt 0 ]]; then
  echo "RESULT: FAILED — $ERRORS error(s) found."
  exit 1
elif [[ $WARNINGS -gt 0 ]]; then
  echo "RESULT: PASSED with $WARNINGS warning(s) (non-blocking)."
  exit 2
else
  echo "RESULT: PASSED — all checks clean."
  exit 0
fi
