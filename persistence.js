const fs = require('fs');
const path = require('path');

const KNOWN_ITEMS_FILE = path.join(__dirname, 'knownItems.json');

function loadKnownItemsMapping() {
  try {
    if (fs.existsSync(KNOWN_ITEMS_FILE)) {
      const rawData = fs.readFileSync(KNOWN_ITEMS_FILE, 'utf8');
      return JSON.parse(rawData);
    }
  } catch (err) {
    console.error('[!] Error reading known items file:', err);
  }
  return {};
}

function saveKnownItemsMapping(mapping) {
  try {
    fs.writeFileSync(KNOWN_ITEMS_FILE, JSON.stringify(mapping, null, 2), 'utf8');
  } catch (err) {
    console.error('[!] Error writing known items file:', err);
  }
}

module.exports = { loadKnownItemsMapping, saveKnownItemsMapping };
