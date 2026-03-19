const { sha256 } = require("../utils/hash");
const { readJsonFile, writeJsonFile } = require("../utils/json-file");

class CostManager {
  constructor(filePath) {
    this.filePath = filePath;
    this.cache = {};
    this.usage = [];
  }

  async load() {
    const payload = await readJsonFile(this.filePath, { cache: {}, usage: [] });
    this.cache = payload.cache || {};
    this.usage = payload.usage || [];
  }

  async persist() {
    await writeJsonFile(this.filePath, {
      cache: this.cache,
      usage: this.usage,
    });
  }

  createCacheKey(taskType, input) {
    return sha256(`${taskType}::${String(input).trim()}`);
  }

  getCachedResult(key) {
    return this.cache[key] || null;
  }

  async setCachedResult(key, result) {
    this.cache[key] = {
      result,
      cachedAt: new Date().toISOString(),
    };
    await this.persist();
  }

  estimateTaskCost(taskType, input, complexity = "medium") {
    const size = Math.max(String(input || "").length, 1);
    const base = taskType === "image_generation" ? 0.08 : taskType === "code_generation" ? 0.04 : 0.02;
    const complexityFactor = complexity === "high" ? 1.6 : complexity === "low" ? 0.7 : 1;
    const sizeFactor = Math.min(2, 0.8 + size / 600);
    return Number((base * complexityFactor * sizeFactor).toFixed(4));
  }

  async recordInvocation(taskId, detail) {
    const item = {
      taskId,
      ...detail,
      timestamp: new Date().toISOString(),
    };

    this.usage.push(item);
    if (this.usage.length > 5000) {
      this.usage.shift();
    }

    await this.persist();
  }

  summarize() {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const recent = this.usage.filter((item) => new Date(item.timestamp).getTime() >= oneDayAgo);

    let apiCalls = 0;
    let localCalls = 0;
    let avgLatency = 0;

    for (const item of recent) {
      if (item.kind === "api") {
        apiCalls += 1;
      } else {
        localCalls += 1;
      }
      avgLatency += item.latencyMs || 0;
    }

    avgLatency = recent.length ? Number((avgLatency / recent.length).toFixed(2)) : 0;

    return {
      cacheEntries: Object.keys(this.cache).length,
      recentCalls: recent.length,
      apiCalls,
      localCalls,
      avgLatencyMs: avgLatency,
    };
  }
}

module.exports = {
  CostManager,
};
