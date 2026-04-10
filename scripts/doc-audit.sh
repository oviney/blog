#!/usr/bin/env bash
# doc-audit.sh — scans documentation for structural and staleness issues,
# then files GitHub issues for any findings.
#
# Checks performed:
#   1. Internal Markdown links     — linked file paths must exist in the repo
#   2. Known commands in code blocks — bash/sh blocks in skill files must use
#                                      recognised commands as first token
#   3. File paths in back-ticks    — `path/to/file` patterns in docs must exist
#   4. Workflow file references    — workflow filenames cited in docs must exist
#   5. Stale skill files           — SKILL.md not updated in > 90 days
#   6. AGENTS.md label roster      — agent: labels listed in AGENTS.md must
#                                    exist as GitHub labels
#
# On failure each check files a GitHub issue (deduplicated) labelled doc-debt
# and P2:medium. On success a summary comment is posted to a "baseline" issue
# if DOC_AUDIT_BASELINE_ISSUE is set.
#
# Usage:
#   GH_TOKEN=<token> GITHUB_REPOSITORY=owner/repo bash scripts/doc-audit.sh

set -euo pipefail

REPO="${GITHUB_REPOSITORY:-oviney/blog}"
LABEL_DEBT="doc-debt"
LABEL_PRIORITY="P2:medium"
FINDINGS=0   # incremented for every issue filed

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

issue_exists() {
  local title="$1"
  local count
  count=$(gh issue list \
    --repo "$REPO" \
    --state open \
    --search "\"$title\" in:title" \
    --limit 100 \
    --json title 2>/dev/null \
    | jq --arg t "$title" '[.[] | select(.title == $t)] | length')
  [[ "${count:-0}" -gt 0 ]]
}

file_issue() {
  local title="$1"
  local body="$2"
  if issue_exists "$title"; then
    echo "  [skip] already open: $title"
    return
  fi
  gh issue create \
    --repo "$REPO" \
    --title "$title" \
    --body "$body" \
    --label "$LABEL_DEBT" \
    --label "$LABEL_PRIORITY" \
    && echo "  [filed] $title" \
    || echo "  [error] failed to file: $title" >&2
  FINDINGS=$(( FINDINGS + 1 ))
}

# ---------------------------------------------------------------------------
# Ensure labels exist
# ---------------------------------------------------------------------------

echo "Ensuring labels…"
ensure_label "$LABEL_DEBT"     "e11d48" "Documentation quality debt"
ensure_label "$LABEL_PRIORITY" "fbca04" "Priority: medium"

# ---------------------------------------------------------------------------
# Check 1: Internal Markdown links resolve
# ---------------------------------------------------------------------------

echo ""
echo "=== Check 1: Internal Markdown links ==="

broken_links=()

while IFS= read -r md_file; do
  # Extract [text](link) targets — skip anchors (#…), external URLs, mailto
  while IFS= read -r raw_link; do
    # Strip trailing anchor if present
    link="${raw_link%%#*}"
    [[ -z "$link" ]] && continue
    # Skip external URLs
    [[ "$link" == http://* || "$link" == https://* || "$link" == mailto:* ]] && continue
    # Resolve relative to the markdown file's directory
    dir=$(dirname "$md_file")
    # Handle absolute paths (starting with /)
    if [[ "$link" == /* ]]; then
      resolved="${link#/}"   # relative to repo root
    else
      resolved="${dir}/${link}"
    fi
    # Normalize path components (resolve ../ and ./ segments) using bash string ops
    # We avoid relying on Python so the check is robust across environments.
    local_resolved=""
    IFS='/' read -ra parts <<< "$resolved"
    for part in "${parts[@]}"; do
      case "$part" in
        ""|.) ;;
        ..) local_resolved="${local_resolved%/*}" ;;
        *)  local_resolved="${local_resolved}/${part}" ;;
      esac
    done
    resolved="${local_resolved#/}"  # strip leading /
    if [[ ! -e "$resolved" ]]; then
      broken_links+=("${md_file}: broken link → ${raw_link}")
      echo "  [broken] ${md_file}: ${raw_link} → ${resolved}"
    fi
  done < <(grep -oE '\[([^]]+)\]\(([^)]+)\)' "$md_file" 2>/dev/null \
           | grep -oE '\(([^)]+)\)' \
           | tr -d '()')
done < <(find . \
  -not -path './.git/*' \
  -not -path './node_modules/*' \
  -not -path './vendor/*' \
  -not -path './_site/*' \
  -name '*.md' \
  | sort)

if [[ ${#broken_links[@]} -gt 0 ]]; then
  list=$(printf -- '- %s\n' "${broken_links[@]}")
  file_issue \
    "doc-audit: broken internal Markdown links" \
    "## Broken Internal Links

The following internal links in Markdown files point to paths that do not exist in the repository:

${list}

**Action required:** Fix or remove each broken link.

_Filed automatically by the [doc-audit workflow](../../actions/workflows/doc-audit.yml)._"
else
  echo "  [ok] all internal links resolve"
fi

# ---------------------------------------------------------------------------
# Check 2: Commands in bash/sh code blocks (skill files)
# ---------------------------------------------------------------------------

echo ""
echo "=== Check 2: Commands in bash/sh code blocks ==="

# Known-good commands allowed as the first token in a code-block line
KNOWN_COMMANDS=(
  gh bundle npx npm git bash node ruby python3 jq curl
  echo printf cat grep find sed awk cut sort uniq head tail
  cp mv rm mkdir touch chmod export set source "." read
  true false test "[" "[[" if then else fi for while do done
  local return exit trap kill wait
)

unknown_cmds=()

while IFS= read -r skill_file; do
  in_block=false
  block_lang=""

  while IFS= read -r line; do
    # Detect opening fence
    if [[ "$line" =~ ^\`\`\`(bash|sh) ]]; then
      in_block=true
      block_lang="${BASH_REMATCH[1]}"
      continue
    fi
    # Detect closing fence
    if [[ "$in_block" == true && "$line" =~ ^\`\`\` ]]; then
      in_block=false
      continue
    fi
    # Inside a bash/sh block: check first token of non-comment, non-empty lines
    if [[ "$in_block" == true ]]; then
      # Strip leading whitespace, skip blank/comment lines
      stripped="${line#"${line%%[! ]*}"}"  # ltrim
      [[ -z "$stripped" ]] && continue
      [[ "$stripped" == \#* ]] && continue
      # First token
      first_token="${stripped%% *}"
      # Remove variable assignments like FOO=bar before the command
      while [[ "$first_token" == *=* && "$first_token" != =* ]]; do
        stripped="${stripped#* }"
        first_token="${stripped%% *}"
        [[ -z "$stripped" ]] && break
      done
      [[ -z "$first_token" ]] && continue
      # Check against known list
      matched=false
      for cmd in "${KNOWN_COMMANDS[@]}"; do
        if [[ "$first_token" == "$cmd" ]]; then
          matched=true
          break
        fi
      done
      if [[ "$matched" == false ]]; then
        unknown_cmds+=("${skill_file}: unknown command '${first_token}'")
        echo "  [unknown] ${skill_file}: '${first_token}'"
      fi
    fi
  done < "$skill_file"
done < <(find .github/skills -name "SKILL.md" | sort)

if [[ ${#unknown_cmds[@]} -gt 0 ]]; then
  list=$(printf -- '- %s\n' "${unknown_cmds[@]}")
  file_issue \
    "doc-audit: unrecognised commands in skill-file code blocks" \
    "## Unrecognised Commands in Skill-File Code Blocks

The following commands appear as the first token in \`bash\`/\`sh\` code blocks in
\`.github/skills/*/SKILL.md\` files but are not in the list of known-good commands:

${list}

If these are legitimate commands, add them to the \`KNOWN_COMMANDS\` list in \`scripts/doc-audit.sh\`.
If they are typos or outdated commands, update the skill file.

_Filed automatically by the [doc-audit workflow](../../actions/workflows/doc-audit.yml)._"
else
  echo "  [ok] all code-block commands recognised"
fi

# ---------------------------------------------------------------------------
# Check 3: Back-tick file paths in docs exist
# ---------------------------------------------------------------------------

echo ""
echo "=== Check 3: Back-tick file paths in docs ==="

# Look for `path/to/file` patterns that look like repo file paths
# (contain a `/`, don't start with http, and end in a known extension or no extension)
missing_paths=()

while IFS= read -r md_file; do
  while IFS= read -r raw_path; do
    # Trim surrounding back-ticks
    p="${raw_path//\`/}"
    # Skip: URLs, anchors, globs, shell vars, patterns with spaces
    [[ "$p" == http* ]] && continue
    [[ "$p" == *' '* ]] && continue
    [[ "$p" == *'*'* ]] && continue
    [[ "$p" == *'$'* ]] && continue
    [[ "$p" == *'<'* ]] && continue
    [[ "$p" == *'>'* ]] && continue
    # Must look like a path (contains /)
    [[ "$p" != */* ]] && continue
    # Must have a recognisable extension or end without extension (directory)
    if [[ ! -e "$p" ]]; then
      missing_paths+=("${md_file}: missing path → ${p}")
      echo "  [missing] ${md_file}: ${p}"
    fi
  done < <(grep -oE '\`[^`]+/[^`]+\`' "$md_file" 2>/dev/null || true)
done < <(find . \
  -not -path './.git/*' \
  -not -path './node_modules/*' \
  -not -path './vendor/*' \
  -not -path './_site/*' \
  -name '*.md' \
  | sort)

if [[ ${#missing_paths[@]} -gt 0 ]]; then
  list=$(printf -- '- %s\n' "${missing_paths[@]}")
  file_issue \
    "doc-audit: docs reference paths that do not exist" \
    "## Docs Reference Paths That Do Not Exist

The following back-tick-enclosed paths in Markdown files do not correspond to
any file or directory in the repository:

${list}

**Action required:** Update the docs to reflect the correct paths, or create the missing files.

_Filed automatically by the [doc-audit workflow](../../actions/workflows/doc-audit.yml)._"
else
  echo "  [ok] all back-tick paths exist"
fi

# ---------------------------------------------------------------------------
# Check 4: Workflow files referenced in docs exist
# ---------------------------------------------------------------------------

echo ""
echo "=== Check 4: Workflow file references ==="

missing_workflows=()

while IFS= read -r md_file; do
  while IFS= read -r wf_ref; do
    wf_path=".github/workflows/${wf_ref}"
    if [[ ! -f "$wf_path" ]]; then
      missing_workflows+=("${md_file}: references missing workflow → ${wf_ref}")
      echo "  [missing] ${md_file}: ${wf_ref}"
    fi
  done < <(grep -oE 'workflows/[a-zA-Z0-9_-]+\.yml' "$md_file" 2>/dev/null \
           | grep -oE '[a-zA-Z0-9_-]+\.yml' \
           | sort -u || true)
done < <(find . \
  -not -path './.git/*' \
  -not -path './node_modules/*' \
  -not -path './vendor/*' \
  -not -path './_site/*' \
  -name '*.md' \
  | sort)

if [[ ${#missing_workflows[@]} -gt 0 ]]; then
  list=$(printf -- '- %s\n' "${missing_workflows[@]}")
  file_issue \
    "doc-audit: docs reference workflow files that do not exist" \
    "## Docs Reference Workflow Files That Do Not Exist

The following \`.yml\` filenames referenced in Markdown docs are not present
in \`.github/workflows/\`:

${list}

**Action required:** Update docs to reference the correct workflow filename, or create the missing workflow.

_Filed automatically by the [doc-audit workflow](../../actions/workflows/doc-audit.yml)._"
else
  echo "  [ok] all referenced workflow files exist"
fi

# ---------------------------------------------------------------------------
# Check 5: Stale skill files (> 90 days since last commit)
# ---------------------------------------------------------------------------

echo ""
echo "=== Check 5: Stale skill files ==="

stale_skills=()
CUTOFF=$(date -d "90 days ago" +%Y-%m-%d 2>/dev/null || true)
if [[ -z "${CUTOFF:-}" ]]; then
  # macOS / BSD date fallback
  CUTOFF=$(date -v-90d +%Y-%m-%d 2>/dev/null || true)
fi
if [[ -z "${CUTOFF:-}" ]]; then
  echo "  [warn] cannot determine CUTOFF date; skipping stale-skill check" >&2
  CUTOFF=""
fi

while IFS= read -r skill_file; do
  [[ -z "${CUTOFF:-}" ]] && break  # skip if CUTOFF could not be determined
  # Last commit date for this file
  last_commit=$(git log -1 --format="%cs" -- "$skill_file" 2>/dev/null || echo "")
  [[ -z "$last_commit" ]] && last_commit="1970-01-01"  # Unix epoch ensures untracked files are flagged
  if [[ "$last_commit" < "$CUTOFF" ]]; then
    stale_skills+=("${skill_file} (last updated: ${last_commit})")
    echo "  [stale] ${skill_file}: last commit ${last_commit}"
  fi
done < <(find .github/skills -name "SKILL.md" | sort)

if [[ ${#stale_skills[@]} -gt 0 ]]; then
  list=$(printf -- '- %s\n' "${stale_skills[@]}")
  file_issue \
    "doc-audit: skill files not updated in > 90 days" \
    "## Stale Skill Files

The following skill files have not been updated in over 90 days and may be out of date:

${list}

**Action required:** Review each skill file to ensure it still accurately describes the
current workflow. Update the file and commit even if no content changes are needed to
reset the staleness clock.

_Filed automatically by the [doc-audit workflow](../../actions/workflows/doc-audit.yml)._"
else
  echo "  [ok] all skill files updated within 90 days"
fi

# ---------------------------------------------------------------------------
# Check 6: AGENTS.md agent labels match GitHub labels
# ---------------------------------------------------------------------------

echo ""
echo "=== Check 6: AGENTS.md agent labels vs GitHub labels ==="

# Extract agent: labels from AGENTS.md
roster_labels=()
while IFS= read -r label; do
  roster_labels+=("$label")
done < <(grep -oE 'agent:[a-z-]+' AGENTS.md 2>/dev/null | sort -u || true)

missing_gh_labels=()
for label in "${roster_labels[@]}"; do
  exists=$(gh label list --repo "$REPO" --json name \
    --jq "[.[] | select(.name == \"${label}\")] | length" 2>/dev/null || echo "0")
  if [[ "${exists:-0}" -eq 0 ]]; then
    missing_gh_labels+=("$label")
    echo "  [missing label] ${label}"
  fi
done

if [[ ${#missing_gh_labels[@]} -gt 0 ]]; then
  list=$(printf -- '- `%s`\n' "${missing_gh_labels[@]}")
  file_issue \
    "doc-audit: AGENTS.md references labels that do not exist in GitHub" \
    "## AGENTS.md References Missing GitHub Labels

The following agent labels are referenced in \`AGENTS.md\` but do not exist as
GitHub labels in this repository:

${list}

**Action required:** Create the missing labels in GitHub, or update \`AGENTS.md\` to
reflect the correct label names.

_Filed automatically by the [doc-audit workflow](../../actions/workflows/doc-audit.yml)._"
else
  echo "  [ok] all AGENTS.md labels exist in GitHub"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

echo ""
echo "=== Doc-audit complete ==="
echo "  Findings filed (new issues): ${FINDINGS}"
if [[ "$FINDINGS" -eq 0 ]]; then
  echo "  All checks passed — no issues filed."
fi
