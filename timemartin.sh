#!/usr/bin/env bash

API_KEY="PKU4CNVLX3UAMPS4F3AN"
API_SECRET="ZHMqQrJRkgNVpJXcvSaVA70ghFSR2fU9fnN138lm"
BASE_URL="https://paper-api.alpaca.markets/v2"
SYMBOL="BTCUSD"


ORDER_COUNT=$(curl -s \
  -H "APCA-API-KEY-ID: $API_KEY" \
  -H "APCA-API-SECRET-KEY: $API_SECRET" \
  "$BASE_URL/orders?status=all" | jq '. | length')

notional=11
if [ "$ORDER_COUNT" -gt 22 ]; then
  notional=$ORDER_COUNT
elif [ "$ORDER_COUNT" -gt 11 ]; then
  notional=22
fi

LATEST_PRICE=$(curl -s \
  -H "APCA-API-KEY-ID: $API_KEY" \
  -H "APCA-API-SECRET-KEY: $API_SECRET" \
  "$CRYPTO_BASE_URL/latest/trades?symbols=$SYMBOL" | jq ".trades.\"$SYMBOL\".p")

[ -z "$LATEST_PRICE" ] || [ "$LATEST_PRICE" = "null" ] && LATEST_PRICE=0
LATEST_PRICE=$(echo $LATEST_PRICE | tr -d '"')
TP_PRICE=$(awk -v price="$LATEST_PRICE" 'BEGIN { printf "%.6f", price * 1.002 }')

BUY_RESPONSE=$(curl -s -X POST \
  -H "APCA-API-KEY-ID: $API_KEY" \
  -H "APCA-API-SECRET-KEY: $API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "'"$SYMBOL"'",
    "notional": "'"$notional"'",
    "side": "buy",
    "type": "market",
    "time_in_force": "gtc"
}' "$BASE_URL/orders")
echo "Buy response: $BUY_RESPONSE"
BUY_QTY=$(echo "$BUY_RESPONSE" | jq -r '.filled_qty')

SELL_RESPONSE=$(curl -s -X POST \
  -H "APCA-API-KEY-ID: $API_KEY" \
  -H "APCA-API-SECRET-KEY: $API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "'"$SYMBOL"'",
    "qty": "'"$BUY_QTY"'",
    "side": "sell",
    "type": "limit",
    "time_in_force": "gtc",
    "limit_price": "'"$TP_PRICE"'"
}' "$BASE_URL/orders")
echo "Sell response: $SELL_RESPONSE"