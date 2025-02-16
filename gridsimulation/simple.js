//simple grid trading bot for backtests

///// THE GRIDGAP IS A HARDCODED ABSOLUTE PRICE LEVEL NO PERCENTAGE, IT IS THE DIFFERENCE IN THE ASSET BETWEEN THE GRIDS SO WHEN THE ASSET IS AT THE PRICE 1000 AND HTE GAP IS AT 10 THEN THE GAP IS ABOUT 1%!
const statefile = require("./modules/statefile");

const initialBalance = 100;
const initialRisk = 1;

const scaleCount = 1;
const scalePeak = 6;

let openedTrades = 0;
let closedTrades = 0;

/*
l1 = 1
l2 = 2
l3 = 4
l4 = 8
l5 = 16
l6 = 32

Total: 63
*/

const asset = "BTCUSDT";

/*
grid states

scheduled -> order should be placed (opened if triggered)
trigered -> order is placed
placed -> confirmed by the exechnge
filled -> order is filled
closed -> order should be added to the history, deleted form the file and a new roder shoulöd be schaduled

{
  "node": 1,            to what node scale it belongs
  "number": 1,          the number of the trade
  "id": "BTCUSDT1",     what asset and what number of trade it is, the second is the BTCUSDT2
  "risk": 1,
  "state": 1,
  "status": "scheduled",
  "trigger": 99,
  "takeprofit": 100
}
*/

let price = 100;
let initialprice = price;

function scheduleGrids() {
  const state = statefile.readStateFile();
  console.log(state);
  if (state == null) {
    console.error("State file is missing.");
    return;
  }

  const gridCount = state.balance / state.initial_risk - state.grid_gap; // how many grids there should be but there is no trigger at 0 therefore we want to - one grid
  let levelPrice = price; // the level price is hte level that hte grid shoul dbe triggered, that is lowered until it reaches 0
  let tradeNumber = 0;
  let grids = [];
  for (let i = 0; i < gridCount; i++) {
    let grid = {};
    grid.node = 1;
    tradeNumber += 1;
    grid.number = tradeNumber;
    grid.id = `${asset}${tradeNumber}`;
    grid.risk = state.initial_risk;
    grid.state = 1;
    grid.status = "scheduled";
    levelPrice = levelPrice - state.grid_gap;
    grid.trigger = levelPrice;
    grid.takeprofit = levelPrice + state.grid_gap;

    grids.push(grid);
  }
}

function generateLevels(price) {
  const state = statefile.readStateFile();
  if (state == null) {
    console.error("State file is missing.");
    return;
  }

  const gridCount = state.balance / state.initial_risk - state.grid_gap; // how many grids there should be but there is no trigger at 0 therefore we want to - one grid
  let levelPrice = price; // the level price is hte level that hte grid shoul dbe triggered, that is lowered until it reaches 0
  let tradeNumber = 0;
  let levels = [];
  for (let i = 0; i < gridCount; i++) {
    let level = {};
    level.state = 1;
    levelPrice = levelPrice - state.grid_gap;
    level.trigger = levelPrice;
    level.takeprofit = levelPrice + state.grid_gap;

    levels.push(level);
  }
  state.levels = levels;
  statefile.writeStateFile(state);

  // const scaleCount = state.nodes.length;

  // for (let i = 0; i < scaleCount; i++) {
  //   const node = state.nodes[i].index;
  //   const grid = state.grids[i].node;
  //   // const gridState = grid.state;
  //   console.log("grid", grid, "node", node);

  //   // if (gridState == "closed") {
  //   //   grid.state = "scheduled";
  //   //   grid.currentGrid = 1;
  //   //   grid.currentBalance = initialBalance;
  //   //   grid.currentRisk = initialRisk;
  //   // }
  // }

  // if (state.gridState == "closed") {
  //   state.gridState = "scheduled";
  //   state.currentGrid = 1;
  //   state.currentBalance = initialBalance;
  //   state.currentRisk = initialRisk;
  //   statefile.writeStateFile(state);
  // }
}
// console.log(scheduleGrids(price));

const getRandomPrice = (price) => {
  return price + Math.floor(Math.random() * 10 - 5) * 0.01;
};

const getLevels = (price) => {
  generateLevels(price);
};

const isGridBellow = (price, state) => {
  if (state.grids.length === 0) {
    return false; // there are no grids bellow
  }
  gridTriggers = state.grids.map((grid) => grid.trigger);

  const hasGrid = gridTriggers.some(
    (grid) =>
      price > grid && // Ensure price is above grid level
      price - state.grid_gap <= grid && // Ensure grid is within the range
      (state.grids.find((g) => g.trigger === grid)?.status === "scheduled" ||
        state.grids.find((g) => g.trigger === grid)?.status === "filled")
  );

  return hasGrid;
};

const createGridBellow = (price, state) => {
  let lowergrid =
    state.grids.length > 0
      ? Math.min(...state.grids.map((grid) => grid.trigger))
      : initialprice; // Find highest grid level or default to initialprice

  state.trade_number += 1;
  let grid = {};
  grid.node = 1;
  grid.number = state.trade_number;
  grid.id = `${asset}${state.trade_number}`;
  grid.risk = state.initial_risk;
  grid.state = 1;
  grid.status = "scheduled";
  grid.trigger = lowergrid - state.grid_gap;
  grid.takeprofit = lowergrid;
  state.grids.push(grid);
  state.opened_trades += 1;
  return state;
};

const filltriggeredGrids = (price, state) => {
  // actiually open the trade
  state.grids.forEach((grid) => {
    if (price < grid.trigger && grid.status == "scheduled") {
      grid.status = "filled";
      state.balance -= state.initial_risk;
    }
  });
  return state;
};

const restartSuccessfulTrades = (price, state) => {
  state.grids.forEach((grid) => {
    if (price > grid.takeprofit && grid.status == "filled") {
      grid.status = "closed";
      state.balance +=
        state.initial_risk * (grid.takeprofit / grid.trigger - 1) +
        state.initial_risk;

      state.closed_trades += 1;
    }
  });
  return state;
};

// statefile.loadDefaultStateFile();
const iteration = (setPrice) => {
  let state = statefile.readStateFile();

  price = setPrice;
  console.log("price", price);

  const gridExistsBellow = isGridBellow(price, state);
  console.log("gridExistsBellow", gridExistsBellow);

  if (!gridExistsBellow) {
    state = createGridBellow(price, state);
  }

  state = filltriggeredGrids(price, state);
  state = restartSuccessfulTrades(price, state);
  statefile.writeStateFile(state);
};

iteration(100);
iteration(101);
iteration(102);
iteration(103);
iteration(103);
iteration(103);
