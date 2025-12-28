#!/usr/bin/env bash
# Basic cURL examples for testing the faucet API.
# Uses HttpOnly cookies - cookie is saved to file and reused automatically.

API_BASE="https://your-domain.com/api"
CCX_ADDRESS="ccxYourAddressHere"
SCORE=1500
COOKIE_FILE=$(mktemp)

echo "== 1) Health check =="
curl -s "$API_BASE/health"
echo
echo

echo "== 2) Start game (session token set as HttpOnly cookie) =="
START_RESPONSE=$(curl -s -c "$COOKIE_FILE" "$API_BASE/start-game?address=$CCX_ADDRESS")
echo "$START_RESPONSE"
echo
echo "Cookie saved to: $COOKIE_FILE"
echo "Cookie content:"
cat "$COOKIE_FILE"
echo

echo "== Simulate game play (waiting 35 seconds) =="
sleep 35

echo "== 3) Claim reward (cookie sent automatically) =="
curl -s -X POST "$API_BASE/claim" \
  -b "$COOKIE_FILE" \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$CCX_ADDRESS\",
    \"score\": $SCORE
  }"
echo
echo

# Cleanup
rm -f "$COOKIE_FILE"

