class RepairerEngine {
  constructor({ maxAttempts, generatorEngine, runtimeEngine, verifierEngine, modelRouter }) {
    this.maxAttempts = maxAttempts;
    this.generatorEngine = generatorEngine;
    this.runtimeEngine = runtimeEngine;
    this.verifierEngine = verifierEngine;
    this.modelRouter = modelRouter;
  }

  async repair({ task, spec, plan, generation, verification, runtime }) {
    const attempts = [];
    let currentGeneration = generation;
    let currentVerification = verification;
    let currentRuntime = runtime || null;
    const route = this.modelRouter.route("repairer", { complexity: spec.complexity });

    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      if (currentVerification.passed) {
        break;
      }

      const repairContext = {
        route,
        attempt,
        missingFeatures: currentVerification.content.missingFeatures,
        blankPage: currentVerification.page.blankPage,
        previewGenerated: currentVerification.page.previewGenerated,
        score: currentVerification.score,
      };

      currentGeneration = await this.generatorEngine.generate({
        task,
        spec,
        plan,
        repairContext,
      });
      currentRuntime = await this.runtimeEngine.run({ task, spec, generation: currentGeneration });
      currentVerification = await this.verifierEngine.verify({
        spec,
        generation: currentGeneration,
        runtime: currentRuntime,
      });

      attempts.push({
        attempt,
        score: currentVerification.score,
        passed: currentVerification.passed,
      });
    }

    return {
      attempts,
      generation: currentGeneration,
      runtime: currentRuntime,
      verification: currentVerification,
    };
  }
}

module.exports = {
  RepairerEngine,
};
