#!/usr/bin/env bash
# validate-posts.sh — editorial quality gate for _posts/
#
# Usage:
#   bash scripts/validate-posts.sh          # validate staged/changed files only
#   bash scripts/validate-posts.sh --all    # validate all posts in _posts/
#
# Checks per post:
#   1. Required front-matter fields are present: layout, title, date, author,
#      categories, image
#   2. The image: path resolves to a real file under assets/images/
#   3. The date: value is not in the future
#
# Exit codes: 0 = all posts valid, 1 = one or more violations found.

set -euo pipefail

ERRORS=0
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TODAY=$(date -u +%Y-%m-%d)

# ---------------------------------------------------------------------------
# Determine which files to check.
# ---------------------------------------------------------------------------
if [[ "${1:-}" == "--all" ]]; then
  POSTS=$(find "$REPO_ROOT/_posts" -maxdepth 1 \( -name "*.md" -o -name "*.markdown" \) | sort)
else
  # Default: every *.md / *.markdown file under _posts/ that is tracked or
  # staged; fall back to --all when the working tree has no changes (e.g.
  # when running in CI against a fresh checkout).
  STAGED=$(git -C "$REPO_ROOT" diff --name-only --cached HEAD 2>/dev/null || true)
  UNSTAGED=$(git -C "$REPO_ROOT" diff --name-only HEAD 2>/dev/null || true)
  CHANGED=$(printf '%s\n%s\n' "$STAGED" "$UNSTAGED" | grep -E '^_posts/.*\.(md|markdown)$' | sort -u || true)

  if [[ -z "$CHANGED" ]]; then
    # No posts changed — validate everything so CI always has work to do.
    POSTS=$(find "$REPO_ROOT/_posts" -maxdepth 1 \( -name "*.md" -o -name "*.markdown" \) | sort)
  else
    # Convert relative paths to absolute.
    POSTS=$(echo "$CHANGED" | sed "s|^|$REPO_ROOT/|")
  fi
fi

if [[ -z "$POSTS" ]]; then
  echo "validate-posts: no posts to validate."
  exit 0
fi

POST_COUNT=$(echo "$POSTS" | wc -l | tr -d ' ')
echo "validate-posts: checking $POST_COUNT post(s)..."
echo ""

# ---------------------------------------------------------------------------
# Helper: extract a scalar front-matter value for a given key.
# Returns the raw value (without the "key:" prefix), or an empty string.
# ---------------------------------------------------------------------------
fm_value() {
  local file="$1" key="$2"
  # Grab only the front-matter block (between the two --- fences).
  # grep returns exit 1 when there is no match; suppress that so set -e
  # does not abort the script when a field is simply absent.
  awk '/^---/{n++; if(n==2) exit} n==1' "$file" \
    | grep -E "^${key}:" \
    | head -1 \
    | sed "s/^${key}:[[:space:]]*//" \
    || true
}

# ---------------------------------------------------------------------------
# Validate each post.
# ---------------------------------------------------------------------------
for post in $POSTS; do
  [[ -f "$post" ]] || continue
  rel="${post#$REPO_ROOT/}"
  post_errors=0

  # -- 1. Ensure the file actually has front matter -------------------------
  if ! head -1 "$post" | grep -q "^---$"; then
    echo "❌  $rel — missing front-matter opening fence (---)"
    ERRORS=$((ERRORS + 1))
    continue
  fi

  # -- 2. Required fields ---------------------------------------------------
  for field in layout title date author categories image; do
    val=$(fm_value "$post" "$field")
    if [[ -z "$val" ]]; then
      echo "❌  $rel — missing required front-matter field: '$field'"
      ERRORS=$((ERRORS + 1))
      post_errors=$((post_errors + 1))
    fi
  done

  # -- 3. Image path must resolve to a real file ----------------------------
  image_val=$(fm_value "$post" "image")
  if [[ -n "$image_val" ]]; then
    # Strip leading slash so we can build an absolute path.
    image_rel="${image_val#/}"
    image_abs="$REPO_ROOT/$image_rel"
    if [[ ! -f "$image_abs" ]]; then
      echo "❌  $rel — image path does not exist: '$image_val'"
      ERRORS=$((ERRORS + 1))
      post_errors=$((post_errors + 1))
    fi
  fi

  # -- 4. Date must not be in the future ------------------------------------
  date_val=$(fm_value "$post" "date")
  if [[ -n "$date_val" ]]; then
    # Normalise: keep only the YYYY-MM-DD portion (front matter may include
    # a timestamp, e.g.  2025-03-15 00:00:00 +0000).
    post_date="${date_val:0:10}"
    # Validate it looks like a date before comparing.
    if [[ "$post_date" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
      # Lexicographic comparison is valid for ISO 8601 YYYY-MM-DD strings
      # because the fixed-width zero-padded format preserves chronological order.
      if [[ "$post_date" > "$TODAY" ]]; then
        echo "❌  $rel — future date detected: '$post_date' (today is $TODAY)"
        ERRORS=$((ERRORS + 1))
        post_errors=$((post_errors + 1))
      fi
    else
      echo "❌  $rel — date field has unexpected format: '$date_val'"
      ERRORS=$((ERRORS + 1))
      post_errors=$((post_errors + 1))
    fi
  fi

  if [[ $post_errors -eq 0 ]]; then
    echo "✅  $rel"
  fi
done

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
if [[ $ERRORS -eq 0 ]]; then
  echo "validate-posts: PASSED — all posts valid."
  exit 0
else
  echo "validate-posts: FAILED — $ERRORS error(s) found. Fix them before merging."
  exit 1
fi
