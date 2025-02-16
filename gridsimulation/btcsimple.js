const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { createObjectCsvWriter } = require("csv-writer");

const STATE_FILE = path.join(__dirname, "statefile.json");
const HISTORY_FILE = path.join(__dirname, "history.csv");
const TEST_DATA_FILE = path.join(__dirname, "btcdata.csv");

const GRID_GAP_PERCENTAGE = 1 / 100; // 1% Grid Gap
const INITIAL_BALANCE = 100;
const INITIAL_RISK = 1;

let triggeredGridsCount = 0;
let totalGridsScheduled = 0;
let totalGridsCompleted = 0;

// CSV Writer for history file
const csvWriter = createObjectCsvWriter({
  path: HISTORY_FILE,
  header: [
    { id: "id", title: "Trade ID" },
    { id: "trigger", title: "Trigger Price" },
    { id: "takeprofit", title: "Take Profit Price" },
  ],
  append: true,
});

// Read the state file
function readStateFile() {
  try {
    if (!fs.existsSync(STATE_FILE))
      return { balance: INITIAL_BALANCE, grids: [] };
    const data = fs.readFileSync(STATE_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading state file:", error);
    return { balance: INITIAL_BALANCE, grids: [] };
  }
}

// Write the state file
function writeStateFile(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 4), "utf8");
  } catch (error) {
    console.error("Error writing state file:", error);
  }
}

// Round numbers to 2 decimal places to fix floating-point issues
function round(value) {
  return Math.round(value * 100) / 100;
}

// Initialize grid levels at startup based on 1% grid gaps
function initializeGrids(initialPrice) {
  let state = { balance: INITIAL_BALANCE, grids: [] };

  let levelPrice = initialPrice;
  while (levelPrice > 0) {
    state.grids.push({
      id: `GRID_${round(levelPrice)}`,
      trigger: round(levelPrice),
      takeprofit: round(levelPrice * (1 + GRID_GAP_PERCENTAGE)),
      status: "scheduled",
    });
    levelPrice -= initialPrice * GRID_GAP_PERCENTAGE; // Move down by 1%
  }
  totalGridsScheduled = state.grids.length; // Track how many grids were created
  writeStateFile(state);
}

// 🔥 **New Function: Expand Grid Levels Upwards**
function expandGrids(state, currentPrice) {
  let maxGrid = Math.max(...state.grids.map((grid) => grid.trigger)); // Find highest grid level

  while (currentPrice > maxGrid) {
    maxGrid = round(maxGrid * (1 + GRID_GAP_PERCENTAGE)); // Move up by 1%
    let newGrid = {
      id: `GRID_${maxGrid}`,
      trigger: maxGrid,
      takeprofit: round(maxGrid * (1 + GRID_GAP_PERCENTAGE)),
      status: "scheduled",
    };
    state.grids.push(newGrid);
    totalGridsScheduled++;
    console.log(`✅ New upper grid added: ${newGrid.id}`);
  }
}

// Process price from historical dataset
function processPrice(price) {
  let state = readStateFile();
  price = parseFloat(price); // Ensure price is a number

  console.log(`📉 Processing price: ${price.toFixed(2)}`);

  // 🔼 **Check if we need to expand grids upwards**
  expandGrids(state, price);

  state.grids.forEach((grid) => {
    if (grid.status === "scheduled" && price <= grid.trigger) {
      grid.status = "filled"; // Mark as filled
      triggeredGridsCount++; // Track triggered grids
      console.log(`⚡ Grid ${grid.id} filled at price ${price.toFixed(2)}`);
    }

    if (grid.status === "filled" && price >= grid.takeprofit) {
      console.log(`💰 Grid ${grid.id} hit take profit at ${grid.takeprofit}`);
      moveToHistory(grid);
      totalGridsCompleted++; // Track grids that hit take profit
      state.grids = state.grids.filter((g) => g.id !== grid.id);
      createGridBelow(state, grid.trigger * (1 - GRID_GAP_PERCENTAGE)); // Replace with a new grid at a lower level
    }
  });

  writeStateFile(state);
}

// Create a new grid order below the current price
function createGridBelow(state, currentPrice) {
  let newGrid = {
    id: `GRID_${round(currentPrice)}`,
    trigger: round(currentPrice),
    takeprofit: round(currentPrice * (1 + GRID_GAP_PERCENTAGE)),
    status: "scheduled",
  };
  state.grids.push(newGrid);
  console.log("📉 New grid created below:", newGrid);
}

// Move filled order to history.csv
async function moveToHistory(grid) {
  await csvWriter.writeRecords([
    { id: grid.id, trigger: grid.trigger, takeprofit: grid.takeprofit },
  ]);
  // console.log(`📊 Trade ${grid.id} added to history.`);
}

// Detects correct price column automatically
function detectPriceColumn(headers) {
  const possibleColumns = ["Price", "price"]; // Add more variations if necessary
  return possibleColumns.find((col) => headers.includes(col)) || null;
}

// Read and process historical data from testdata.csv
function startBacktest() {
  console.log("🚀 Starting backtest using historical data...");

  let priceData = [];
  let detectedPriceColumn = null;

  fs.createReadStream(TEST_DATA_FILE)
    .pipe(csv())
    .on("headers", (headers) => {
      detectedPriceColumn = detectPriceColumn(headers);
      if (!detectedPriceColumn) {
        console.error(
          "❌ ERROR: Could not detect price column. Check your CSV format."
        );
        process.exit(1);
      }
      console.log(`✅ Detected price column: ${detectedPriceColumn}`);
    })
    .on("data", (row) => {
      let price = parseFloat(row[detectedPriceColumn]); // Use detected column name
      if (!isNaN(price)) {
        priceData.push(price);
      }
    })
    .on("end", () => {
      console.log(`📈 Loaded ${priceData.length} price points.`);

      if (priceData.length === 0) {
        console.error("❌ No valid price data found.");
        return;
      }

      // Initialize grids with the first price in dataset
      initializeGrids(priceData[0]);

      // Process each price in sequence
      priceData.forEach((price) => processPrice(price));

      // Summary Report
      console.log("\n==== 📊 BACKTEST SUMMARY ====");
      console.log(`🔹 Total price points processed: ${priceData.length}`);
      console.log(`🔹 Total grids scheduled: ${totalGridsScheduled}`);
      console.log(`🔹 Total grids triggered: ${triggeredGridsCount}`);
      console.log(
        `🔹 Total grids completed (take profit hit): ${totalGridsCompleted}`
      );
      console.log("✅ Backtest complete.");
    });
}

// Start the backtest
startBacktest();
