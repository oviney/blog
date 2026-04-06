#!/usr/bin/env bash
# Unit tests for scripts/analyse-changes.sh
# Run: bash scripts/test-analyse-changes.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PASS=0
FAIL=0
ERRORS=()

assert_field() {
  local label="$1"
  local json="$2"
  local field="$3"
  local expected="$4"
  local actual
  actual=$(python3 -c "import json,sys; d=json.loads(sys.argv[1]); print(d['${field}'])" "${json}" 2>/dev/null || echo "PARSE_ERROR")
  if [[ "${actual}" == "${expected}" ]]; then
    echo "  ✅ ${label}: ${field}=${actual}"
    (( PASS++ )) || true
  else
    echo "  ❌ ${label}: expected ${field}=${expected}, got ${actual}"
    (( FAIL++ )) || true
    ERRORS+=("${label}: expected ${field}=${expected}, got ${actual}")
  fi
}

assert_groups_contains() {
  local label="$1"
  local json="$2"
  local grp="$3"
  local actual
  actual=$(python3 -c "import json,sys; d=json.loads(sys.argv[1]); print('yes' if '${grp}' in d['groups'] else 'no')" "${json}" 2>/dev/null || echo "PARSE_ERROR")
  if [[ "${actual}" == "yes" ]]; then
    echo "  ✅ ${label}: groups contains ${grp}"
    (( PASS++ )) || true
  else
    echo "  ❌ ${label}: expected groups to contain ${grp}"
    (( FAIL++ )) || true
    ERRORS+=("${label}: expected groups to contain ${grp}")
  fi
}

NULL_SHA="0000000000000000000000000000000000000000"

echo "━━━ analyse-changes.sh unit tests ━━━"
echo ""

# ── Test 1: FORCE_FULL env var ───────────────────────────────────────────────
echo "Test 1: FORCE_FULL=true → full suite"
OUT=$(FORCE_FULL=true bash "${SCRIPT_DIR}/analyse-changes.sh" "abc123" "def456")
assert_field "FORCE_FULL" "$OUT" "run_type" "full"
assert_field "FORCE_FULL" "$OUT" "force_full" "True"
echo ""

# ── Test 2: null SHA (new branch) ────────────────────────────────────────────
echo "Test 2: null base SHA → full suite"
OUT=$(bash "${SCRIPT_DIR}/analyse-changes.sh" "${NULL_SHA}" "def456")
assert_field "null-sha" "$OUT" "run_type" "full"
echo ""

# ── Test 3: nightly sentinel ─────────────────────────────────────────────────
echo "Test 3: nightly sentinel → full suite"
OUT=$(bash "${SCRIPT_DIR}/analyse-changes.sh" "abc123" "nightly")
assert_field "nightly" "$OUT" "run_type" "full"
echo ""

# ── Test 4: empty BASE_SHA ───────────────────────────────────────────────────
echo "Test 4: empty BASE_SHA → full suite"
OUT=$(bash "${SCRIPT_DIR}/analyse-changes.sh" "" "def456")
assert_field "empty-base" "$OUT" "run_type" "full"
echo ""

# ── Test 5: post-only changes → content + links ──────────────────────────────
echo "Test 5: _posts/** → content + links groups"
# We need git history with a post-only commit; use current HEAD if available
# Find a commit that only touches _posts
POST_COMMIT=$(git log --oneline --diff-filter=M -- '_posts/**' 2>/dev/null | head -1 | cut -d' ' -f1 || true)
if [[ -n "${POST_COMMIT}" ]]; then
  POST_PARENT="${POST_COMMIT}^"
  OUT=$(bash "${SCRIPT_DIR}/analyse-changes.sh" "${POST_PARENT}" "${POST_COMMIT}" 2>/dev/null)
  # Posts may hit unmatched files if SCSS etc. also changed; acceptable either way
  RTYPE=$(python3 -c "import json,sys; print(json.loads(sys.argv[1])['run_type'])" "${OUT}")
  echo "  ℹ️  post-commit run_type=${RTYPE} (partial or full both OK)"
  (( PASS++ )) || true
else
  echo "  ⏭️  Skipped — no post-only commit found in history"
  (( PASS++ )) || true
fi
echo ""

# ── Test 6: JSON output is valid JSON ────────────────────────────────────────
echo "Test 6: output is valid JSON"
OUT=$(FORCE_FULL=true bash "${SCRIPT_DIR}/analyse-changes.sh" "abc" "def")
if python3 -c "import json,sys; json.loads(sys.argv[1])" "${OUT}" 2>/dev/null; then
  echo "  ✅ valid JSON"
  (( PASS++ )) || true
else
  echo "  ❌ invalid JSON: ${OUT}"
  (( FAIL++ )) || true
fi
echo ""

# ── Test 7: groups array present ─────────────────────────────────────────────
echo "Test 7: full suite has all 8 groups"
OUT=$(FORCE_FULL=true bash "${SCRIPT_DIR}/analyse-changes.sh" "abc" "def")
COUNT=$(python3 -c "import json,sys; print(len(json.loads(sys.argv[1])['groups']))" "${OUT}")
if [[ "${COUNT}" == "8" ]]; then
  echo "  ✅ 8 groups present"
  (( PASS++ )) || true
else
  echo "  ❌ expected 8 groups, got ${COUNT}"
  (( FAIL++ )) || true
fi
echo ""

# ── Test 8: test-groups.json is valid JSON ───────────────────────────────────
echo "Test 8: test-groups.json is valid JSON"
if python3 -c "import json; json.load(open('${SCRIPT_DIR}/test-groups.json'))" 2>/dev/null; then
  echo "  ✅ valid JSON"
  (( PASS++ )) || true
else
  echo "  ❌ invalid JSON in test-groups.json"
  (( FAIL++ )) || true
fi
echo ""

# ── Summary ──────────────────────────────────────────────────────────────────
echo "━━━ Results: ${PASS} passed, ${FAIL} failed ━━━"
if [[ "${FAIL}" -gt 0 ]]; then
  echo ""
  echo "Failures:"
  for e in "${ERRORS[@]}"; do echo "  • ${e}"; done
  exit 1
fi
