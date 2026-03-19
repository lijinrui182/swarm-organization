const DEFAULT_MODELS = {
  openai: {
    spec_builder: "openai/gpt-5-mini-2025-08-07",
    planner: "openai/gpt-5",
    generator: "openai/gpt-5",
    verifier: "openai/gpt-5-mini-2025-08-07",
    repairer: "openai/gpt-5-mini-2025-08-07",
    finalizer: "openai/gpt-5-mini-2025-08-07",
  },
  anthropic: {
    spec_builder: "anthropic/claude-sonnet-4-5-20250929",
    planner: "anthropic/claude-sonnet-4-5-20250929",
    generator: "anthropic/claude-sonnet-4-5-20250929",
    verifier: "anthropic/claude-sonnet-4-5-20250929",
    repairer: "anthropic/claude-sonnet-4-5-20250929",
    finalizer: "anthropic/claude-sonnet-4-5-20250929",
  },
  gemini: {
    spec_builder: "gemini/gemini-2.5-flash",
    planner: "gemini/gemini-2.5-flash",
    generator: "gemini/gemini-2.5-flash",
    verifier: "gemini/gemini-2.5-flash",
    repairer: "gemini/gemini-2.5-flash",
    finalizer: "gemini/gemini-2.5-flash",
  },
  deepseek: {
    spec_builder: "deepseek/deepseek-chat",
    planner: "deepseek/deepseek-chat",
    generator: "deepseek/deepseek-chat",
    verifier: "deepseek/deepseek-chat",
    repairer: "deepseek/deepseek-chat",
    finalizer: "deepseek/deepseek-chat",
  },
};

function envKey(prefix, stage) {
  return `${prefix}_${stage.toUpperCase()}`;
}

function stageProvider(stage) {
  return (process.env[envKey("MODEL_PROVIDER", stage)] || "openai").toLowerCase();
}

function stageModel(stage, provider) {
  return process.env[envKey("MODEL_NAME", stage)] || DEFAULT_MODELS[provider]?.[stage] || DEFAULT_MODELS.openai[stage];
}

function stageFallbackModels(stage, provider) {
  const explicit = process.env[envKey("MODEL_FALLBACKS", stage)];
  if (explicit) {
    return explicit.split(",").map((item) => item.trim()).filter(Boolean);
  }

  return Object.entries(DEFAULT_MODELS)
    .filter(([name]) => name !== provider)
    .map(([, models]) => models[stage])
    .filter(Boolean);
}

function directProviderConfigured(provider) {
  if (provider === "deepseek") {
    return Boolean(process.env.DEEPSEEK_API_KEY);
  }
  if (provider === "gemini") {
    return Boolean(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY);
  }
  return false;
}

function routeReason(stage, provider, gatewayConfigured, directConfigured) {
  if (gatewayConfigured) {
    return `Primary ${stage} route uses ${provider} via LiteLLM when configured, with deterministic fallback in-process.`;
  }
  if (directConfigured) {
    return `Primary ${stage} route uses the direct ${provider} API because LiteLLM is not configured on this workstation.`;
  }
  return `Primary ${stage} route expects ${provider}, but no LiteLLM gateway or direct provider credentials are configured, so the stage will fall back deterministically.`;
}

class ModelRouter {
  route(stage, context = {}) {
    const complexity = context.complexity || "medium";
    const provider = stageProvider(stage);
    const model = stageModel(stage, provider);
    const fallbackModels = stageFallbackModels(stage, provider);
    const gatewayConfigured = Boolean(process.env.LITELLM_BASE_URL);
    const directConfigured = directProviderConfigured(provider);

    return {
      stage,
      complexity,
      provider,
      model,
      fallbackModels,
      gatewayConfigured,
      directConfigured,
      supportedProviders: Object.keys(DEFAULT_MODELS),
      reason: routeReason(stage, provider, gatewayConfigured, directConfigured),
    };
  }

  status() {
    return {
      gatewayConfigured: Boolean(process.env.LITELLM_BASE_URL),
      supportedProviders: Object.keys(DEFAULT_MODELS),
      stages: ["spec_builder", "planner", "generator", "verifier", "repairer", "finalizer"].reduce((acc, stage) => {
        acc[stage] = this.route(stage);
        return acc;
      }, {}),
    };
  }
}

module.exports = {
  ModelRouter,
};

