const path = require("node:path");
const { loadEnvFile } = require("./utils/env-loader");

const ROOT_DIR = path.resolve(__dirname, "..");
loadEnvFile(path.join(ROOT_DIR, ".env"));

module.exports = {
  ROOT_DIR,
  DATA_DIR: path.join(ROOT_DIR, "data"),
  DELIVERIES_DIR: path.join(ROOT_DIR, "deliveries"),
  WEB_DIR: path.join(ROOT_DIR, "web"),
  TASK_STORE_FILE: path.join(ROOT_DIR, "data", "tasks.json"),
  KB_FILE: path.join(ROOT_DIR, "data", "knowledge-base.json"),
  COST_FILE: path.join(ROOT_DIR, "data", "cost-cache.json"),
  DEFAULT_PORT: Number(process.env.PORT || 3000),
  MAX_CONCURRENCY: 2,
  MAX_REPAIR_ATTEMPTS: 2,
  LITELLM_BASE_URL: process.env.LITELLM_BASE_URL || "",
  LITELLM_API_KEY: process.env.LITELLM_API_KEY || "",
  LITELLM_TIMEOUT_MS: Number(process.env.LITELLM_TIMEOUT_MS || 45000),
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || "",
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "",
};
