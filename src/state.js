const fs = require("fs");
const path = require("path");

const STATE_PATH = path.resolve(process.cwd(), ".lottie-whatsapp.json");

function readState() {
  try {
    if (!fs.existsSync(STATE_PATH)) {
      return createEmptyState();
    }

    const parsed = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
    return {
      defaults: parsed?.defaults || {},
      recent: {
        ...createEmptyState().recent,
        ...(parsed?.recent || {})
      }
    };
  } catch {
    return createEmptyState();
  }
}

function createEmptyState() {
  return {
    defaults: {},
    recent: {
      images: [],
      outputs: [],
      targets: [],
      authFolders: []
    }
  };
}

function uniqueRecent(values, nextValue, max = 5) {
  const normalized = [nextValue, ...values].filter(Boolean);
  return [...new Set(normalized)].slice(0, max);
}

function writeState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function updateState(patch) {
  const current = readState();
  const next = patch(current);
  writeState(next);
  return next;
}

module.exports = {
  STATE_PATH,
  readState,
  updateState,
  uniqueRecent
};
