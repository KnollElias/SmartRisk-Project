const fs = require("fs");
const path = require("path");

const STATE_FILE = path.join(__dirname, "../statefiles/statefile.json");
const DEFAULT_FILE = path.join(
  __dirname,
  "../statefiles/defaults/statefile single default.json"
);

/**
 * Reads the state from the JSON file.
 * @returns {object|null} The parsed state object, or null if the file does not exist.
 */
function readStateFile() {
  try {
    if (!fs.existsSync(STATE_FILE)) {
      console.warn(`State file not found: ${STATE_FILE}`);
      return null;
    }
    const data = fs.readFileSync(STATE_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading state file:", error);
    return null;
  }
}

/**
 * Writes an updated state to the JSON file.
 * @param {object} newState - The updated state object.
 * @returns {boolean} True if the write was successful, false otherwise.
 */
function writeStateFile(newState) {
  try {
    const tempFile = `${STATE_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(newState, null, 4), "utf8");
    fs.renameSync(tempFile, STATE_FILE);
    return true;
  } catch (error) {
    console.error("Error writing state file:", error);
    return false;
  }
}

/**
 * Loads the default statefile by copying and overwriting the current one.
 * @returns {Promise<boolean>} True if the reset was successful, false otherwise.
 */
async function loadDefaultStateFile() {
  try {
    if (!fs.existsSync(DEFAULT_FILE)) {
      console.error(`Default state file not found: ${DEFAULT_FILE}`);
      return false;
    }
    await fs.promises.copyFile(DEFAULT_FILE, STATE_FILE);
    console.log(`State file reset to default.`);
    return true;
  } catch (error) {
    console.error("Error resetting state file:", error);
    return false;
  }
}

module.exports = {
  readStateFile,
  writeStateFile,
  loadDefaultStateFile,
};
