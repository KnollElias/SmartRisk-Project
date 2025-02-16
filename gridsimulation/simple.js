//simple grid trading bot for backtests

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

getRandomPrice = (price) => {
  return price + Math.floor(Math.random() * 10 - 5) * 0.01;
};

getLevels = (price) => {
  generateLevels(price);
};

isGridBellow = (price, state) => {
  gridTriggers = state.grids.map((grid) => grid.trigger);

  if (gridTriggers == []) {
    return false; // there are no grids bellow
  }
  if (gridTriggers.some((grid) => grid > price - 0.001 - state.grid_gap)) {
    return true; // there is a grid bellow
  }
  return false;
};
createGridBellow = (price, state) => {
  state.trade_number += 1;
  let grid = {};
  grid.node = 1;
  grid.number = state.trade_number;
  grid.id = `${asset}${state.trade_number}`;
  grid.risk = state.initial_risk;
  grid.state = 1;
  grid.status = "scheduled";
  grid.trigger = price;
  grid.takeprofit = price + state.grid_gap;
};

statefile.loadDefaultStateFile();
getLevels(price);
iteration = () => {
  state = statefile.readStateFile();
  price = getRandomPrice(price);
  console.log("price", price);

  isGridBellow = isGridBellow(price, state);
  console.log("isGridBellow", isGridBellow);
  // createGridBellow;
  // console.log(price);
  // scheduleGrids();
};
iteration();
