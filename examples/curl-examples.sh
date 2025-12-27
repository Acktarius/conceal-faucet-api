#!/usr/bin/env bash
# Basic cURL examples for testing the faucet API.

API_BASE="https://your-domain.com/api"
CCX_ADDRESS="ccxYourAddressHere"
SCORE=1500

echo "== 1) Health check =="
curl -s "$API_BASE/health"
echo
echo

echo "== 2) Start game (get session token) =="
START_RESPONSE=$(curl -s "$API_BASE/start-game?address=$CCX_ADDRESS")
echo "$START_RESPONSE"
TOKEN=$(echo "$START_RESPONSE" | grep -oE '"token"\s*:\s*"[^"]+' | sed 's/"token"\s*:\s*"//')
echo "Extracted token: $TOKEN"
echo

if [ -z "$TOKEN" ]; then
  echo "Failed to get token from start-game response."
  exit 1
fi

echo "== Simulate game play (waiting 35 seconds) =="
sleep 35

echo "== 3) Claim reward =="
curl -s -X POST "$API_BASE/claim" \
  -H "Content-Type: application/json" \
  -H "X-Faucet-Token: $TOKEN" \
  -d "{
    \"address\": \"$CCX_ADDRESS\",
    \"score\": $SCORE
  }"
echo
echo

