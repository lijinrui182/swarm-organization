const fs = require("node:fs/promises");
const path = require("node:path");

async function ensureParentDir(filePath) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
}

async function readJsonFile(filePath, fallback) {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      return fallback;
    }
    throw error;
  }
}

async function writeJsonFile(filePath, value) {
  await ensureParentDir(filePath);
  const data = JSON.stringify(value, null, 2);
  await fs.writeFile(filePath, data, "utf8");
}

module.exports = {
  readJsonFile,
  writeJsonFile,
};
