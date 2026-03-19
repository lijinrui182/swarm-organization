const http = require("node:http");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const { URL } = require("node:url");

const config = require("./config");
const { TaskStore } = require("./core/task-store");
const { EventHub } = require("./core/event-hub");
const { KnowledgeBase } = require("./core/knowledge-base");
const { CostManager } = require("./core/cost-manager");
const { ResourceMonitor } = require("./core/resource-monitor");
const { DeliveryEngine } = require("./core/delivery-engine");
const { LiteLLMClient } = require("./llm/litellm-client");
const { ModelRouter } = require("./engines/model-router");
const { SpecBuilder } = require("./engines/spec-builder");
const { PlannerEngine } = require("./engines/planner-engine");
const { GeneratorEngine } = require("./engines/generator-engine");
const { RuntimeEngine } = require("./engines/runtime-engine");
const { VerifierEngine } = require("./engines/verifier-engine");
const { RepairerEngine } = require("./engines/repairer-engine");
const { PackagerEngine } = require("./engines/packager-engine");

function json(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" });
  response.end(JSON.stringify(payload));
}

function text(response, statusCode, payload, contentType = "text/plain; charset=utf-8") {
  response.writeHead(statusCode, { "Content-Type": contentType });
  response.end(payload);
}

function contentTypeFor(filePath) {
  const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "application/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".md": "text/markdown; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon" };
  return types[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function serveFile(response, filePath) {
  const stat = await fsp.stat(filePath);
  response.writeHead(200, { "Content-Type": contentTypeFor(filePath), "Content-Length": stat.size });
  fs.createReadStream(filePath).pipe(response);
}

async function resolveArtifactPath(relativePath) {
  const decoded = decodeURIComponent(relativePath);
  const normalized = path.normalize(decoded).replace(/^([.][.][\\/])+/, "");
  const target = path.join(config.DELIVERIES_DIR, normalized);
  if (!target.startsWith(config.DELIVERIES_DIR)) throw new Error("Forbidden");
  const stat = await fsp.stat(target);
  return stat.isDirectory() ? path.join(target, "index.html") : target;
}

async function createApp() {
  await fsp.mkdir(config.DATA_DIR, { recursive: true });
  await fsp.mkdir(config.DELIVERIES_DIR, { recursive: true });

  const taskStore = new TaskStore(config.TASK_STORE_FILE);
  const eventHub = new EventHub();
  const knowledgeBase = new KnowledgeBase(config.KB_FILE);
  const costManager = new CostManager(config.COST_FILE);
  await taskStore.load();
  await knowledgeBase.load();
  await costManager.load();

  const llmClient = new LiteLLMClient({ baseUrl: config.LITELLM_BASE_URL, apiKey: config.LITELLM_API_KEY, timeoutMs: config.LITELLM_TIMEOUT_MS, deepseekApiKey: config.DEEPSEEK_API_KEY, googleApiKey: config.GOOGLE_API_KEY });
  const modelRouter = new ModelRouter();
  const specBuilder = new SpecBuilder({ modelRouter, llmClient });
  const plannerEngine = new PlannerEngine({ modelRouter, llmClient });
  const generatorEngine = new GeneratorEngine({ deliveriesDir: config.DELIVERIES_DIR, modelRouter, llmClient });
  const runtimeEngine = new RuntimeEngine({ serverPort: config.DEFAULT_PORT });
  const verifierEngine = new VerifierEngine({ modelRouter, llmClient });
  const repairerEngine = new RepairerEngine({ maxAttempts: config.MAX_REPAIR_ATTEMPTS, generatorEngine, runtimeEngine, verifierEngine, modelRouter });
  const packagerEngine = new PackagerEngine({ modelRouter });

  const deliveryEngine = new DeliveryEngine({ concurrency: config.MAX_CONCURRENCY, taskStore, eventHub, knowledgeBase, costManager, specBuilder, plannerEngine, generatorEngine, runtimeEngine, verifierEngine, repairerEngine, packagerEngine });
  const resourceMonitor = new ResourceMonitor({ scheduler: deliveryEngine, taskStore, costManager, knowledgeBase });
  resourceMonitor.start();

  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://127.0.0.1:${config.DEFAULT_PORT}`);

    if (request.method === "OPTIONS") {
      response.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" });
      response.end();
      return;
    }

    try {
      if (url.pathname === "/api/health" && request.method === "GET") return void json(response, 200, { ok: true, now: new Date().toISOString() });
      if (url.pathname === "/api/model-status" && request.method === "GET") return void json(response, 200, { gatewayConfigured: llmClient.isLiteLLMEnabled(), modelClientEnabled: llmClient.isEnabled(), connection: llmClient.status(), baseUrl: config.LITELLM_BASE_URL || null, router: modelRouter.status() });
      if (url.pathname === "/api/tasks" && request.method === "GET") return void json(response, 200, { tasks: taskStore.listTasks(50) });

      if (url.pathname === "/api/tasks" && request.method === "POST") {
        const raw = await readBody(request);
        const body = raw ? JSON.parse(raw) : {};
        if (!body.prompt || !String(body.prompt).trim()) return void json(response, 400, { error: "prompt is required" });
        const payload = { prompt: String(body.prompt).trim(), outputType: body.outputType || "web_project", framework: body.framework || "nextjs", style: body.style || null, targetPlatform: body.targetPlatform || "web" };
        const task = taskStore.createTask({ taskType: payload.outputType, input: payload.prompt, context: payload });
        await taskStore.persist();
        deliveryEngine.enqueue(task);
        return void json(response, 202, { task });
      }

      if (url.pathname.startsWith("/api/tasks/") && request.method === "GET") {
        const taskId = url.pathname.split("/").filter(Boolean)[2];
        const task = taskStore.getTask(taskId);
        if (!task) return void json(response, 404, { error: "Task not found" });
        return void json(response, 200, { task });
      }

      if (url.pathname === "/api/metrics" && request.method === "GET") return void json(response, 200, resourceMonitor.getMetrics());
      if (url.pathname === "/api/events" && request.method === "GET") return void eventHub.subscribe(response);

      if (url.pathname.startsWith("/artifacts/") && request.method === "GET") {
        const target = await resolveArtifactPath(url.pathname.replace(/^\/artifacts\//, ""));
        return void (await serveFile(response, target));
      }

      const relativeWebPath = url.pathname === "/" ? "index.html" : url.pathname.replace(/^\//, "");
      const webFile = path.join(config.WEB_DIR, relativeWebPath);
      if (webFile.startsWith(config.WEB_DIR)) {
        try {
          return void (await serveFile(response, webFile));
        } catch {}
      }
      await serveFile(response, path.join(config.WEB_DIR, "index.html"));
    } catch (error) {
      text(response, 500, error.message);
    }
  });

  return { server, taskStore, eventHub, knowledgeBase, costManager, resourceMonitor, modelRouter, llmClient };
}

async function startServer() {
  const app = await createApp();
  await new Promise((resolve) => app.server.listen(config.DEFAULT_PORT, resolve));
  console.log(`Delivery system listening on http://127.0.0.1:${config.DEFAULT_PORT}`);
  return app;
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  startServer,
};



