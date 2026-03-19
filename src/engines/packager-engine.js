const fs = require("node:fs/promises");
const path = require("node:path");
const { createZipFromDirectory } = require("../utils/simple-zip");

class PackagerEngine {
  constructor({ modelRouter }) {
    this.modelRouter = modelRouter;
  }

  async package({ task, spec, plan, generation, verification, repairResult }) {
    const route = this.modelRouter.route("finalizer", { complexity: spec.complexity });
    const zipPath = path.join(generation.deliveryDir, "project.zip");
    const reportPath = path.join(generation.deliveryDir, "delivery_report.json");
    const summaryPath = path.join(generation.deliveryDir, "delivery_summary.md");

    try {
      await fs.unlink(zipPath);
    } catch {}

    await createZipFromDirectory(generation.projectDir, zipPath);

    const report = {
      route,
      taskId: task.id,
      prompt: task.input,
      spec,
      plan,
      verification,
      repair: repairResult ? repairResult.attempts : [],
      deliveredAt: new Date().toISOString(),
      artifacts: {
        projectDir: generation.projectDir,
        zipPath,
        previewPath: verification.page.screenshotPath,
      },
      suggestions: [
        "Add secondary pages or real backend data integration next.",
        "Replace static copy with product-specific content and assets.",
        "Migrate the generator to the planned Python/FastAPI stack when runtime dependencies are ready.",
      ],
    };

    const summary = `# Delivery Summary\n\n- Task ID: ${task.id}\n- Project type: ${spec.projectType}\n- Style: ${spec.style}\n- Verification score: ${verification.score}\n- Zip artifact: ${zipPath}\n- Preview: ${verification.page.screenshotPath || "not available"}\n`;

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
    await fs.writeFile(summaryPath, summary, "utf8");

    return {
      route,
      reportPath,
      summaryPath,
      zipPath,
      previewPath: verification.page.screenshotPath,
    };
  }
}

module.exports = {
  PackagerEngine,
};
