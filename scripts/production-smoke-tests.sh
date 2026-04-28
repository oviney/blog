#!/usr/bin/env bash
# production-smoke-tests.sh — post-deploy smoke checks for https://www.viney.ca
#
# Verifies the minimum production surface after deployment:
# - core routes return expected status codes
# - the custom 404 route returns 404
# - the sitemap is reachable
# - the most recent post from the sitemap resolves
#
# Usage:
#   bash scripts/production-smoke-tests.sh
#   PROD_URL=https://staging.example.com bash scripts/production-smoke-tests.sh

set -euo pipefail

PROD_URL="${PROD_URL:-https://www.viney.ca}"
SMOKE_RETRIES="${SMOKE_RETRIES:-12}"
SMOKE_RETRY_DELAY="${SMOKE_RETRY_DELAY:-10}"

ERRORS=0

check_status() {
  local url="$1"
  local expected="$2"
  local label="$3"
  local attempt=1
  local status=""

  while (( attempt <= SMOKE_RETRIES )); do
    status="$(curl -L -s -o /dev/null -w "%{http_code}" "$url" || true)"
    if [[ "$status" == "$expected" ]]; then
      echo "PASS  ${label}: HTTP ${status} (${url})"
      return 0
    fi

    if (( attempt < SMOKE_RETRIES )); then
      echo "WAIT  ${label}: expected ${expected}, got ${status:-curl-error} (attempt ${attempt}/${SMOKE_RETRIES})"
      sleep "$SMOKE_RETRY_DELAY"
    fi

    ((attempt++))
  done

  echo "FAIL  ${label}: expected ${expected}, got ${status:-curl-error} (${url})"
  ERRORS=$((ERRORS + 1))
  return 1
}

fetch_sitemap() {
  local attempt=1
  local sitemap=""

  while (( attempt <= SMOKE_RETRIES )); do
    sitemap="$(curl -L -s "${PROD_URL}/sitemap.xml" || true)"
    if [[ -n "$sitemap" && "$sitemap" == *"<urlset"* ]]; then
      printf '%s' "$sitemap"
      return 0
    fi

    if (( attempt < SMOKE_RETRIES )); then
      echo "WAIT  sitemap content unavailable (attempt ${attempt}/${SMOKE_RETRIES})"
      sleep "$SMOKE_RETRY_DELAY"
    fi

    ((attempt++))
  done

  return 1
}

echo "Running production smoke checks against ${PROD_URL}"
echo ""

check_status "${PROD_URL}/" "200" "homepage" || true
check_status "${PROD_URL}/blog/" "200" "blog index" || true
check_status "${PROD_URL}/search/" "200" "search page" || true
check_status "${PROD_URL}/sitemap.xml" "200" "sitemap" || true
check_status "${PROD_URL}/this-page-does-not-exist/" "404" "custom 404" || true

sitemap_xml="$(fetch_sitemap || true)"
if [[ -z "${sitemap_xml}" ]]; then
  echo "FAIL  could not fetch a valid sitemap from ${PROD_URL}/sitemap.xml"
  ERRORS=$((ERRORS + 1))
else
  latest_post_url="$(
    printf '%s' "$sitemap_xml" \
      | grep -oE '<loc>[^<]+</loc>' \
      | sed -E 's#</?loc>##g' \
      | grep '/20[0-9][0-9]/' \
      | tail -1
  )"

  if [[ -z "${latest_post_url}" ]]; then
    echo "FAIL  could not derive the latest post URL from sitemap.xml"
    ERRORS=$((ERRORS + 1))
  else
    check_status "${latest_post_url}" "200" "latest post" || true
  fi
fi

echo ""
if (( ERRORS > 0 )); then
  echo "Production smoke checks failed with ${ERRORS} error(s)."
  exit 1
fi

echo "Production smoke checks passed."
