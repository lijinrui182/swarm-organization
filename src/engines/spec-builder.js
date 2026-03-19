const PROJECT_TYPES = [
  "landing_page",
  "blog_site",
  "tool_directory",
  "travel_landing",
  "dashboard_prototype",
  "saas_homepage",
  "personal_portfolio",
];

const STYLES = ["dark_tech", "clean_saas", "editorial_warm", "vibrant_travel"];

function hasAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function pickProjectType(text) {
  if (hasAny(text, ["博客", "blog", "内容站", "官网"])) return "blog_site";
  if (hasAny(text, ["导航", "tools", "工具站", "目录"])) return "tool_directory";
  if (hasAny(text, ["旅游", "travel", "落地页", "destination"])) return "travel_landing";
  if (hasAny(text, ["后台", "dashboard", "管理系统", "admin"])) return "dashboard_prototype";
  if (hasAny(text, ["saas", "软件", "订阅", "产品主页"])) return "saas_homepage";
  if (hasAny(text, ["作品集", "portfolio", "个人主页", "个人网站"])) return "personal_portfolio";
  return "landing_page";
}

function pickTheme(text) {
  if (hasAny(text, ["深色", "dark", "科技", "赛博", "tech"])) return "dark_tech";
  if (hasAny(text, ["旅行", "自然", "度假", "海边", "warm"])) return "vibrant_travel";
  if (hasAny(text, ["编辑感", "杂志", "高级", "极简", "editorial"])) return "editorial_warm";
  if (hasAny(text, ["商务", "saas", "专业", "clean"])) return "clean_saas";
  return "dark_tech";
}

function pickTargetUsers(prompt) {
  const match = prompt.match(/面向([^，。,.]+?)(的|用户|人群)/);
  if (match) return match[1].trim();
  if (hasAny(prompt, ["大学生", "student"])) return "university students";
  if (hasAny(prompt, ["创作者", "creator"])) return "creators";
  if (hasAny(prompt, ["团队", "team"])) return "startup teams";
  return "general internet users";
}

function featuresForProjectType(projectType) {
  switch (projectType) {
    case "blog_site":
      return ["hero", "featured_posts", "categories", "author_story", "newsletter", "cta"];
    case "tool_directory":
      return ["hero", "search", "categories", "recommended_tools", "newsletter", "cta"];
    case "travel_landing":
      return ["hero", "destinations", "itineraries", "testimonials", "booking_cta", "faq"];
    case "dashboard_prototype":
      return ["sidebar", "kpi_cards", "workflow_board", "insights_panel", "activity_feed", "cta"];
    case "saas_homepage":
      return ["hero", "feature_grid", "workflow", "pricing", "faq", "cta"];
    case "personal_portfolio":
      return ["hero", "selected_work", "capabilities", "process", "testimonials", "contact_cta"];
    default:
      return ["hero", "value_props", "feature_grid", "social_proof", "faq", "cta"];
  }
}

function pagesForProjectType(projectType) {
  return projectType === "dashboard_prototype" ? ["dashboard_home"] : ["home"];
}

function techStackForFramework(framework) {
  if (framework === "nextjs") {
    return {
      requested: "nextjs",
      runtimeReady: "static-node-mvp",
      note: "The current local runtime keeps delivery stable with a zero-dependency Node template while preserving the web delivery workflow.",
    };
  }
  return {
    requested: framework || "static-node",
    runtimeReady: framework || "static-node",
    note: null,
  };
}

function acceptanceCriteria(projectType, features) {
  const base = [
    "Generated project files exist in /project.",
    "Project can be started locally with the included command.",
    "Home page loads without blank screen or 404.",
    "Core sections requested by the brief are present.",
    "README and delivery report are included.",
  ];
  if (projectType === "dashboard_prototype") base.push("Dashboard contains KPI, workflow, and recent activity regions.");
  if (features.includes("pricing")) base.push("Pricing content is visible and readable.");
  return base;
}

function complexityFromPrompt(prompt, features) {
  const length = prompt.length;
  if (length > 160 || features.length > 6) return "high";
  if (length < 60) return "low";
  return "medium";
}

function buildFallbackSpec(input) {
  const prompt = String(input.prompt || "").trim();
  const normalized = prompt.toLowerCase();
  const projectType = pickProjectType(normalized + " " + prompt);
  const style = input.style || pickTheme(normalized + " " + prompt);
  const framework = input.framework || "nextjs";
  const coreFeatures = featuresForProjectType(projectType);
  const complexity = complexityFromPrompt(prompt, coreFeatures);

  return {
    prompt,
    outputType: input.outputType || "web_project",
    projectType,
    targetUsers: pickTargetUsers(prompt),
    style,
    framework,
    techStack: techStackForFramework(framework),
    pages: pagesForProjectType(projectType),
    coreFeatures,
    contentTone: hasAny(normalized, ["年轻", "student", "活力"]) ? "energetic" : "clear and confident",
    visualDirection: style,
    acceptanceCriteria: acceptanceCriteria(projectType, coreFeatures),
    complexity,
  };
}

function normalizeProjectType(value, fallback) {
  return PROJECT_TYPES.includes(value) ? value : fallback;
}

function normalizeStyle(value, fallback) {
  return STYLES.includes(value) ? value : fallback;
}

function normalizeStringArray(value, fallback) {
  if (!Array.isArray(value)) return fallback;
  const items = value.map((item) => String(item || "").trim()).filter(Boolean);
  return items.length ? items : fallback;
}

function normalizeFeatures(value, fallback, projectType) {
  const allowed = new Set(["hero", ...featuresForProjectType(projectType), "cta", "contact_cta", "booking_cta"]);
  const items = normalizeStringArray(value, fallback).filter((item) => allowed.has(item));
  return items.length ? [...new Set(items)] : fallback;
}

class SpecBuilder {
  constructor({ modelRouter, llmClient }) {
    this.modelRouter = modelRouter;
    this.llmClient = llmClient;
  }

  async build(input) {
    const fallback = buildFallbackSpec(input);
    const route = this.modelRouter.route("spec_builder", { complexity: fallback.complexity });

    if (!this.llmClient || !this.llmClient.isEnabled()) {
      return {
        ...fallback,
        routerDecision: route,
        generationMode: "deterministic-fallback",
      };
    }

    const messages = [
      {
        role: "system",
        content: "You are a product-spec extraction engine. Convert a one-line web project brief into a strict JSON object. Use only these project types: landing_page, blog_site, tool_directory, travel_landing, dashboard_prototype, saas_homepage, personal_portfolio. Use only these styles: dark_tech, clean_saas, editorial_warm, vibrant_travel. Return JSON only.",
      },
      {
        role: "user",
        content: JSON.stringify({
          prompt: fallback.prompt,
          requestedFramework: fallback.framework,
          requestedStyle: input.style || null,
          requiredShape: {
            projectType: "string",
            targetUsers: "string",
            style: "string",
            pages: ["string"],
            coreFeatures: ["string"],
            contentTone: "string",
            visualDirection: "string",
            acceptanceCriteria: ["string"],
          },
        }),
      },
    ];

    try {
      const completion = await this.llmClient.chatJson({
        model: route.model,
        messages,
        metadata: { stage: "spec_builder" },
      });
      const llm = completion.value || {};
      const projectType = normalizeProjectType(String(llm.projectType || ""), fallback.projectType);
      const style = normalizeStyle(String(llm.style || ""), fallback.style);
      const coreFeatures = normalizeFeatures(llm.coreFeatures, fallback.coreFeatures, projectType);
      const pages = normalizeStringArray(llm.pages, pagesForProjectType(projectType));
      const spec = {
        ...fallback,
        projectType,
        targetUsers: String(llm.targetUsers || fallback.targetUsers).trim(),
        style,
        pages,
        coreFeatures,
        contentTone: String(llm.contentTone || fallback.contentTone).trim(),
        visualDirection: String(llm.visualDirection || style).trim(),
        acceptanceCriteria: normalizeStringArray(llm.acceptanceCriteria, acceptanceCriteria(projectType, coreFeatures)),
        complexity: complexityFromPrompt(fallback.prompt, coreFeatures),
        llm: {
          provider: route.provider,
          model: route.model,
        },
        routerDecision: route,
        generationMode: "litellm",
      };
      spec.techStack = techStackForFramework(spec.framework);
      return spec;
    } catch (error) {
      return {
        ...fallback,
        routerDecision: route,
        generationMode: "deterministic-fallback",
        llmError: error.message,
      };
    }
  }
}

module.exports = {
  SpecBuilder,
};
