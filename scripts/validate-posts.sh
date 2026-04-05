#!/usr/bin/env bash
# validate-posts.sh — Jekyll post front-matter validator
#
# Usage:
#   scripts/validate-posts.sh                # validates staged posts (pre-commit mode)
#   scripts/validate-posts.sh --all          # validates every post in _posts/
#   scripts/validate-posts.sh <file> ...     # validates specific files
#
# Exit codes:
#   0 — all posts passed (warnings are non-fatal)
#   1 — one or more posts have critical errors

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"

VALID_CATEGORIES=("Quality Engineering" "Software Engineering" "Test Automation" "Security")

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RESET='\033[0m'

ERRORS=0
WARNINGS=0

# ── Helper: print a styled message ────────────────────────────────────────────

error()   { echo -e "${RED}  ✖ ERROR${RESET}   $*" >&2; }
warn()    { echo -e "${YELLOW}  ⚠ WARNING${RESET} $*"; }
success() { echo -e "${GREEN}  ✔${RESET} $*"; }

# ── Helper: extract a YAML scalar value from front matter ─────────────────────
# extract_field <frontmatter> <key>
# Returns the raw value (quotes stripped, leading/trailing whitespace removed).

extract_field() {
  local fm="$1"
  local key="$2"
  # Use grep || true to avoid non-zero exit when key is absent
  echo "$fm" \
    | { grep -E "^${key}:" || true; } \
    | head -1 \
    | sed -E "s/^${key}:[[:space:]]*//" \
    | sed -E 's/^"(.*)"$/\1/' \
    | sed -E "s/^'(.*)'$/\1/" \
    | sed -E 's/^[[:space:]]*//;s/[[:space:]]*$//'
}

# ── Helper: extract front matter block from a file ───────────────────────────
# Returns everything between the first and second "---" lines.

extract_frontmatter() {
  awk 'BEGIN{found=0} /^---$/{if(found==0){found=1;next}else{exit}} found{print}' "$1"
}

# ── Helper: check if a category value is valid ───────────────────────────────
# Linear search over a small static list (4 valid categories); acceptable here.

is_valid_category() {
  local cat="$1"
  for valid in "${VALID_CATEGORIES[@]}"; do
    [[ "$cat" == "$valid" ]] && return 0
  done
  return 1
}

# ── Validate a single post file ───────────────────────────────────────────────

validate_post() {
  local file="$1"
  local rel_file="${file#"$REPO_ROOT/"}"
  local file_errors=0
  local file_warnings=0

  echo ""
  echo "Checking: $rel_file"

  # Check the file starts with a YAML front matter block
  local first_line
  first_line=$(head -1 "$file")
  if [[ "$first_line" != "---" ]]; then
    error "$rel_file: missing front matter (file must start with ---)"
    (( ERRORS++ )) || true
    return
  fi

  local fm
  fm=$(extract_frontmatter "$file")

  # ── Required fields ──────────────────────────────────────────────────────────

  local title date author categories image description

  title=$(extract_field "$fm" "title")
  date=$(extract_field "$fm" "date")
  author=$(extract_field "$fm" "author")
  categories=$(extract_field "$fm" "categories")
  image=$(extract_field "$fm" "image")
  description=$(extract_field "$fm" "description")

  # categories may be in block YAML style (value on next lines); detect the key
  local has_categories_key=false
  if echo "$fm" | grep -qE "^categories:"; then
    has_categories_key=true
  fi

  local missing_fields=()
  [[ -z "$title"       ]] && missing_fields+=("title")
  [[ -z "$date"        ]] && missing_fields+=("date")
  [[ -z "$author"      ]] && missing_fields+=("author")
  [[ "$has_categories_key" == "false" ]] && missing_fields+=("categories")
  [[ -z "$image"       ]] && missing_fields+=("image")
  [[ -z "$description" ]] && missing_fields+=("description")

  if [[ ${#missing_fields[@]} -gt 0 ]]; then
    error "$rel_file: missing required front-matter fields: ${missing_fields[*]}"
    (( ERRORS++ )) || true
    (( file_errors++ )) || true
  fi

  # ── Image file existence ──────────────────────────────────────────────────────
  # Only check if image field is present and looks like an /assets/ path.

  if [[ -n "$image" && "$image" == /assets/* ]]; then
    local image_path="$REPO_ROOT$image"
    local base="${image_path%.*}"

    if [[ ! -f "$image_path" ]]; then
      # Try alternate extension (png ↔ webp)
      local alt_ext
      if [[ "$image_path" == *.png ]]; then
        alt_ext="${base}.webp"
      elif [[ "$image_path" == *.webp ]]; then
        alt_ext="${base}.png"
      else
        alt_ext=""
      fi

      if [[ -n "$alt_ext" && -f "$alt_ext" ]]; then
        warn "$rel_file: image '$image' not found, but '${alt_ext#"$REPO_ROOT/"}' exists — consider updating the path"
        (( WARNINGS++ )) || true
        (( file_warnings++ )) || true
      else
        error "$rel_file: image file not found: $image"
        (( ERRORS++ )) || true
        (( file_errors++ )) || true
      fi
    fi
  elif [[ -n "$image" && "$image" != /assets/* ]]; then
    warn "$rel_file: image path '$image' does not start with /assets/ — verify it is correct"
    (( WARNINGS++ )) || true
    (( file_warnings++ )) || true
  fi

  # ── Category validation ───────────────────────────────────────────────────────
  # The `categories` variable holds the raw YAML value, which is one of:
  #   Inline array:  ["Quality Engineering", "Test Automation"]
  #   Block list:    categories:\n  - Quality Engineering\n  - Test Automation
  # We normalise to a newline-separated list of category strings.

  if [[ "$has_categories_key" == "true" ]]; then
    local cats_line

    if echo "$categories" | grep -q '^\['; then
      # ── Inline array: categories: ["Quality Engineering", "Test Automation"]
      # Strip brackets and quotes, then split on commas.
      cats_line=$(echo "$categories" | tr -d '[]"' | tr ',' '\n' | \
        sed -E 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//' | sed '/^$/d')
    else
      # ── Block / YAML list:
      #   categories:
      #     - Quality Engineering
      #     - Test Automation
      # Grab up to 10 lines after the `categories:` key, extract `- item` lines.
      # The -A 10 limit is sufficient for any realistic post; blogs rarely have
      # more than a handful of categories.
      cats_line=$(echo "$fm" | { grep -A 10 "^categories:" || true; } | \
        tail -n +2 | \
        awk '/^[[:space:]]*-[[:space:]]/{gsub(/^[[:space:]]*-[[:space:]]*/,""); print; next} /^[a-z]/{exit}' | \
        sed -E 's/^[[:space:]]*//;s/[[:space:]]*$//' | sed '/^$/d')
    fi

    local invalid_cats=()
    while IFS= read -r cat; do
      cat=$(echo "$cat" | sed -E 's/^[[:space:]]*//;s/[[:space:]]*$//')
      [[ -z "$cat" ]] && continue
      if ! is_valid_category "$cat"; then
        invalid_cats+=("$cat")
      fi
    done <<< "$cats_line"

    if [[ ${#invalid_cats[@]} -gt 0 ]]; then
      error "$rel_file: invalid categories: ${invalid_cats[*]}"
      echo "         Valid categories: ${VALID_CATEGORIES[*]}"
      (( ERRORS++ )) || true
      (( file_errors++ )) || true
    fi
  fi

  # ── Title length ──────────────────────────────────────────────────────────────

  if [[ -n "$title" ]]; then
    local title_len=${#title}
    if (( title_len > 60 )); then
      warn "$rel_file: title is ${title_len} chars (recommended ≤ 60 for SEO)"
      (( WARNINGS++ )) || true
      (( file_warnings++ )) || true
    fi
  fi

  # ── Description length ────────────────────────────────────────────────────────

  if [[ -n "$description" ]]; then
    local desc_len=${#description}
    if (( desc_len > 160 )); then
      warn "$rel_file: description is ${desc_len} chars (recommended ≤ 160 for SEO)"
      (( WARNINGS++ )) || true
      (( file_warnings++ )) || true
    fi
  fi

  # ── Per-file summary ─────────────────────────────────────────────────────────

  if (( file_errors == 0 && file_warnings == 0 )); then
    success "$rel_file"
  fi
}

# ── Collect files to validate ─────────────────────────────────────────────────

FILES=()

if [[ $# -eq 0 ]]; then
  # Default: only validate posts staged for this commit
  while IFS= read -r f; do
    [[ -n "$f" ]] && FILES+=("$REPO_ROOT/$f")
  done < <(git -C "$REPO_ROOT" diff --cached --name-only --diff-filter=ACMR | { grep "^_posts/.*\.md$" || true; })

elif [[ "$1" == "--all" ]]; then
  while IFS= read -r f; do
    FILES+=("$f")
  done < <(find "$REPO_ROOT/_posts" -name "*.md" | sort)

else
  for arg in "$@"; do
    if [[ -f "$arg" ]]; then
      FILES+=("$arg")
    else
      error "file not found: $arg" >&2
      (( ERRORS++ )) || true
    fi
  done
fi

if [[ ${#FILES[@]} -eq 0 ]]; then
  # Still exit 1 if any file args were not found
  (( ERRORS > 0 )) && exit 1 || exit 0
fi

# ── Run validation ────────────────────────────────────────────────────────────

echo ""
echo "═══════════════════════════════════════════════════"
echo " Jekyll post validation"
echo "═══════════════════════════════════════════════════"

for file in "${FILES[@]}"; do
  validate_post "$file"
done

# ── Final summary ─────────────────────────────────────────────────────────────

echo ""
echo "═══════════════════════════════════════════════════"
if (( ERRORS > 0 )); then
  echo -e "${RED}Result: ${ERRORS} error(s), ${WARNINGS} warning(s) — commit blocked${RESET}"
  echo ""
  echo "Fix the errors above, then re-run 'git commit'."
  echo "═══════════════════════════════════════════════════"
  exit 1
else
  echo -e "${GREEN}Result: 0 errors, ${WARNINGS} warning(s) — OK${RESET}"
  echo "═══════════════════════════════════════════════════"
  exit 0
fi
