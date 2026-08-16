#!/usr/bin/env bash
# validate-post-quality.sh — editorial quality gate for _posts/ and _review/
#
# Validates every _posts/*.md and _review/*.md file against the
# Economist-inspired quality baseline.  Each check is classified as either
# ERROR (blocks merge) or WARNING (non-blocking, informational).
#
# Drafts are held to the same bar as published posts because they are promoted
# verbatim — a defect written at draft time is a defect on `main` the moment
# the draft is published, and by then it blocks every open PR.
#
# Usage:
#   bash scripts/validate-post-quality.sh          # validate posts and drafts
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

PROMPT_ALT_PATTERN='editorial illustration|editorial photomontage|photorealistic|technical diagram|infographic|blueprint|cartoon|risograph|duotone|monochrome|palette|lighting|texture|crosshatching|newspaper engraving|block-print|rendered|style'

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

# `_review/` is checked alongside `_posts/`, not after it. Drafts there carry
# the same front matter as a published post and are promoted into `_posts/`
# verbatim, so a metadata defect written at draft time survives the promotion
# untouched. That is not hypothetical: 9fe0922 published a draft whose
# `image_alt` was the image *prompt*, turning `main` red on the editorial gate
# and blocking every open PR until #1285. Checking only `_posts/` meant the
# gate could not fail until the defect was already on `main`.
#
# The directory is optional — it is empty whenever no draft is awaiting a
# publish decision.
POSTS=$(find "$REPO_ROOT/_posts" "$REPO_ROOT/_review" -maxdepth 1 \
  \( -name "*.md" -o -name "*.markdown" \) 2>/dev/null | sort)

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
  image_abs=""

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
  # 3. Hero metadata — alt text + caption required and reader-facing  [ERROR]
  # ------------------------------------------------------------------
  alt_val=$(fm_value "$post" "image_alt")
  alt_clean=$(echo "$alt_val" | sed 's/^["'"'"']//; s/["'"'"']$//')
  alt_lower=$(echo "$alt_clean" | tr '[:upper:]' '[:lower:]')
  if [[ -z "$alt_clean" ]]; then
    echo "❌  $rel — missing image_alt"
    ERRORS=$((ERRORS + 1))
    post_errors=$((post_errors + 1))
  elif echo "$alt_lower" | grep -Eq "$PROMPT_ALT_PATTERN"; then
    echo "❌  $rel — image_alt reads like prompt/style text, not accessible alt text"
    ERRORS=$((ERRORS + 1))
    post_errors=$((post_errors + 1))
  fi

  caption_val=$(fm_value "$post" "image_caption")
  caption_clean=$(echo "$caption_val" | sed 's/^["'"'"']//; s/["'"'"']$//')
  caption_lower=$(echo "$caption_clean" | tr '[:upper:]' '[:lower:]')
  if [[ -z "$caption_clean" ]]; then
    echo "❌  $rel — missing image_caption"
    ERRORS=$((ERRORS + 1))
    post_errors=$((post_errors + 1))
  elif [[ "$caption_lower" =~ ^(illustration|photo|chart)$ ]]; then
    echo "❌  $rel — image_caption is too generic"
    ERRORS=$((ERRORS + 1))
    post_errors=$((post_errors + 1))
  fi

  # ------------------------------------------------------------------
  # 3b. image_caption length — credit budget (~40 chars)  [WARNING]
  #
  # _layouts/post.html renders `figcaption.image-credit` from image_caption
  # (upcased). A hero credit should read like a short attribution, not a
  # full letter-spaced ALL-CAPS sentence that wraps over several mobile lines
  # (visual-audit defect #11). Soft-flag anything past a ~40-char credit
  # budget so long descriptive captions get trimmed toward a real credit.
  # ------------------------------------------------------------------
  if [[ -n "$caption_clean" ]]; then
    caption_len=${#caption_clean}
    if [[ $caption_len -gt 40 ]]; then
      echo "⚠️   $rel — image_caption is ${caption_len} chars (credit budget ~40); trim to a short attribution"
      WARNINGS=$((WARNINGS + 1))
      post_warnings=$((post_warnings + 1))
    fi
  fi

  if [[ -n "${image_abs:-}" && -f "${image_abs:-}" && "$image_abs" == *.svg ]]; then
    if grep -qi '<text[[:space:]>]' "$image_abs"; then
      echo "❌  $rel — SVG hero contains embedded text"
      ERRORS=$((ERRORS + 1))
      post_errors=$((post_errors + 1))
    fi
  fi

  # ------------------------------------------------------------------
  # 4. SEO description — present and ≤160 chars  [ERROR]
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
  # 4b. Chart-"Source:" opener without a description override  [ERROR]
  #
  # Root cause of visual-audit defect #4/#5: a post body that opens with a
  # markdown image immediately followed by an italic `*Source: …*` credit,
  # before any prose paragraph. When such a post has no front-matter
  # `description`, Jekyll's AUTO excerpt begins with "Source:", so every
  # teaser card for it reads "Source: …" instead of a lede. A `description`
  # overrides the auto-excerpt and neutralises the defect — so reject the
  # opener only when there is nothing to override it.
  # ------------------------------------------------------------------
  first_body_line=$(body_content "$post" | grep -m1 '[^[:space:]]' || true)
  second_body_line=$(body_content "$post" | grep '[^[:space:]]' | sed -n '2p' || true)
  if [[ "$first_body_line" == '!['* ]] \
     && echo "$second_body_line" | grep -Eqi '^\*[[:space:]]*source:' \
     && [[ -z "$desc_clean" ]]; then
    echo "❌  $rel — body opens with an image + '*Source:*' credit and has no description to override the auto-excerpt (teaser would lead with \"Source:\")"
    ERRORS=$((ERRORS + 1))
    post_errors=$((post_errors + 1))
  fi

  # ------------------------------------------------------------------
  # 5. Author — must be "Ouray Viney"  [ERROR]
  # ------------------------------------------------------------------
  author_val=$(fm_value "$post" "author")
  author_clean=$(echo "$author_val" | sed 's/^["'"'"']//; s/["'"'"']$//')
  if [[ "$author_clean" != "Ouray Viney" ]]; then
    echo "❌  $rel — author must be \"Ouray Viney\" (got: '$author_clean')"
    ERRORS=$((ERRORS + 1))
    post_errors=$((post_errors + 1))
  fi

  # ------------------------------------------------------------------
  # 6. Category — each value must be one of 4 valid values  [ERROR]
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
  # 7. References — ## References section with ≥3 items  [WARNING]
  # ------------------------------------------------------------------
  body=$(body_content "$post")
  has_refs=$(echo "$body" | grep -c "^## References" || true)
  if echo "$body" | grep -Eq '[^[:space:]][[:space:]]##[[:space:]]'; then
    echo "❌  $rel — heading markers are embedded inside paragraph text"
    ERRORS=$((ERRORS + 1))
    post_errors=$((post_errors + 1))
  fi
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
  # 8. Word count — ≥800 words  [WARNING]
  # ------------------------------------------------------------------
  word_count=$(echo "$body" | wc -w | tr -d ' ')
  if [[ $word_count -lt 800 ]]; then
    echo "⚠️   $rel — under 800 words ($word_count words)"
    WARNINGS=$((WARNINGS + 1))
    post_warnings=$((post_warnings + 1))
  fi

  # ------------------------------------------------------------------
  # 9. H2 subheadings — ≥3  [WARNING]
  # ------------------------------------------------------------------
  h2_count=$(echo "$body" | grep -c "^## " || true)
  if [[ $h2_count -lt 3 ]]; then
    echo "⚠️   $rel — fewer than 3 H2 subheadings ($h2_count found)"
    WARNINGS=$((WARNINGS + 1))
    post_warnings=$((post_warnings + 1))
  fi

  # ------------------------------------------------------------------
  # 10. Data chart — /assets/charts/<slug>.* exists or embedded  [WARNING]
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
  # 11. Published status — no published: false  [ERROR]
  # ------------------------------------------------------------------
  # Scoped to `_posts/` deliberately. A `_review/` draft is *supposed* to be
  # unpublished, so `published: false` there is correct rather than a defect.
  pub_val=$(fm_value "$post" "published")
  if [[ "$rel" == _posts/* && "$pub_val" == "false" ]]; then
    echo "❌  $rel — published: false (unpublished post in _posts/)"
    ERRORS=$((ERRORS + 1))
    post_errors=$((post_errors + 1))
  fi

  # ------------------------------------------------------------------
  # 12. Subtitle — present and length-bounded  [ERROR / WARNING]
  #
  # The site's templates (_layouts/post.html, index.md) render
  # `<h2 class="article-subtitle">{{ page.subtitle }}</h2>` and the
  # homepage hero subtitle when this field is present. Every post must
  # carry an Economist-style standfirst here: declarative, 20-28 words
  # target, soft cap 40 (warn), hard cap 60 (error). See issue #951
  # and SPEC §6 (in tasks/archive/<sweep-date>-…/SPEC.md after merge)
  # for style guidance.
  # ------------------------------------------------------------------
  subtitle_val=$(fm_value "$post" "subtitle")
  subtitle_clean=$(echo "$subtitle_val" | sed 's/^["'"'"']//; s/["'"'"']$//')
  if [[ -z "$subtitle_val" ]]; then
    echo "❌  $rel — missing required front-matter: subtitle"
    ERRORS=$((ERRORS + 1))
    post_errors=$((post_errors + 1))
  else
    subtitle_words=$(echo "$subtitle_clean" | wc -w | tr -d ' ')
    if [[ $subtitle_words -gt 60 ]]; then
      echo "❌  $rel — subtitle exceeds 60 words (${subtitle_words} words, hard cap 60)"
      ERRORS=$((ERRORS + 1))
      post_errors=$((post_errors + 1))
    elif [[ $subtitle_words -gt 40 ]]; then
      echo "⚠️   $rel — subtitle exceeds soft cap (${subtitle_words} words, soft cap 40)"
      WARNINGS=$((WARNINGS + 1))
      post_warnings=$((post_warnings + 1))
    fi
  fi

  # ------------------------------------------------------------------
  # 15. URL slug policy — length + truncation signals
  #     [ERROR > 60 chars, WARNING >= 55 chars or double-hyphen]
  #     The slug is the post filename minus the YYYY-MM-DD- date prefix and
  #     extension (permalink is /:year/:month/:day/:title/). Existing indexed
  #     URLs are immutable — there is no jekyll-redirect-from — so this gate
  #     guards NEW slugs against the truncation that produced the legacy
  #     60-char slugs. See docs/URL_SLUG_POLICY.md.
  # ------------------------------------------------------------------
  slug="$(basename "$post")"
  slug="${slug%.*}"                                              # strip extension
  slug="${slug#[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]-}"     # strip date prefix
  slug_len=${#slug}
  if [[ $slug_len -gt 60 ]]; then
    echo "❌  $rel — slug is ${slug_len} chars (hard cap 60); shorten to a concise, complete phrase (docs/URL_SLUG_POLICY.md)"
    ERRORS=$((ERRORS + 1))
    post_errors=$((post_errors + 1))
  elif [[ $slug_len -ge 55 ]]; then
    echo "⚠️   $rel — slug is ${slug_len} chars (truncation-prone, soft cap 55); verify it is a complete phrase, not cut mid-word"
    WARNINGS=$((WARNINGS + 1))
    post_warnings=$((post_warnings + 1))
  fi
  if [[ "$slug" == *--* ]]; then
    echo "⚠️   $rel — slug contains a double hyphen ('--'); use single hyphens between words"
    WARNINGS=$((WARNINGS + 1))
    post_warnings=$((post_warnings + 1))
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
