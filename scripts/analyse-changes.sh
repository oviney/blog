#!/usr/bin/env bash
# analyse-changes.sh — Smart Test Selector for Quality Intelligence System
#
# Usage:
#   bash scripts/analyse-changes.sh <BASE_SHA> <HEAD_SHA>
#
# Outputs a JSON test plan to stdout:
#   {
#     "run_type": "partial",
#     "groups": ["content", "links"],
#     "skipped": ["visual", "performance", "security"],
#     "skip_reason": "Only _posts/** changed",
#     "force_full": false
#   }
#
# Special values:
#   BASE_SHA = "0000000000000000000000000000000000000000"  → new branch; default full run
#   HEAD_SHA = "nightly" | ""                              → full suite
#   FORCE_FULL env var = "true"                            → full suite

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GROUPS_FILE="${SCRIPT_DIR}/test-groups.json"

BASE_SHA="${1:-}"
HEAD_SHA="${2:-}"

# ── forced full-suite conditions ─────────────────────────────────────────────

emit_full() {
  local reason="$1"
  python3 -c "
import json, sys
reason = sys.argv[1]
all_groups = ['navigation','content','links','search','accessibility','visual','performance','security']
print(json.dumps({'run_type':'full','groups':all_groups,'skipped':[],'skip_reason':reason,'force_full':True}))
" "${reason}"
  exit 0
}

if [[ "${FORCE_FULL:-false}" == "true" ]]; then
  emit_full "FORCE_FULL=true"
fi

if [[ "${HEAD_SHA}" == "nightly" || "${HEAD_SHA}" == "" ]]; then
  emit_full "Nightly cron — always full suite"
fi

NULL_SHA="0000000000000000000000000000000000000000"
if [[ "${BASE_SHA}" == "${NULL_SHA}" || "${BASE_SHA}" == "" ]]; then
  emit_full "No base SHA — new branch or initial push"
fi

# ── diff analysis ─────────────────────────────────────────────────────────────

if ! CHANGED=$(git diff --name-only "${BASE_SHA}" "${HEAD_SHA}" 2>/dev/null); then
  emit_full "git diff failed — defaulting to full suite"
fi

if [[ -z "${CHANGED}" ]]; then
  emit_full "No changed files detected — defaulting to full suite"
fi

if [[ ! -f "${GROUPS_FILE}" ]]; then
  emit_full "test-groups.json not found — defaulting to full suite"
fi

# Delegate all pattern matching to a single Python call for speed
python3 - "${GROUPS_FILE}" "${BASE_SHA}" "${HEAD_SHA}" <<'PYEOF'
import json, sys, fnmatch

groups_file = sys.argv[1]
base_sha    = sys.argv[2]
head_sha    = sys.argv[3]

with open(groups_file) as f:
    config = json.load(f)

patterns = config["groups"]   # ordered dict: pattern → list of groups
all_groups = ["navigation","content","links","search","accessibility","visual","performance","security"]

# Read the changed-file list from stdin (passed via shell heredoc pipe)
import subprocess
result = subprocess.run(
    ["git", "diff", "--name-only", base_sha, head_sha],
    capture_output=True, text=True
)
changed_files = [l for l in result.stdout.splitlines() if l]

if not changed_files:
    plan = {"run_type":"full","groups":all_groups,"skipped":[],
            "skip_reason":"No changed files — full suite","force_full":True}
    print(json.dumps(plan))
    sys.exit(0)

triggered   = set()
force_full  = False
only_ci     = True
unmatched   = []

for f in changed_files:
    matched = False
    for pattern, grps in patterns.items():
        if fnmatch.fnmatch(f, pattern):
            matched = True
            if "ALL" in grps:
                force_full = True
                only_ci    = False
            else:
                for g in grps:
                    triggered.add(g)
                # Workflow files don't flip only_ci=False by themselves
                if pattern != ".github/workflows/**":
                    only_ci = False
            break
    if not matched:
        unmatched.append(f)
        only_ci = False

if unmatched:
    plan = {"run_type":"full","groups":all_groups,"skipped":[],
            "skip_reason": f"Unmatched files: {', '.join(unmatched[:3])} — safe fallback",
            "force_full": True}
    print(json.dumps(plan))
    sys.exit(0)

if force_full:
    plan = {"run_type":"full","groups":all_groups,"skipped":[],
            "skip_reason":"High-risk path changed (layout/config/deps)","force_full":True}
    print(json.dumps(plan))
    sys.exit(0)

if only_ci:
    plan = {"run_type":"skip","groups":[],"skipped":all_groups,
            "skip_reason":"Only .github/workflows/** changed — no Playwright needed",
            "force_full":False}
    print(json.dumps(plan))
    sys.exit(0)

if not triggered:
    plan = {"run_type":"full","groups":all_groups,"skipped":[],
            "skip_reason":"No groups matched — safe fallback","force_full":True}
    print(json.dumps(plan))
    sys.exit(0)

selected = [g for g in all_groups if g in triggered]
skipped  = [g for g in all_groups if g not in triggered]
summary  = ", ".join(changed_files[:5])
plan = {"run_type":"partial","groups":selected,"skipped":skipped,
        "skip_reason":f"Partial run — changed: {summary}","force_full":False}
print(json.dumps(plan))
PYEOF
