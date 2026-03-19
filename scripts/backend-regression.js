const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const { RuntimeEngine } = require("../src/engines/runtime-engine");
const { VerifierEngine } = require("../src/engines/verifier-engine");

const REQUIRED_PROJECT_FILES = ["index.html", "styles.css", "app.js", "server.js", "README.md", "spec.json", "plan.json"];
const CORE_FEATURES = ["hero", "search", "categories", "recommended_tools", "newsletter", "cta"];

async function withTempDir(prefix, fn) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  try {
    return await fn(root);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function writeProjectFiles(projectDir, files) {
  await fs.mkdir(projectDir, { recursive: true });
  await Promise.all(
    files.map((file) => fs.writeFile(path.join(projectDir, file), file === "README.md" ? "tool_directory" : "ok", "utf8"))
  );
}

function buildRuntimeHtml({ includePlaceholders = false } = {}) {
  const features = CORE_FEATURES.map((feature) => `<section data-feature="${feature}">${feature}</section>`).join("");
  const filler = includePlaceholders ? "<p>TODO replace placeholder content</p>" : "<p>Ready for delivery.</p>";
  return `<!doctype html><html><body>${features}${filler}${"x".repeat(320)}</body></html>`;
}

function createVerifier() {
  return new VerifierEngine({
    modelRouter: {
      route(stage, context = {}) {
        return { stage, provider: "local", model: "test", complexity: context.complexity || "low" };
      },
    },
    llmClient: null,
  });
}

async function checkRuntimeFailureSignals() {
  await withTempDir("runtime-check-", async (root) => {
    const previewDir = path.join(root, "preview");
    await fs.mkdir(previewDir, { recursive: true });

    const engine = new RuntimeEngine({ serverPort: 65534 });
    const result = await engine.run({
      task: { id: "missing-task" },
      spec: { projectType: "tool_directory", prompt: "demo", coreFeatures: ["hero"], style: "dark_tech" },
      generation: { previewDir },
    });

    assert.equal(result.ok, false, "runtime should report failure when project fetch fails");
    assert.match(result.html, /Preview generation failed:/, "runtime should preserve a fallback error page");
    assert.ok(result.error, "runtime should expose the fetch failure");
    assert.equal(result.screenshot.ok, true, "runtime should still generate a preview artifact");
  });
}

async function checkVerifierRejectsMissingFiles() {
  await withTempDir("verifier-files-", async (root) => {
    const projectDir = path.join(root, "project");
    await writeProjectFiles(projectDir, ["index.html", "README.md"]);

    const result = await createVerifier().verify({
      spec: { complexity: "low", projectType: "tool_directory", coreFeatures: CORE_FEATURES },
      generation: { projectDir },
      runtime: {
        ok: true,
        html: buildRuntimeHtml(),
        screenshot: { ok: true, path: path.join(root, "home.svg") },
      },
    });

    assert.equal(result.engineering.filesPresent, false, "verifier should detect missing required project files");
    assert.equal(result.passed, false, "verifier should fail incomplete project outputs");
    assert.ok(result.score < 80, "missing required files should materially reduce the verification score");
  });
}

async function checkVerifierRejectsPlaceholderContent() {
  await withTempDir("verifier-placeholders-", async (root) => {
    const projectDir = path.join(root, "project");
    await writeProjectFiles(projectDir, REQUIRED_PROJECT_FILES);

    const result = await createVerifier().verify({
      spec: { complexity: "low", projectType: "tool_directory", coreFeatures: CORE_FEATURES },
      generation: { projectDir },
      runtime: {
        ok: true,
        html: buildRuntimeHtml({ includePlaceholders: true }),
        screenshot: { ok: true, path: path.join(root, "home.svg") },
      },
    });

    assert.equal(result.content.hasPlaceholders, true, "verifier should flag placeholder text");
    assert.equal(result.passed, false, "placeholder content should fail verification");
  });
}

async function main() {
  await checkRuntimeFailureSignals();
  await checkVerifierRejectsMissingFiles();
  await checkVerifierRejectsPlaceholderContent();

  console.log(JSON.stringify({
    ok: true,
    checks: [
      "runtime reports fetch failures as failed runs",
      "verifier rejects outputs with missing required files",
      "verifier rejects placeholder content",
    ],
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
