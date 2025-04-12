#!/usr/bin/env bash

API_KEY="PKU4CNVLX3UAMPS4F3AN"
API_SECRET="ZHMqQrJRkgNVpJXcvSaVA70ghFSR2fU9fnN138lm"
BASE_URL="https://paper-api.alpaca.markets/v2"
SYMBOL="BTCUSD"

# Get order count and determine notional
ORDER_COUNT=$(curl -s -H "APCA-API-KEY-ID: $API_KEY" -H "APCA-API-SECRET-KEY: $API_SECRET" "$BASE_URL/orders?status=all" | jq '. | length')
notional=11
if [ "$ORDER_COUNT" -gt 22 ]; then
  notional=$ORDER_COUNT
elif [ "$ORDER_COUNT" -gt 11 ]; then
  notional=22
fi

# Place market buy
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

ORDER_ID=$(echo "$BUY_RESPONSE" | jq -r '.id')
echo "Buy response: $BUY_RESPONSE"

# Wait for order fill
ATTEMPTS=10
FILLED_QTY="0"
FILLED_PRICE="0"

while [ "$FILLED_QTY" = "0" ] && [ $ATTEMPTS -gt 0 ]; do
  sleep 1
  ORDER_STATUS=$(curl -s -H "APCA-API-KEY-ID: $API_KEY" -H "APCA-API-SECRET-KEY: $API_SECRET" "$BASE_URL/orders/$ORDER_ID")
  FILLED_QTY=$(echo "$ORDER_STATUS" | jq -r '.filled_qty')
  FILLED_PRICE=$(echo "$ORDER_STATUS" | jq -r '.filled_avg_price')
  ATTEMPTS=$((ATTEMPTS - 1))
done

if [ "$FILLED_QTY" = "0" ] || [ "$FILLED_QTY" = "null" ]; then
  echo "Buy order not filled. Aborting."
  exit 1
fi

# Calculate TP and adjusted quantity
TP_PRICE=$(awk -v price="$FILLED_PRICE" 'BEGIN { printf "%.4f", price * 1.002 }')
ADJUSTED_QTY=$(awk -v q="$FILLED_QTY" 'BEGIN { printf "%.8f", q * 0.999 }')

echo "Filled qty: $FILLED_QTY"
echo "Avg price: $FILLED_PRICE"
echo "Adjusted qty: $ADJUSTED_QTY"
echo "Placing TP at: $TP_PRICE"

# Place take profit sell order
SELL_RESPONSE=$(curl -s -X POST \
  -H "APCA-API-KEY-ID: $API_KEY" \
  -H "APCA-API-SECRET-KEY: $API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "'"$SYMBOL"'",
    "qty": "'"$ADJUSTED_QTY"'",
    "side": "sell",
    "type": "limit",
    "time_in_force": "gtc",
    "limit_price": "'"$TP_PRICE"'"
}' "$BASE_URL/orders")

echo "Sell response: $SELL_RESPONSE"
