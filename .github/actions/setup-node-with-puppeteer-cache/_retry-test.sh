#!/usr/bin/env bash
# _retry-test.sh — local unit-style harness for the npm-ci retry loop
#
# Exercises the same 3-attempt / 10s-backoff retry shape used in
# action.yml's "Install dependencies (with retry)" step against a mocked
# `npm` binary that fails a configurable number of times.
#
# CRITICAL: the retry loop below is duplicated from action.yml. Keep both
# copies in sync. action.yml is the source of truth for "what runs in CI";
# this harness is the source of truth for "did the retry shape change
# behaviour". Update both when changing retry semantics.
#
# Usage:
#   bash _retry-test.sh fail-fail-fail        # expects exit 1 (RED)
#   bash _retry-test.sh fail-fail-succeed     # expects exit 0 (GREEN)
#
# Exits 0 if observed behaviour matches expectation, 1 otherwise. The
# harness prints PASS/FAIL banner so it's grep-able in CI logs if we
# ever decide to run it in a workflow step.

set -uo pipefail

MODE="${1:-}"
case "$MODE" in
  fail-fail-fail)        FAIL_COUNT=3; EXPECTED_EXIT=1; LABEL="RED — 3 failures, no recovery" ;;
  fail-fail-succeed)     FAIL_COUNT=2; EXPECTED_EXIT=0; LABEL="GREEN — 2 failures, then success" ;;
  *)
    echo "usage: $0 fail-fail-fail | fail-fail-succeed" >&2
    exit 64
    ;;
esac

echo "=== retry-test: $LABEL ==="

# Build a temp workspace with a mock `npm` binary.
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

cat > "$WORKDIR/npm" <<MOCK_NPM
#!/usr/bin/env bash
# Mock npm: reads call counter from \$WORKDIR/.calls, increments,
# fails if call <= FAIL_COUNT, succeeds otherwise.
CALL_FILE="$WORKDIR/.calls"
calls=\$(cat "\$CALL_FILE" 2>/dev/null || echo 0)
calls=\$((calls + 1))
echo \$calls > "\$CALL_FILE"
if [ "\$calls" -le "$FAIL_COUNT" ]; then
  echo "MOCK npm: call \$calls of $FAIL_COUNT — failing on purpose" >&2
  exit 1
fi
echo "MOCK npm: call \$calls — succeeding"
exit 0
MOCK_NPM
chmod +x "$WORKDIR/npm"

# Shorten the backoff for local runs (10s × 2 = 20s wait is wasteful in
# tests). We're not testing the timing here, just the loop's exit and
# logging behaviour.
RETRY_BACKOFF_SECONDS=0

# ── BEGIN duplicated retry loop (keep in sync with action.yml) ──────────
set +e
PATH="$WORKDIR:$PATH"
{
  for attempt in 1 2 3; do
    if npm ci; then
      echo "npm ci succeeded on attempt $attempt"
      ACTUAL_EXIT=0
      break
    fi
    if [ $attempt -lt 3 ]; then
      echo "::warning::npm ci attempt $attempt failed; retrying in ${RETRY_BACKOFF_SECONDS}s..."
      sleep "$RETRY_BACKOFF_SECONDS"
    fi
  done
  # If we exhausted the loop without success, ACTUAL_EXIT is unset →
  # treat as terminal failure.
  if [ -z "${ACTUAL_EXIT:-}" ]; then
    echo "::error::npm ci failed after 3 attempts"
    ACTUAL_EXIT=1
  fi
} > "$WORKDIR/.stdout" 2>&1
set -e
# ── END duplicated retry loop ───────────────────────────────────────────

OBSERVED_STDOUT="$(cat "$WORKDIR/.stdout")"

echo "--- captured retry-loop output ---"
echo "$OBSERVED_STDOUT"
echo "----------------------------------"
echo "observed exit: $ACTUAL_EXIT (expected $EXPECTED_EXIT)"

# Behaviour assertions:
#   - exit code matches expectation
#   - failure-log lines count is FAIL_COUNT (one ::warning:: per failed
#     attempt that's not the third, plus one ::error:: if all three fail)
#   - on success: exactly one "succeeded on attempt N" line
WARN_LINES=$(echo "$OBSERVED_STDOUT" | grep -c "::warning::npm ci attempt")
ERROR_LINES=$(echo "$OBSERVED_STDOUT" | grep -c "::error::npm ci failed after 3 attempts")
SUCCESS_LINES=$(echo "$OBSERVED_STDOUT" | grep -c "npm ci succeeded on attempt")

case "$MODE" in
  fail-fail-fail)
    EXPECT_WARN=2; EXPECT_ERROR=1; EXPECT_SUCCESS=0
    ;;
  fail-fail-succeed)
    EXPECT_WARN=2; EXPECT_ERROR=0; EXPECT_SUCCESS=1
    ;;
esac

PASS=1
if [ "$ACTUAL_EXIT" -ne "$EXPECTED_EXIT" ]; then
  echo "FAIL: exit code $ACTUAL_EXIT != expected $EXPECTED_EXIT"
  PASS=0
fi
if [ "$WARN_LINES" -ne "$EXPECT_WARN" ]; then
  echo "FAIL: ::warning:: lines $WARN_LINES != expected $EXPECT_WARN"
  PASS=0
fi
if [ "$ERROR_LINES" -ne "$EXPECT_ERROR" ]; then
  echo "FAIL: ::error:: lines $ERROR_LINES != expected $EXPECT_ERROR"
  PASS=0
fi
if [ "$SUCCESS_LINES" -ne "$EXPECT_SUCCESS" ]; then
  echo "FAIL: 'succeeded on attempt' lines $SUCCESS_LINES != expected $EXPECT_SUCCESS"
  PASS=0
fi

if [ "$PASS" -eq 1 ]; then
  echo "PASS: $MODE produced expected behaviour"
  exit 0
else
  echo "FAIL: $MODE deviated from expected behaviour"
  exit 1
fi
