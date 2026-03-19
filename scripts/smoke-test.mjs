async function getAvailablePort() {
  const { createServer } = await import("node:net");
  return await new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close(() => reject(new Error("Could not determine an available port")));
        return;
      }
      server.close(() => resolve(address.port));
    });
  });
}

const port = await getAvailablePort();
process.env.LITELLM_BASE_URL = "";
process.env.LITELLM_API_KEY = "";
process.env.DEEPSEEK_API_KEY = "";
process.env.GOOGLE_API_KEY = "";
process.env.GEMINI_API_KEY = "";
process.env.PORT = String(port);

const baseUrl = `http://127.0.0.1:${port}`;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollTask(taskId) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 90000) {
    const response = await fetch(`${baseUrl}/api/tasks/${taskId}`);
    const payload = await response.json();
    const task = payload.task;
    if (task.status === "succeeded" || task.status === "failed") {
      return task;
    }
    await wait(1200);
  }
  throw new Error("Task polling timed out");
}

const imported = await import("../src/server.js");
const serverModule = imported.default || imported;
const app = await serverModule.startServer();

try {
  const createResponse = await fetch(`${baseUrl}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: "Build an AI tools directory for university students with a dark tech style, categories, recommended tools, and a newsletter signup.",
      outputType: "web_project",
      framework: "nextjs",
      style: "dark_tech",
    }),
  });

  const created = await createResponse.json();
  if (!createResponse.ok) {
    throw new Error(created.error || "Task creation failed");
  }

  const task = await pollTask(created.task.id);
  if (task.status !== "succeeded") {
    throw new Error(task.error || "Task did not succeed");
  }

  const previewResponse = await fetch(`${baseUrl}${task.result.artifacts.previewUrl}`);
  const zipResponse = await fetch(`${baseUrl}${task.result.artifacts.zipUrl}`);

  if (!previewResponse.ok) {
    throw new Error("Preview artifact missing");
  }
  if (!zipResponse.ok) {
    throw new Error("Zip artifact missing");
  }

  console.log(JSON.stringify({
    ok: true,
    taskId: task.id,
    score: task.result.verification.score,
    previewUrl: task.result.artifacts.previewUrl,
    zipUrl: task.result.artifacts.zipUrl,
  }, null, 2));
} finally {
  app.resourceMonitor.stop();
  await new Promise((resolve) => app.server.close(resolve));
}