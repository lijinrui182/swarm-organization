const path = require("node:path");

class DeliveryEngine {
  constructor({
    concurrency,
    taskStore,
    eventHub,
    knowledgeBase,
    costManager,
    specBuilder,
    plannerEngine,
    generatorEngine,
    runtimeEngine,
    verifierEngine,
    repairerEngine,
    packagerEngine,
  }) {
    this.concurrency = concurrency;
    this.taskStore = taskStore;
    this.eventHub = eventHub;
    this.knowledgeBase = knowledgeBase;
    this.costManager = costManager;
    this.specBuilder = specBuilder;
    this.plannerEngine = plannerEngine;
    this.generatorEngine = generatorEngine;
    this.runtimeEngine = runtimeEngine;
    this.verifierEngine = verifierEngine;
    this.repairerEngine = repairerEngine;
    this.packagerEngine = packagerEngine;
    this.queue = [];
    this.running = new Set();
  }

  getQueueLength() {
    return this.queue.length;
  }

  getRunningCount() {
    return this.running.size;
  }

  enqueue(task) {
    this.queue.push(task.id);
    this.eventHub.publish("task.queued", { taskId: task.id });
    this.processQueue().catch((error) => {
      this.eventHub.publish("task.error", { taskId: task.id, error: error.message });
    });
  }

  async processQueue() {
    while (this.running.size < this.concurrency && this.queue.length > 0) {
      const taskId = this.queue.shift();
      this.running.add(taskId);
      this.runTask(taskId)
        .catch((error) => {
          this.eventHub.publish("task.error", { taskId, error: error.message });
        })
        .finally(() => {
          this.running.delete(taskId);
          this.processQueue().catch(() => {});
        });
    }
  }

  async runTask(taskId) {
    const task = this.taskStore.getTask(taskId);
    if (!task) return;

    this.taskStore.markRunning(taskId);
    this.taskStore.incrementMetric(taskId, "estimatedCost", this.costManager.estimateTaskCost(task.taskType, task.input));
    await this.taskStore.persist();
    this.eventHub.publish("task.running", { taskId });

    try {
      const spec = await this.runStep(taskId, "spec_builder", "Spec Builder", async () => {
        const built = await this.specBuilder.build(task.context);
        this.taskStore.updateTask(taskId, (current) => ({ ...current, spec: built }));
        await this.taskStore.persist();
        return built;
      });

      const plan = await this.runStep(taskId, "planner", "Planner", async () => {
        const built = await this.plannerEngine.build(spec);
        this.taskStore.setPlan(taskId, built);
        await this.taskStore.persist();
        return built;
      });

      let generation = await this.runStep(taskId, "generator", "Generator", async () => this.generatorEngine.generate({ task: this.taskStore.getTask(taskId), spec, plan }));
      let runtime = await this.runStep(taskId, "runner", "Runner", async () => this.runtimeEngine.run({ task: this.taskStore.getTask(taskId), spec, generation }));
      let verification = await this.runStep(taskId, "verifier", "Verifier", async () => this.verifierEngine.verify({ spec, generation, runtime }));

      let repairResult = null;
      if (!verification.passed) {
        repairResult = await this.runStep(taskId, "repairer", "Repairer", async () => {
          return this.repairerEngine.repair({ task: this.taskStore.getTask(taskId), spec, plan, generation, verification, runtime });
        });
        generation = repairResult.generation;
        runtime = repairResult.runtime || runtime;
        verification = repairResult.verification;
      }

      const packaged = await this.runStep(taskId, "packager", "Packager", async () => {
        return this.packagerEngine.package({ task: this.taskStore.getTask(taskId), spec, plan, generation, verification, repairResult });
      });

      await this.knowledgeBase.addRecord({
        taskId,
        taskType: task.taskType,
        input: task.input,
        output: { spec, plan, verification, packaged },
        tags: [spec.projectType, spec.style, task.taskType],
      });

      const result = {
        spec,
        plan,
        generation: {
          mode: generation.generationMode,
          llmError: generation.llmError,
          route: generation.route,
        },
        verification,
        repair: repairResult ? repairResult.attempts : [],
        artifacts: {
          projectDir: generation.projectDir,
          projectUrl: `/artifacts/${taskId}/project/`,
          previewUrl: packaged.previewPath ? `/artifacts/${taskId}/${path.relative(generation.deliveryDir, packaged.previewPath).replace(/\\/g, "/")}` : null,
          zipUrl: `/artifacts/${taskId}/project.zip`,
          reportUrl: `/artifacts/${taskId}/delivery_report.json`,
          summaryUrl: `/artifacts/${taskId}/delivery_summary.md`,
        },
      };

      this.taskStore.markCompleted(taskId, result);
      await this.taskStore.persist();
      this.eventHub.publish("task.succeeded", { taskId, result });
    } catch (error) {
      this.taskStore.markFailed(taskId, error.message);
      await this.taskStore.persist();
      this.eventHub.publish("task.failed", { taskId, error: error.message });
    }
  }

  async runStep(taskId, stepId, name, action) {
    this.taskStore.upsertStep(taskId, stepId, { id: stepId, name, status: "running", startedAt: new Date().toISOString(), finishedAt: null, error: null });
    await this.taskStore.persist();
    this.eventHub.publish("task.step.running", { taskId, stepId, name });
    try {
      const output = await action();
      this.taskStore.upsertStep(taskId, stepId, { status: "succeeded", finishedAt: new Date().toISOString(), output });
      await this.taskStore.persist();
      this.eventHub.publish("task.step.succeeded", { taskId, stepId, name });
      return output;
    } catch (error) {
      this.taskStore.upsertStep(taskId, stepId, { status: "failed", finishedAt: new Date().toISOString(), error: error.message });
      await this.taskStore.persist();
      this.eventHub.publish("task.step.failed", { taskId, stepId, name, error: error.message });
      throw error;
    }
  }
}

module.exports = {
  DeliveryEngine,
};
