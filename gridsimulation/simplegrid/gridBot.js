const fs = require("fs");
const readline = require("readline");

class GridBacktester {
  constructor(startPrice, gridSizePercent, tradeSize, priceData) {
    this.gridSize = gridSizePercent / 100;
    this.tradeSize = tradeSize;
    this.priceData = priceData;
    this.balance = 10000;
    this.position = 0;
    this.orders = new Map();
    this.initOrders(startPrice);
  }

  initOrders(startPrice) {
    let price = startPrice;
    let maxLevels = 100; // Prevent infinite loop
    let count = 0;

    while (price > 0 && count < maxLevels) {
      price *= 1 - this.gridSize;
      this.orders.set(price.toFixed(2), { type: "buy", executed: false });
      count++;
    }
  }

  runBacktest() {
    for (let price of this.priceData) {
      this.processOrders(price);
    }
    return this.getResults();
  }

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
    console.log(
      `BUY at ${price.toFixed(2)} | Balance: ${this.balance.toFixed(2)}`
    );
    this.orders.delete(price.toFixed(2));
    let sellPrice = price * (1 + this.gridSize);
    this.orders.set(sellPrice.toFixed(2), { type: "sell", executed: false });
  }

  executeSell(price) {
    this.position -= this.tradeSize;
    this.balance += price * this.tradeSize;
    console.log(
      `SELL at ${price.toFixed(2)} | Balance: ${this.balance.toFixed(2)}`
    );
    this.orders.delete(price.toFixed(2));
    let buyPrice = price * (1 - this.gridSize);
    this.orders.set(buyPrice.toFixed(2), { type: "buy", executed: false });
  }

  getResults() {
    const finalPrice = this.priceData[this.priceData.length - 1]; // Last price in dataset

    // Sell all open positions at the final price
    const finalValue = this.position * finalPrice;
    this.balance += finalValue;
    this.position = 0; // Reset position since everything is sold

    console.log(
      `\n📊 Final Balance After Closing All Positions: ${this.balance.toFixed(
        2
      )}`
    );
    return {
      balance: this.balance,
      finalValue: finalValue,
      totalBalance: this.balance + finalValue,
      position: this.position,
      orders: [...this.orders.entries()],
    };
  }
}

// Function to read the CSV file and extract price data
async function readCSV(filePath) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });
  const prices = [];

  let isFirstLine = true; // Skip header
  for await (const line of rl) {
    if (isFirstLine) {
      isFirstLine = false;
      continue;
    }
    const columns = line.split(",");
    const price = parseFloat(columns[1]); // Extracting price column
    if (!isNaN(price)) prices.push(price);
  }

  return prices;
}

// Run backtest with real historical data
async function main() {
  const priceData = await readCSV("btcdata.csv");

  if (priceData.length === 0) {
    console.error("Error: No price data loaded from CSV.");
    return;
  }

  const bot = new GridBacktester(priceData[0], 1, 1, priceData);
  const results = bot.runBacktest();
  console.log(results);
}

main();
