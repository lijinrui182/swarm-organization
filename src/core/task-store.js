const { createId } = require("../utils/id");
const { readJsonFile, writeJsonFile } = require("../utils/json-file");

class TaskStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.tasks = new Map();
  }

  async load() {
    const payload = await readJsonFile(this.filePath, { tasks: [] });
    for (const task of payload.tasks) {
      this.tasks.set(task.id, task);
    }
  }

  async persist() {
    const tasks = [...this.tasks.values()].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    await writeJsonFile(this.filePath, { tasks });
  }

  createTask({ taskType, input, context = {} }) {
    const now = new Date().toISOString();
    const task = {
      id: createId("task"),
      taskType: taskType || "text_generation",
      input: input || "",
      context,
      status: "queued",
      createdAt: now,
      updatedAt: now,
      startedAt: null,
      finishedAt: null,
      plan: null,
      steps: {},
      result: null,
      error: null,
      metrics: {
        estimatedCost: 0,
        retryCount: 0,
        apiCalls: 0,
        localCalls: 0,
        durationMs: 0,
      },
    };

    this.tasks.set(task.id, task);
    return task;
  }

  getTask(taskId) {
    return this.tasks.get(taskId) || null;
  }

  listTasks(limit = 50) {
    return [...this.tasks.values()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  updateTask(taskId, updater) {
    const existing = this.getTask(taskId);
    if (!existing) {
      return null;
    }

    const nextTask = typeof updater === "function" ? updater(existing) : { ...existing, ...updater };
    nextTask.updatedAt = new Date().toISOString();
    this.tasks.set(taskId, nextTask);
    return nextTask;
  }

  markRunning(taskId) {
    const now = new Date().toISOString();
    return this.updateTask(taskId, (task) => ({
      ...task,
      status: "running",
      startedAt: task.startedAt || now,
    }));
  }

  markCompleted(taskId, result) {
    const now = new Date().toISOString();
    return this.updateTask(taskId, (task) => ({
      ...task,
      status: "succeeded",
      result,
      error: null,
      finishedAt: now,
      metrics: {
        ...task.metrics,
        durationMs: task.startedAt ? new Date(now).getTime() - new Date(task.startedAt).getTime() : 0,
      },
    }));
  }

  markFailed(taskId, errorMessage) {
    const now = new Date().toISOString();
    return this.updateTask(taskId, (task) => ({
      ...task,
      status: "failed",
      error: errorMessage,
      finishedAt: now,
      metrics: {
        ...task.metrics,
        durationMs: task.startedAt ? new Date(now).getTime() - new Date(task.startedAt).getTime() : 0,
      },
    }));
  }

  setPlan(taskId, plan) {
    return this.updateTask(taskId, (task) => ({ ...task, plan }));
  }

  upsertStep(taskId, stepId, patch) {
    return this.updateTask(taskId, (task) => {
      const steps = { ...task.steps };
      const current = steps[stepId] || {
        id: stepId,
        status: "pending",
        attempts: 0,
        startedAt: null,
        finishedAt: null,
        output: null,
        error: null,
      };

      const next = { ...current, ...patch };
      steps[stepId] = next;

      return {
        ...task,
        steps,
      };
    });
  }

  incrementMetric(taskId, metricKey, delta = 1) {
    return this.updateTask(taskId, (task) => ({
      ...task,
      metrics: {
        ...task.metrics,
        [metricKey]: (task.metrics[metricKey] || 0) + delta,
      },
    }));
  }
}

module.exports = {
  TaskStore,
};
