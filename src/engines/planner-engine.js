const DEFAULT_STEPS = [
  "Generate structured spec from one-line requirement",
  "Select delivery template and design tokens",
  "Compose page information architecture and sections",
  "Generate project files and runtime scaffold",
  "Run the generated project locally",
  "Capture preview and verify acceptance criteria",
  "Repair defects when verification fails",
  "Package project source, preview, README, and delivery report",
];

const DEFAULT_FILE_PLAN = [
  { path: "project/index.html", purpose: "Primary page entry" },
  { path: "project/styles.css", purpose: "Visual system and layout" },
  { path: "project/app.js", purpose: "Small client interactions" },
  { path: "project/server.js", purpose: "Zero-dependency preview runtime" },
  { path: "project/README.md", purpose: "Usage guide" },
  { path: "project/spec.json", purpose: "Structured project brief" },
  { path: "project/plan.json", purpose: "Execution plan snapshot" },
  { path: "preview/home.svg", purpose: "Rendered homepage preview" },
  { path: "delivery_report.json", purpose: "Acceptance and delivery summary" },
  { path: "project.zip", purpose: "Downloadable source package" },
];

const DEFAULT_VERIFICATION_PLAN = {
  engineering: ["server_starts", "http_200", "files_present"],
  page: ["no_blank_page", "core_sections_present", "preview_generated"],
  content: ["theme_matches_brief", "cta_present", "placeholder_text_absent"],
};

function normalizeSteps(value) {
  if (!Array.isArray(value)) return DEFAULT_STEPS;
  const steps = value.map((item) => String(item || "").trim()).filter(Boolean);
  return steps.length ? steps : DEFAULT_STEPS;
}

function normalizeFilePlan(value) {
  if (!Array.isArray(value)) return DEFAULT_FILE_PLAN;
  const items = value
    .map((item) => ({
      path: String(item?.path || "").trim(),
      purpose: String(item?.purpose || "").trim(),
    }))
    .filter((item) => item.path && item.purpose);
  return items.length ? items : DEFAULT_FILE_PLAN;
}

function normalizeVerificationPlan(value) {
  if (!value || typeof value !== "object") return DEFAULT_VERIFICATION_PLAN;
  const keys = ["engineering", "page", "content"];
  return keys.reduce((acc, key) => {
    const list = Array.isArray(value[key]) ? value[key].map((item) => String(item || "").trim()).filter(Boolean) : [];
    acc[key] = list.length ? list : DEFAULT_VERIFICATION_PLAN[key];
    return acc;
  }, {});
}

class PlannerEngine {
  constructor({ modelRouter, llmClient }) {
    this.modelRouter = modelRouter;
    this.llmClient = llmClient;
  }

  async build(spec) {
    const route = this.modelRouter.route("planner", { complexity: spec.complexity });
    const fallback = {
      route,
      steps: DEFAULT_STEPS,
      filePlan: DEFAULT_FILE_PLAN,
      verificationPlan: DEFAULT_VERIFICATION_PLAN,
      repairPolicy: {
        maxAttempts: 2,
        strategy: "rebuild missing sections or rerun runtime when verification fails",
      },
      generationMode: "deterministic-fallback",
    };

    if (!this.llmClient || !this.llmClient.isEnabled()) {
      return fallback;
    }

    const messages = [
      {
        role: "system",
        content: "You are a web delivery planning engine. Return JSON only. Build a stable delivery plan for a templated web project pipeline with deterministic generation, runtime validation, repair, and packaging.",
      },
      {
        role: "user",
        content: JSON.stringify({
          spec,
          requiredShape: {
            steps: ["string"],
            filePlan: [{ path: "string", purpose: "string" }],
            verificationPlan: {
              engineering: ["string"],
              page: ["string"],
              content: ["string"],
            },
            repairPolicy: {
              maxAttempts: "number",
              strategy: "string",
            },
          },
        }),
      },
    ];

    try {
      const completion = await this.llmClient.chatJson({
        model: route.model,
        messages,
        metadata: { stage: "planner" },
      });
      const value = completion.value || {};
      return {
        route,
        steps: normalizeSteps(value.steps),
        filePlan: normalizeFilePlan(value.filePlan),
        verificationPlan: normalizeVerificationPlan(value.verificationPlan),
        repairPolicy: {
          maxAttempts: Number(value.repairPolicy?.maxAttempts) > 0 ? Number(value.repairPolicy.maxAttempts) : 2,
          strategy: String(value.repairPolicy?.strategy || fallback.repairPolicy.strategy).trim(),
        },
        llm: {
          provider: route.provider,
          model: route.model,
        },
        generationMode: "litellm",
      };
    } catch (error) {
      return {
        ...fallback,
        llmError: error.message,
      };
    }
  }
}

module.exports = {
  PlannerEngine,
};
