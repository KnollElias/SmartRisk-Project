const fs = require("fs");
const readline = require("readline");

class GridBacktester {
  constructor(startPrice, gridSizePercent, tradeSize, priceData) {
    this.gridSize = gridSizePercent / 100;
    this.tradeSize = tradeSize;
    this.priceData = priceData;
    this.balance = 100; // Starting balance
    this.profit = 0;
    this.position = 0;
    this.orders = {}; // Order book (buy/sell)
    this.initOrders(startPrice);
  }

  // Initialize buy orders below the starting price
  initOrders(startPrice) {
    let price = startPrice;
    const maxLevels = 100;
    for (let i = 0; i < maxLevels; i++) {
      price *= 1 - this.gridSize;
      this.orders[price.toFixed(2)] = { type: "buy", executed: false };
    }
  }

  // Run the backtest over historical price data
  runBacktest() {
    for (let price of this.priceData) {
      this.processOrders(price);
    }
    return this.getResults();
  }

  // Process buy and sell orders
  processOrders(price) {
    Object.keys(this.orders).forEach(level => {
      level = parseFloat(level);
      if (this.orders[level] && this.orders[level].type === "buy" && price <= level && !this.orders[level].executed) {
        this.executeBuy(level);
      } else if (this.orders[level] && this.orders[level].type === "sell" && price >= level && !this.orders[level].executed) {
        this.executeSell(level);
      }
    });
  }

  executeBuy(price) {
    if (this.balance >= price * this.tradeSize) {
      this.position += this.tradeSize;
      this.balance -= price * this.tradeSize;
      this.orders[price.toFixed(2)].executed = true;

      let sellPrice = price * (1 + this.gridSize);
      this.orders[sellPrice.toFixed(2)] = { type: "sell", executed: false };

      console.log(`BUY at ${price.toFixed(2)} | Balance: ${this.balance.toFixed(2)}`);
    }
  }

  executeSell(price) {
    if (this.position >= this.tradeSize) {
      this.position -= this.tradeSize;
      const revenue = price * this.tradeSize;
      const buyPrice = price / (1 + this.gridSize);
      const tradeProfit = buyPrice * this.gridSize * this.tradeSize;

      this.profit += tradeProfit;
      this.balance += revenue;
      this.orders[price.toFixed(2)].executed = true;

      console.log(`SELL at ${price.toFixed(2)} | Profit: ${this.profit.toFixed(2)} | Balance: ${this.balance.toFixed(2)}`);
    }
  }

  getResults() {
    console.log(`\n📊 Final Balance: ${this.balance.toFixed(2)}`);
    console.log(`📈 Total Profit: ${this.profit.toFixed(2)}`);
    return { balance: this.balance, totalProfit: this.profit };
  }
}

// Read CSV and extract price data
async function readCSV(filePath) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const prices = [];
  let isFirstLine = true;
  for await (const line of rl) {
    if (isFirstLine) {
      isFirstLine = false;
      continue;
    }
    const columns = line.split(",");
    const price = parseFloat(columns[1]);
    if (!isNaN(price)) prices.push(price);
  }
  return prices;
}

// Run the backtest
async function main() {
  const priceData = await readCSV("Grid_Trading_Test_Dataset.csv");
  if (priceData.length === 0) {
    console.error("Error: No price data loaded.");
    return;
  }

  const bot = new GridBacktester(priceData[0], 1, 1, priceData);
  const results = bot.runBacktest();
  console.log(results);
}

main();
