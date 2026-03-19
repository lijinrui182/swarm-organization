const fs = require("node:fs");

function normalizeEnvValue(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return "";
  }

  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).replace(/\\n/g, "\n");
  }

  return trimmed.replace(/\\n/g, "\n");
}

function loadEnvFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return;
  }

  const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex < 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) {
      continue;
    }

    const value = line.slice(separatorIndex + 1);
    process.env[key] = normalizeEnvValue(value);
  }
}

module.exports = {
  loadEnvFile,
};
