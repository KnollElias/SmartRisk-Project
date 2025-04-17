#!/usr/bin/env bash

API_KEY="PKA5LH5XBIBFCWZB8LMC"
API_SECRET="QRrCaFDz09oDWVwgODmFx5YVrgPQIVfubkn8N0AH"
BASE_URL="https://paper-api.alpaca.markets/v2" # or live URL if you have a live account
SSYMBOL="BTCUSD"

# Get total orders in your account (crypto or stock)
ORDER_COUNT=$(curl -s \
  -H "APCA-API-KEY-ID: $API_KEY" \
  -H "APCA-API-SECRET-KEY: $API_SECRET" \
  "$BASE_URL/orders?status=all" | jq '. | length')

NOTIONAL=1
if [ "$ORDER_COUNT" -gt 20 ]; then
  NOTIONAL=4
elif [ "$ORDER_COUNT" -gt 10 ]; then
  NOTIONAL=2
fi

# Get the latest trade price for BTCUSD
LATEST_PRICE=$(curl -s \
  -H "APCA-API-KEY-ID: $API_KEY" \
  -H "APCA-API-SECRET-KEY: $API_SECRET" \
  "$BASE_URL/crypto/latest/trades?symbols=$SYMBOL" \
  | jq ".trades[\"$SYMBOL\"].p")

[ -z "$LATEST_PRICE" ] || [ "$LATEST_PRICE" = "null" ] && LATEST_PRICE=0
TP_PRICE=$(awk -v price="$LATEST_PRICE" 'BEGIN { printf "%.6f", price * 1.002 }')

curl -s -X POST \
  -H "APCA-API-KEY-ID: $API_KEY" \
  -H "APCA-API-SECRET-KEY: $API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "'"$SYMBOL"'",
    "notional": "'"$NOTIONAL"'",
    "side": "buy",
    "type": "market",
    "time_in_force": "day",
    "order_class": "bracket",
    "take_profit": { "limit_price": "'"$TP_PRICE"'" }
}' \
  "$BASE_URL/orders"