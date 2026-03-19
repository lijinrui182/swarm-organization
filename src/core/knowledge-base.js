const { createId } = require("../utils/id");
const { readJsonFile, writeJsonFile } = require("../utils/json-file");

function tokenize(text) {
  if (!text) {
    return [];
  }

  const matched = String(text).toLowerCase().match(/[a-z0-9\u4e00-\u9fa5]+/g);
  return matched || [];
}

function vectorize(text) {
  const vector = new Map();
  for (const token of tokenize(text)) {
    vector.set(token, (vector.get(token) || 0) + 1);
  }

  let magnitude = 0;
  for (const value of vector.values()) {
    magnitude += value * value;
  }

  return {
    vector,
    magnitude: Math.sqrt(magnitude),
  };
}

function cosineSimilarity(a, b) {
  if (a.magnitude === 0 || b.magnitude === 0) {
    return 0;
  }

  let dot = 0;
  for (const [token, value] of a.vector.entries()) {
    dot += value * (b.vector.get(token) || 0);
  }

  return dot / (a.magnitude * b.magnitude);
}

class KnowledgeBase {
  constructor(filePath) {
    this.filePath = filePath;
    this.records = [];
  }

  async load() {
    const payload = await readJsonFile(this.filePath, { records: [] });
    this.records = payload.records;
  }

  async persist() {
    await writeJsonFile(this.filePath, { records: this.records });
  }

  async addRecord({ taskId, taskType, input, output, tags = [] }) {
    const content = `${input}\n${JSON.stringify(output)}`;
    const embedding = vectorize(content);

    const record = {
      id: createId("kb"),
      taskId,
      taskType,
      input,
      output,
      tags,
      createdAt: new Date().toISOString(),
      tokens: [...embedding.vector.entries()],
      magnitude: embedding.magnitude,
    };

    this.records.unshift(record);
    if (this.records.length > 1000) {
      this.records.length = 1000;
    }

    await this.persist();
    return record;
  }

  search(query, limit = 5) {
    const queryVector = vectorize(query);

    const scored = this.records
      .map((record) => {
        const vector = new Map(record.tokens || []);
        const similarity = cosineSimilarity(queryVector, {
          vector,
          magnitude: record.magnitude || 0,
        });

        return {
          ...record,
          similarity,
        };
      })
      .filter((record) => record.similarity > 0)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map((record) => ({
        id: record.id,
        taskId: record.taskId,
        taskType: record.taskType,
        input: record.input,
        output: record.output,
        tags: record.tags,
        createdAt: record.createdAt,
        similarity: Number(record.similarity.toFixed(4)),
      }));

    return scored;
  }

  stats() {
    return {
      totalRecords: this.records.length,
      latestRecordAt: this.records[0] ? this.records[0].createdAt : null,
    };
  }
}

module.exports = {
  KnowledgeBase,
};
