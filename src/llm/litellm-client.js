function extractTextContent(content) {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }
        if (item && typeof item.text === "string") {
          return item.text;
        }
        if (item && item.type === "output_text" && typeof item.text === "string") {
          return item.text;
        }
        return "";
      })
      .join("\n")
      .trim();
  }

  if (content && typeof content.text === "string") {
    return content.text;
  }

  return "";
}

function extractJsonBlock(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) {
    throw new Error("Model returned an empty response");
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : trimmed;

  const startObject = candidate.indexOf("{");
  const startArray = candidate.indexOf("[");
  let start = -1;
  if (startObject >= 0 && startArray >= 0) {
    start = Math.min(startObject, startArray);
  } else {
    start = Math.max(startObject, startArray);
  }

  if (start < 0) {
    throw new Error("No JSON object or array found in model response");
  }

  const openChar = candidate[start];
  const closeChar = openChar === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < candidate.length; i += 1) {
    const char = candidate[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) {
      continue;
    }
    if (char === openChar) {
      depth += 1;
    } else if (char === closeChar) {
      depth -= 1;
      if (depth === 0) {
        return candidate.slice(start, i + 1);
      }
    }
  }

  throw new Error("JSON response was not balanced");
}

function detectProviderFromModel(model) {
  const normalized = String(model || "").toLowerCase();
  if (!normalized) {
    return "unknown";
  }
  if (normalized.startsWith("deepseek/") || normalized.includes("deepseek")) {
    return "deepseek";
  }
  if (normalized.startsWith("vertex_ai/") || normalized.startsWith("gemini/") || normalized.includes("gemini")) {
    return "gemini";
  }
  if (normalized.startsWith("openai/")) {
    return "openai";
  }
  if (normalized.startsWith("anthropic/")) {
    return "anthropic";
  }
  return "unknown";
}

function normalizeModelName(model, provider) {
  const raw = String(model || "").trim();
  if (!raw) {
    return raw;
  }

  if (provider === "deepseek") {
    return raw.replace(/^deepseek\//i, "");
  }

  if (provider === "gemini") {
    return raw.replace(/^vertex_ai\//i, "").replace(/^gemini\//i, "");
  }

  return raw.replace(/^[^/]+\//, "");
}

function flattenMessageContent(content) {
  const text = extractTextContent(content);
  return text || String(content || "").trim();
}

function joinMessagesByRole(messages, role) {
  return messages
    .filter((message) => message?.role === role)
    .map((message) => flattenMessageContent(message.content))
    .filter(Boolean)
    .join("\n\n");
}

function buildGeminiPayload(messages, temperature, maxTokens, jsonMode = false) {
  const systemInstruction = joinMessagesByRole(messages, "system");
  const contentMessages = messages
    .filter((message) => message && message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: flattenMessageContent(message.content) }],
    }))
    .filter((message) => message.parts[0].text);

  const payload = {
    contents: contentMessages.length ? contentMessages : [{ role: "user", parts: [{ text: systemInstruction || "Return a short acknowledgement." }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  };

  if (systemInstruction) {
    payload.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  return payload;
}

function extractGeminiText(payload) {
  const candidate = payload?.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  const text = parts
    .map((part) => {
      if (typeof part?.text === "string") {
        return part.text;
      }
      return "";
    })
    .join("\n")
    .trim();

  if (text) {
    return text;
  }

  const finishReason = candidate?.finishReason || payload?.promptFeedback?.blockReason || "no text returned";
  throw new Error(`Gemini returned no text content: ${finishReason}`);
}

class LiteLLMClient {
  constructor({ baseUrl, apiKey, timeoutMs = 45000, deepseekApiKey = "", googleApiKey = "" }) {
    this.baseUrl = (baseUrl || "").replace(/\/$/, "");
    this.apiKey = apiKey || "";
    this.timeoutMs = timeoutMs;
    this.deepseekApiKey = deepseekApiKey || "";
    this.googleApiKey = googleApiKey || "";
  }

  isLiteLLMEnabled() {
    return Boolean(this.baseUrl);
  }

  providerAvailability() {
    return {
      deepseek: Boolean(this.deepseekApiKey),
      gemini: Boolean(this.googleApiKey),
    };
  }

  isEnabled() {
    const providers = this.providerAvailability();
    return this.isLiteLLMEnabled() || providers.deepseek || providers.gemini;
  }

  status() {
    const providers = this.providerAvailability();
    return {
      enabled: this.isEnabled(),
      mode: this.isLiteLLMEnabled() ? "litellm" : providers.deepseek || providers.gemini ? "direct" : "disabled",
      gatewayConfigured: this.isLiteLLMEnabled(),
      directProviders: providers,
      baseUrl: this.baseUrl || null,
    };
  }

  async requestJson(url, { method = "POST", headers = {}, body, signal }) {
    const response = await fetch(url, {
      method,
      headers,
      body,
      signal,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = payload?.error?.message || payload?.error || payload?.message || response.statusText;
      throw new Error(message);
    }

    return payload;
  }

  async chatThroughLiteLLM({ model, messages, temperature, maxTokens, metadata, signal }) {
    const payload = await this.requestJson(`${this.baseUrl}/chat/completions`, {
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false,
        metadata,
      }),
      signal,
    });

    const choice = payload.choices?.[0]?.message;
    const text = extractTextContent(choice?.content);
    if (!text) {
      throw new Error("LiteLLM returned no text content");
    }

    return {
      raw: payload,
      text,
      providerMode: "litellm",
    };
  }

  async chatThroughDeepSeek({ model, messages, temperature, maxTokens, signal }) {
    const payload = await this.requestJson("https://api.deepseek.com/chat/completions", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: normalizeModelName(model, "deepseek"),
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false,
      }),
      signal,
    });

    const choice = payload.choices?.[0]?.message;
    const text = extractTextContent(choice?.content);
    if (!text) {
      throw new Error("DeepSeek returned no text content");
    }

    return {
      raw: payload,
      text,
      providerMode: "direct:deepseek",
    };
  }

  async chatThroughGemini({ model, messages, temperature, maxTokens, signal, jsonMode = false }) {
    const modelName = encodeURIComponent(normalizeModelName(model, "gemini"));
    const payload = await this.requestJson(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(this.googleApiKey)}`, {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildGeminiPayload(messages, temperature, maxTokens, jsonMode)),
      signal,
    });

    return {
      raw: payload,
      text: extractGeminiText(payload),
      providerMode: "direct:gemini",
    };
  }

  async chatCompletion({ model, messages, temperature = 0.2, maxTokens = 1800, metadata = {}, jsonMode = false }) {
    if (!this.isEnabled()) {
      throw new Error("No LiteLLM gateway or direct provider keys are configured");
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      if (this.isLiteLLMEnabled()) {
        return await this.chatThroughLiteLLM({ model, messages, temperature, maxTokens, metadata, signal: controller.signal });
      }

      const provider = detectProviderFromModel(model);
      if (provider === "deepseek" && this.deepseekApiKey) {
        return await this.chatThroughDeepSeek({ model, messages, temperature, maxTokens, signal: controller.signal });
      }

      if (provider === "gemini" && this.googleApiKey) {
        return await this.chatThroughGemini({ model, messages, temperature, maxTokens, signal: controller.signal, jsonMode });
      }

      throw new Error(`No runtime connection is available for model provider: ${provider}`);
    } finally {
      clearTimeout(timer);
    }
  }

  async chatJson({ model, messages, temperature = 0.1, maxTokens = 2200, metadata = {}, maxAttempts = 2 }) {
    let lastError = null;
    let repairMessages = messages.slice();

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const completion = await this.chatCompletion({
          model,
          messages: repairMessages,
          temperature,
          maxTokens,
          metadata: { ...metadata, attempt },
          jsonMode: true,
        });
        const jsonText = extractJsonBlock(completion.text);
        return {
          raw: completion.raw,
          text: completion.text,
          value: JSON.parse(jsonText),
          providerMode: completion.providerMode,
        };
      } catch (error) {
        lastError = error;
        repairMessages = messages.concat([
          {
            role: "system",
            content: "The previous response was not valid JSON. Retry and return exactly one valid JSON object with no markdown fences and no commentary.",
          },
        ]);
      }
    }

    throw lastError || new Error("LiteLLM JSON parsing failed");
  }
}

module.exports = {
  LiteLLMClient,
};


