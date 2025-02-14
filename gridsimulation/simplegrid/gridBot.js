const ccxt = require("ccxt");
const fs = require("fs");
const readline = require("readline");

class GridBacktester {
  constructor(startPrice, gridSizePercent, tradeSize, priceData) {
    this.gridSize = gridSizePercent / 100;
    this.tradeSize = tradeSize;
    this.priceData = priceData;
    this.balance = 100; // Simulated starting balance
    this.profit = 0; // Track profit separately
    this.position = 0; // Open positions
    this.orders = new Map();
    this.initOrders(startPrice);
  }

  // Initialize grid levels below the starting price
  initOrders(startPrice) {
    let price = startPrice;
    while (price > 0) {
      price *= 1 - this.gridSize;
      this.orders.set(price.toFixed(2), { type: "buy", executed: false });
    }
  }

  // Run backtest over the price data
  runBacktest() {
    for (let price of this.priceData) {
      this.processOrders(price);
    }
    return this.getResults();
  }

  // Process buy and sell orders
  processOrders(price) {
    this.orders.forEach((order, level) => {
      level = parseFloat(level);
      if (order.type === "buy" && price <= level && !order.executed) {
        this.executeBuy(level);
      } else if (order.type === "sell" && price >= level && !order.executed) {
        this.executeSell(level);
      }
    });
  }

  executeBuy(price) {
    this.position += this.tradeSize;
    this.balance -= price * this.tradeSize;
    console.log(`BUY at ${price.toFixed(2)} | Balance: ${this.balance.toFixed(2)}`);
    this.orders.delete(price.toFixed(2));

    let sellPrice = price * (1 + this.gridSize);
    this.orders.set(sellPrice.toFixed(2), { type: "sell", executed: false });
  }

  executeSell(price) {
    this.position -= this.tradeSize;
    const revenue = price * this.tradeSize;

    const buyPrice = price / (1 + this.gridSize);
    const tradeProfit = buyPrice * this.gridSize * this.tradeSize;

    this.profit += tradeProfit;
    this.balance += revenue;

    console.log(`SELL at ${price.toFixed(2)} | Profit: ${this.profit.toFixed(2)} | Balance: ${this.balance.toFixed(2)}`);
    this.orders.delete(price.toFixed(2));

    let buyPriceNew = price * (1 - this.gridSize);
    this.orders.set(buyPriceNew.toFixed(2), { type: "buy", executed: false });
  }

  getResults() {
    console.log(`\n📊 Final Balance: ${this.balance.toFixed(2)}`);
    console.log(`📈 Total Profit: ${this.profit.toFixed(2)}`);
    return { balance: this.balance, totalProfit: this.profit };
  }
}

// Fetch historical price data from Binance
async function fetchHistoricalData() {
  const exchange = new ccxt.binance();
  const symbol = "BTC/USDT";
  const timeframe = "1h"; // 1-hour candles
  const since = exchange.parse8601("2023-01-01T00:00:00Z");
  const limit = 500; // Fetch 500 candles

  const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, since, limit);
  return ohlcv.map(candle => candle[4]); // Extract closing prices
}

// Run backtest with real market data
async function main() {
  const priceData = await fetchHistoricalData();
  if (priceData.length === 0) {
    console.error("Error: No price data loaded.");
    return;
  }

  const bot = new GridBacktester(priceData[0], 1, 1, priceData);
  const results = bot.runBacktest();
  console.log(results);
}

main();
