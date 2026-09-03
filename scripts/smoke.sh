#!/bin/bash
# Entrestate Terminal — golden-path smoke suite.
#
# Three defects lived in this file and its two callers until 2026-09-02. None
# could surface, because preview-smoke-promote.yml — the workflow the README
# calls the promotion gate — skips every run: its preflight requires
# VERCEL_TOKEN and VERCEL_ORG_ID, and neither secret is set, so deploy, smoke
# and promote have never executed once. A gate that never runs cannot report
# that the thing it runs is broken.
#
#  1. The target came from "$1" only. Both workflows pass BASE_URL as an
#     ENVIRONMENT VARIABLE and call `bash scripts/smoke.sh` with no argument,
#     so every CI run would have smoke-tested http://localhost:3000 on a
#     GitHub runner with nothing listening.
#  2. The bypass header was hardcoded to "x-smoke-test: true" — a header name
#     that appears nowhere else in this repository and that no route, no
#     proxy rule and no Vercel setting reads. Both workflows set
#     BYPASS_HEADER=x-vercel-protection-bypass and BYPASS_TOKEN from a secret;
#     this script ignored both, so against a protection-enabled preview every
#     request would meet the auth wall.
#  3. manual-smoke.yml defaulted to https://entrestate.com — the BUSINESS
#     platform. The routes below (/api/chat, /api/market-score/summary) are the
#     Terminal's; on that host they are 404.
#
# Argument still wins so a human can aim it by hand:
#   bash scripts/smoke.sh https://terminal.entrestate.com

set -euo pipefail

BASE_URL="${1:-${BASE_URL:-http://localhost:3000}}"

# Vercel's deployment-protection bypass. Sent only when the workflow supplied
# both halves; an unset token must not become the literal header value.
BYPASS_HEADER="${BYPASS_HEADER:-x-vercel-protection-bypass}"
BYPASS_TOKEN="${BYPASS_TOKEN:-}"
CURL_AUTH=()
if [ -n "$BYPASS_TOKEN" ]; then
  CURL_AUTH=(-H "${BYPASS_HEADER}: ${BYPASS_TOKEN}")
  echo "🔑 Deployment-protection bypass: sending ${BYPASS_HEADER}"
else
  echo "🔓 No BYPASS_TOKEN set — assuming ${BASE_URL} is publicly reachable"
fi

echo "🚀 Starting Entrestate Terminal smoke tests for: ${BASE_URL}"

# 1. Landing Page Health
echo "--- [1/4] Checking Landing Page ---"
curl -s -f "${CURL_AUTH[@]}" "${BASE_URL}" > /dev/null
echo "✅ Landing Page OK"

# 2. Chat API Health
echo "--- [2/4] Checking Chat API ---"
curl -s -f -X POST "${CURL_AUTH[@]}" \
  -H "Content-Type: application/json" \
  -d '{"message": "PULSE"}' \
  "${BASE_URL}/api/chat" > /dev/null
echo "✅ Chat API (PULSE) OK"

# 3. Decision Screening
echo "--- [3/4] Checking Decision Screening ---"
curl -s -f -X POST "${CURL_AUTH[@]}" \
  -H "Content-Type: application/json" \
  -d '{"message": "SCREEN projects under AED 2M"}' \
  "${BASE_URL}/api/chat" | grep -q "price_from_aed" || (echo "❌ MISSING price_from_aed in results" && exit 1)
echo "✅ Decision Screening (price_from_aed integrity) OK"

# 4. Market Pulse Summary
echo "--- [4/4] Checking Market Pulse API ---"
curl -s -f "${CURL_AUTH[@]}" "${BASE_URL}/api/market-score/summary" > /dev/null
echo "✅ Market Pulse API OK"

echo "✨ ALL SMOKE TESTS PASSED"
