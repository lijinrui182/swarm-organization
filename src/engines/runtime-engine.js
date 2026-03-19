const fs = require("node:fs/promises");
const path = require("node:path");

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function previewPalette(style) {
  switch (style) {
    case "vibrant_travel":
      return { bg: "#f7efe1", accent: "#ff7a18", accentTwo: "#0077b6", text: "#1d2a37", card: "rgba(255,255,255,0.82)" };
    case "editorial_warm":
      return { bg: "#f4efe7", accent: "#8c4b2f", accentTwo: "#c6a15b", text: "#221b16", card: "rgba(255,248,239,0.86)" };
    case "clean_saas":
      return { bg: "#f3f7fb", accent: "#0f766e", accentTwo: "#2563eb", text: "#0f172a", card: "rgba(255,255,255,0.92)" };
    default:
      return { bg: "#07111f", accent: "#4fd1c5", accentTwo: "#f59e0b", text: "#eff6ff", card: "rgba(10,20,36,0.82)" };
  }
}

function buildPreviewSvg(spec, html) {
  const palette = previewPalette(spec.style);
  const title = escapeXml(spec.projectType.replace(/_/g, " "));
  const subtitle = escapeXml(spec.prompt.slice(0, 120));
  const features = spec.coreFeatures.slice(0, 6);
  const featureChips = features
    .map((feature, index) => {
      const x = 72 + (index % 3) * 220;
      const y = 380 + Math.floor(index / 3) * 70;
      return `
        <rect x="${x}" y="${y}" rx="18" ry="18" width="180" height="42" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.1)" />
        <text x="${x + 18}" y="${y + 27}" font-family="Segoe UI, sans-serif" font-size="18" fill="${palette.text}">${escapeXml(feature)}</text>
      `;
    })
    .join("\n");

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1024" viewBox="0 0 1440 1024">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette.bg}" />
        <stop offset="100%" stop-color="${palette.accentTwo}" stop-opacity="0.18" />
      </linearGradient>
      <linearGradient id="cardGlow" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette.accent}" stop-opacity="0.26" />
        <stop offset="100%" stop-color="${palette.accentTwo}" stop-opacity="0.18" />
      </linearGradient>
    </defs>
    <rect width="1440" height="1024" fill="url(#bg)" />
    <circle cx="180" cy="120" r="180" fill="${palette.accent}" fill-opacity="0.14" />
    <circle cx="1240" cy="220" r="150" fill="${palette.accentTwo}" fill-opacity="0.12" />
    <rect x="56" y="64" width="1328" height="896" rx="40" ry="40" fill="${palette.card}" stroke="rgba(255,255,255,0.12)" />
    <text x="88" y="128" font-family="Segoe UI, sans-serif" font-size="20" fill="${palette.accent}">Automatic Delivery Preview</text>
    <text x="88" y="214" font-family="Segoe UI, sans-serif" font-size="72" font-weight="700" fill="${palette.text}">${title}</text>
    <text x="88" y="286" font-family="Segoe UI, sans-serif" font-size="28" fill="${palette.text}" opacity="0.75">${subtitle}</text>
    <rect x="88" y="320" width="560" height="8" rx="4" fill="url(#cardGlow)" />
    ${featureChips}
    <rect x="780" y="180" width="520" height="520" rx="34" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" />
    <rect x="820" y="230" width="440" height="90" rx="26" fill="rgba(255,255,255,0.08)" />
    <rect x="820" y="350" width="205" height="150" rx="26" fill="rgba(255,255,255,0.08)" />
    <rect x="1055" y="350" width="205" height="150" rx="26" fill="rgba(255,255,255,0.08)" />
    <rect x="820" y="530" width="440" height="120" rx="26" fill="rgba(255,255,255,0.08)" />
    <text x="820" y="760" font-family="Segoe UI, sans-serif" font-size="20" fill="${palette.text}" opacity="0.72">Preview generated from HTML length ${html.length} and ${spec.coreFeatures.length} structured features.</text>
  </svg>`;
}

class RuntimeEngine {
  constructor({ serverPort }) {
    this.serverPort = serverPort;
  }

  async run({ task, spec, generation }) {
    const projectUrl = `http://127.0.0.1:${this.serverPort}/artifacts/${task.id}/project/`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    let html = "";
    let runtimeError = null;
    let runtimeOk = false;

    try {
      const response = await fetch(projectUrl, { signal: controller.signal });
      html = await response.text();
      if (!response.ok) {
        throw new Error(`Failed to fetch project: ${response.status} ${response.statusText}`);
      }
      runtimeOk = true;
    } catch (error) {
      runtimeError = error.message;
      html = `<html><body><h1>${escapeXml(spec.projectType.replace(/_/g, " "))}</h1><p>Preview generation failed: ${runtimeError}</p></body></html>`;
    } finally {
      clearTimeout(timer);
    }

    const previewPath = path.join(generation.previewDir, "home.svg");
    await fs.writeFile(previewPath, buildPreviewSvg(spec, html), "utf8");

    return {
      ok: runtimeOk,
      url: projectUrl,
      html,
      stdout: runtimeOk ? "served-via-main-server" : "",
      stderr: runtimeError || "",
      error: runtimeError,
      screenshot: {
        ok: true,
        path: previewPath,
        note: runtimeOk
          ? "SVG preview generated without external browser runtime"
          : "SVG preview generated from fallback HTML after runtime fetch failure",
      },
    };
  }
}

module.exports = {
  RuntimeEngine,
};
