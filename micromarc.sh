#!/usr/bin/env bash

API_KEY="PKHPECPSZXVITZPMZEL9"
API_SECRET="tbj9Esc3Bk1EfTJ7iQ1l3XUW5umTjnyiwLM3GabD"
BASE_URL="https://paper-api.alpaca.markets/v2"
SYMBOL="BTCUSD"

# Define scale: 90 elements, 0-indexed (trade #1 = index 0)
declare -a SCALE=(
  10 10 10 10 10 10 10 10 10 10     # 1–10
  20 20 20 20 20 20 20 20 20 20     # 11–20
  40 40 40 40 40 40 40 40 40 40     # 21–30
  20 20 20 20 20 20 20 20 20 20     # 31–40
  40 40 40 40 40 40 40 40 40 40     # 41–50
  80 80 80 80 80 80 80 80 80 80     # 51–60
  40 40 40 40 40 40 40 40 40 40     # 61–70
  80 80 80 80 80 80 80 80 80 80     # 71–80
 160 160 160 160 160 160 160 160 160 160 # 81–90
)

# Count only filled buy orders
TRADE_NUM=$(curl -s \
  -H "APCA-API-KEY-ID: $API_KEY" \
  -H "APCA-API-SECRET-KEY: $API_SECRET" \
  "$BASE_URL/orders?status=closed" \
  | jq '[.[] | select(.side == "buy" and .filled_qty != "0")] | length')

INDEX=$((TRADE_NUM))  # Next trade index is current count

if [ "$INDEX" -ge "${#SCALE[@]}" ]; then
  echo "🚫 Max trade count reached ($TRADE_NUM). Stopping."
  exit 0
fi

notional=${SCALE[$INDEX]}
echo "Trade #$((TRADE_NUM + 1)) – Using notional: $notional"

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

# Wait for fill
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

# Calculate TP
TP_PRICE=$(awk -v price="$FILLED_PRICE" 'BEGIN { printf "%.4f", price * 1.002 }')
ADJUSTED_QTY=$(awk -v q="$FILLED_QTY" 'BEGIN { printf "%.8f", q * 0.999 }')

echo "Filled qty: $FILLED_QTY"
echo "TP price: $TP_PRICE"

# Place take-profit sell
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
