const statefile = require("./modules/statefile");

initialBalance = 100;
initialRisk = 1;

scaleCount = 1;
scalePeak = 6;
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
*/

const _ = statefile.loadDefaultStateFile();
console.warn(_);

let price = 100;
function scheduleGrids() {
  const state = statefile.readStateFile();
  console.log(state);
  if (state == null) {
    console.error("State file is missing.");
    return;
  }

  const scaleCount = state.nodes.length;

  for (let i = 0; i < scaleCount; i++) {
    const node = state.nodes[i].index;
    const grid = state.grids[i].node;
    // const gridState = grid.state;
    console.log("grid", grid, "node", node);

    // if (gridState == "closed") {
    //   grid.state = "scheduled";
    //   grid.currentGrid = 1;
    //   grid.currentBalance = initialBalance;
    //   grid.currentRisk = initialRisk;
    // }
  }

  // if (state.gridState == "closed") {
  //   state.gridState = "scheduled";
  //   state.currentGrid = 1;
  //   state.currentBalance = initialBalance;
  //   state.currentRisk = initialRisk;
  //   statefile.writeStateFile(state);
  // }
}
console.log(scheduleGrids(price));
