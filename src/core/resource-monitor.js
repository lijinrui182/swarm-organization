const os = require("node:os");

class ResourceMonitor {
  constructor({ scheduler, taskStore, costManager, knowledgeBase, intervalMs = 5000 }) {
    this.scheduler = scheduler;
    this.taskStore = taskStore;
    this.costManager = costManager;
    this.knowledgeBase = knowledgeBase;
    this.intervalMs = intervalMs;
    this.timer = null;
    this.latest = null;
    this.history = [];
  }

  start() {
    if (this.timer) {
      return;
    }

    this.sample();
    this.timer = setInterval(() => this.sample(), this.intervalMs);
  }

  stop() {
    if (!this.timer) {
      return;
    }

    clearInterval(this.timer);
    this.timer = null;
  }

  sample() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    const snapshot = {
      timestamp: new Date().toISOString(),
      cpuCount: os.cpus().length,
      loadAvg: os.loadavg(),
      totalMem,
      freeMem,
      usedMem,
      usedMemRatio: totalMem === 0 ? 0 : Number((usedMem / totalMem).toFixed(4)),
      queueLength: this.scheduler.getQueueLength(),
      runningTasks: this.scheduler.getRunningCount(),
      taskTotals: {
        queued: 0,
        running: 0,
        succeeded: 0,
        failed: 0,
      },
      costSummary: this.costManager.summarize(),
      knowledgeBase: this.knowledgeBase.stats(),
    };

    for (const task of this.taskStore.listTasks(500)) {
      snapshot.taskTotals[task.status] = (snapshot.taskTotals[task.status] || 0) + 1;
    }

    this.latest = snapshot;
    this.history.push(snapshot);

    if (this.history.length > 120) {
      this.history.shift();
    }
  }

  getMetrics() {
    return {
      latest: this.latest,
      history: this.history,
    };
  }
}

module.exports = {
  ResourceMonitor,
};
