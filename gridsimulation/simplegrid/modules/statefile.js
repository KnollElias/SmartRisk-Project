const fs = require("fs");
const path = require("path");

const STATE_FILE = path.join(__dirname, "statefile.json");

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

// Example usage
const state = readStateFile();
if (state) {
  state.age += 1;
  writeStateFile(state);
}
