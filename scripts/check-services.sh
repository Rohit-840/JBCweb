#!/usr/bin/env sh
set -eu

API_URL="${API_URL:-http://127.0.0.1:3000/health}"
MT5_URL="${MT5_URL:-http://127.0.0.1:8001/}"

echo "Checking API: $API_URL"
curl -fsS "$API_URL" >/dev/null
echo "API OK"

echo "Checking MT5 bridge: $MT5_URL"
curl -fsS "$MT5_URL" >/dev/null
echo "MT5 bridge OK"
