const fs = require("node:fs/promises");
const path = require("node:path");

function includesFeature(html, feature) {
  return html.includes(`data-feature="${feature}"`);
}

function baseScore(results) {
  let score = 100;
  if (!results.engineering.serverStarts) score -= 40;
  if (!results.engineering.httpOk) score -= 25;
  if (!results.engineering.filesPresent) score -= 30;
  if (results.page.blankPage) score -= 20;
  if (results.content.missingFeatures.length) score -= results.content.missingFeatures.length * 5;
  if (!results.page.previewGenerated) score -= 10;
  if (!results.content.hasCta) score -= 10;
  if (results.content.hasPlaceholders) score -= 10;
  return Math.max(0, score);
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function passesDeterministicChecks(report) {
  return (
    report.engineering.serverStarts &&
    report.engineering.httpOk &&
    report.engineering.filesPresent &&
    report.page.previewGenerated &&
    !report.page.blankPage &&
    report.content.missingFeatures.length === 0 &&
    report.content.hasCta &&
    !report.content.hasPlaceholders
  );
}

class VerifierEngine {
  constructor({ modelRouter, llmClient }) {
    this.modelRouter = modelRouter;
    this.llmClient = llmClient;
  }

  async verify({ spec, generation, runtime }) {
    const route = this.modelRouter.route("verifier", { complexity: spec.complexity });
    const html = runtime.html || "";
    const readmePath = path.join(generation.projectDir, "README.md");
    const report = {
      route,
      engineering: {
        serverStarts: Boolean(runtime.ok),
        httpOk: Boolean(runtime.ok && html.includes("<html")),
        filesPresent: false,
      },
      page: {
        blankPage: html.replace(/\s+/g, "").length < 300,
        previewGenerated: Boolean(runtime.screenshot && runtime.screenshot.ok),
        screenshotPath: runtime.screenshot ? runtime.screenshot.path : null,
      },
      content: {
        missingFeatures: [],
        hasCta: includesFeature(html, "cta") || includesFeature(html, "contact_cta") || includesFeature(html, "booking_cta"),
        hasPlaceholders: /lorem ipsum|todo|placeholder/i.test(html),
      },
      generationMode: "deterministic-fallback",
    };

    const requiredFiles = ["index.html", "styles.css", "app.js", "server.js", "README.md", "spec.json", "plan.json"];
    report.engineering.filesPresent = await Promise.all(
      requiredFiles.map(async (file) => {
        try {
          await fs.access(path.join(generation.projectDir, file));
          return true;
        } catch {
          return false;
        }
      })
    ).then((items) => items.every(Boolean));

    for (const feature of spec.coreFeatures) {
      if (!includesFeature(html, feature)) {
        report.content.missingFeatures.push(feature);
      }
    }

    try {
      const readme = await fs.readFile(readmePath, "utf8");
      report.content.readmeMentionsProjectType = readme.includes(spec.projectType);
      report.content.readmePreview = readme.slice(0, 1200);
    } catch {
      report.content.readmeMentionsProjectType = false;
      report.content.readmePreview = "";
    }

    const deterministicScore = baseScore(report);
    report.score = deterministicScore;
    report.passed = report.score >= 80 && passesDeterministicChecks(report);

    if (!this.llmClient || !this.llmClient.isEnabled()) {
      return report;
    }

    const messages = [
      {
        role: "system",
        content: "You are a web project QA verifier. Return JSON only. Evaluate whether the generated project matches the brief. Do not re-check runtime mechanics already supplied. Focus on theme fit, content completeness, CTA clarity, and whether the requested sections seem present.",
      },
      {
        role: "user",
        content: JSON.stringify({
          spec,
          deterministicChecks: {
            missingFeatures: report.content.missingFeatures,
            hasCta: report.content.hasCta,
            placeholderDetected: report.content.hasPlaceholders,
            blankPage: report.page.blankPage,
          },
          htmlSnippet: html.slice(0, 8000),
          readmeSnippet: report.content.readmePreview,
          requiredShape: {
            overallPass: "boolean",
            scoreAdjustment: "number between -10 and 10",
            themeMatchesBrief: "boolean",
            ctaQuality: "string",
            missingSections: ["string"],
            issues: ["string"],
            strengths: ["string"],
          },
        }),
      },
    ];

    try {
      const completion = await this.llmClient.chatJson({
        model: route.model,
        messages,
        metadata: { stage: "verifier" },
      });
      const value = completion.value || {};
      const llmMissing = Array.isArray(value.missingSections)
        ? value.missingSections.map((item) => String(item || "").trim()).filter(Boolean)
        : [];
      const mergedMissing = [...new Set([...report.content.missingFeatures, ...llmMissing.filter((item) => spec.coreFeatures.includes(item))])];
      const adjustment = Number(value.scoreAdjustment);
      report.content.missingFeatures = mergedMissing;
      report.content.themeMatchesBrief = Boolean(value.themeMatchesBrief);
      report.content.ctaQuality = String(value.ctaQuality || "").trim();
      report.llmReview = {
        overallPass: Boolean(value.overallPass),
        issues: Array.isArray(value.issues) ? value.issues.map((item) => String(item || "").trim()).filter(Boolean) : [],
        strengths: Array.isArray(value.strengths) ? value.strengths.map((item) => String(item || "").trim()).filter(Boolean) : [],
        provider: route.provider,
        model: route.model,
      };
      report.generationMode = "litellm";
      report.score = clampScore(deterministicScore + (Number.isFinite(adjustment) ? adjustment : 0));
      report.passed = report.score >= 80 && passesDeterministicChecks(report) && Boolean(value.overallPass);
      return report;
    } catch (error) {
      report.llmError = error.message;
      return report;
    }
  }
}

module.exports = {
  VerifierEngine,
};
