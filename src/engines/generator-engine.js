const fs = require("node:fs/promises");
const path = require("node:path");

function slugify(value) {
  return String(value || "delivery-project")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "delivery-project";
}

function titleCase(value) {
  return String(value || "")
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function themeTokens(style) {
  switch (style) {
    case "vibrant_travel":
      return { bg: "#f7efe1", bgSecondary: "#fff8f0", surface: "rgba(255,255,255,0.78)", text: "#1d2a37", muted: "#5f6d79", accent: "#ff7a18", accentTwo: "#0077b6", border: "rgba(29,42,55,0.12)", glow: "radial-gradient(circle at top left, rgba(255,122,24,0.22), transparent 44%), radial-gradient(circle at bottom right, rgba(0,119,182,0.18), transparent 38%)" };
    case "editorial_warm":
      return { bg: "#f4efe7", bgSecondary: "#efe5d7", surface: "rgba(255,248,239,0.84)", text: "#221b16", muted: "#5a4f46", accent: "#8c4b2f", accentTwo: "#c6a15b", border: "rgba(34,27,22,0.1)", glow: "radial-gradient(circle at top left, rgba(198,161,91,0.20), transparent 44%), radial-gradient(circle at bottom right, rgba(140,75,47,0.15), transparent 38%)" };
    case "clean_saas":
      return { bg: "#f3f7fb", bgSecondary: "#ffffff", surface: "rgba(255,255,255,0.92)", text: "#0f172a", muted: "#475569", accent: "#0f766e", accentTwo: "#2563eb", border: "rgba(15,23,42,0.1)", glow: "radial-gradient(circle at top left, rgba(37,99,235,0.14), transparent 40%), radial-gradient(circle at bottom right, rgba(15,118,110,0.12), transparent 34%)" };
    default:
      return { bg: "#07111f", bgSecondary: "#0d1930", surface: "rgba(10, 20, 36, 0.74)", text: "#eff6ff", muted: "#9fb3c8", accent: "#4fd1c5", accentTwo: "#f59e0b", border: "rgba(159,179,200,0.18)", glow: "radial-gradient(circle at top left, rgba(79,209,197,0.18), transparent 42%), radial-gradient(circle at bottom right, rgba(245,158,11,0.16), transparent 36%)" };
  }
}

const PROJECT_DEFAULTS = {
  landing_page: { siteName: "Launch Frame", eyebrow: "Automatic web delivery", headline: "A one-page site designed to turn a simple idea into a compelling launch presence.", subhead: "Prepared for your target users, with a structured narrative and a clear CTA path.", primaryCta: "View sections", secondaryCta: "See delivery" },
  blog_site: { siteName: "Signal Journal", eyebrow: "Independent publishing engine", headline: "A blog that feels like a sharp digital magazine.", subhead: "Designed with editorial hierarchy, featured stories, and a visible subscribe path.", primaryCta: "Explore stories", secondaryCta: "Join newsletter" },
  tool_directory: { siteName: "Tool Orbit", eyebrow: "Curated AI navigation hub", headline: "A discovery site that helps users find the right tools fast.", subhead: "Built with category discovery, recommended picks, and an email capture path.", primaryCta: "Browse tools", secondaryCta: "Get weekly picks" },
  travel_landing: { siteName: "Northbound Escape", eyebrow: "High-conviction destination page", headline: "A travel page that sells the feeling before the itinerary.", subhead: "Built with immersive destinations, social proof, and a clear booking path.", primaryCta: "Plan a trip", secondaryCta: "See itinerary" },
  dashboard_prototype: { siteName: "Pulse Console", eyebrow: "Operations-ready shell", headline: "A dashboard prototype that makes status visible at a glance.", subhead: "Built with KPI cards, workflow views, and an activity stream that feels immediately usable.", primaryCta: "Open dashboard", secondaryCta: "Review workflow" },
  saas_homepage: { siteName: "FlowPilot", eyebrow: "Product marketing site", headline: "A SaaS homepage structured to explain, prove, and convert.", subhead: "Positioned with strong value props, workflow explanation, pricing, and FAQ.", primaryCta: "Start free", secondaryCta: "Book demo" },
  personal_portfolio: { siteName: "Studio Current", eyebrow: "Creator-facing presence", headline: "A portfolio site that frames selected work like a studio showcase.", subhead: "Built with selected work, services, process, and direct contact CTA.", primaryCta: "View work", secondaryCta: "Start a project" },
};

const SECTION_LIBRARY = {
  value_props: { kind: "cards", title: "Value props", body: "Ground the page in three sharp reasons to care.", cards: [["Sharper message", "The page hierarchy highlights what matters instead of burying it."], ["Faster launch", "The generated starter removes blank-page paralysis and speeds iteration."], ["Room to grow", "The structure is easy to extend into a larger product later."]] },
  featured_posts: { kind: "cards", title: "Featured stories", body: "Editorial structure that feels intentional.", cards: [["Signal over noise", "Lead with one strong narrative card, then fan out into supporting reads."], ["Topic-led discovery", "Readers can browse by category, freshness, or editor picks without friction."], ["Built-in subscription", "The newsletter module is treated as a product feature, not an afterthought."]] },
  categories: { kind: "chips", title: "Categories", body: "Core clusters users can navigate immediately.", chips: ["Design Systems", "AI Workflow", "Founder Notes", "Launch Tactics", "Playbooks"] },
  author_story: { kind: "split_quote", title: "Author note", body: "Explain why the publication exists and what readers should expect from it.", quote: "People subscribe when the perspective is sharp and the rhythm feels trustworthy." },
  newsletter: { kind: "form", title: "Newsletter", body: "Capture repeat attention without breaking the browsing flow.", formLabel: "Email updates", formButton: "Subscribe" },
  search: { kind: "search", title: "Tool discovery", body: "Search and filter the most useful tools in seconds.", hint: "Try searching for design, coding, research, or automation." },
  recommended_tools: { kind: "cards", title: "Recommended picks", body: "High-signal tools organized around common jobs.", cards: [["Prompt Atlas", "A writing and ideation assistant for getting from draft to publishable copy."], ["Canvas Sprint", "A rapid UI concept tool for landing pages and launches."], ["Stack Pilot", "An automation helper for research, coding, and delivery checklists."]], cardClass: "tool-card" },
  destinations: { kind: "cards", title: "Destinations", body: "Sell the mood first, then the logistics.", cards: [["Ice Fjord", "Slow travel, local food, and private cabin views."], ["City Tides", "Boutique stays, night walks, and creative studios."], ["Salt Route", "Warm coastline and shareable group experiences."]] },
  itineraries: { kind: "split_list", title: "Sample itinerary", body: "Three days of momentum without over-planning.", list: ["Day 1: arrival and orientation", "Day 2: signature route and flexible evening", "Day 3: recovery block and departure support"], quote: "A strong travel page makes the next action feel easy." },
  testimonials: { kind: "cards", title: "Social proof", body: "Confidence comes from specific outcomes, not vague praise.", cards: [["Booked after the first scroll", "The page set expectations clearly and made the itinerary feel trustworthy."], ["The destination finally felt vivid", "Visual hierarchy and concise copy reduced hesitation."]] },
  booking_cta: { kind: "banner", title: "Ready to book", body: "Turn intent into a confirmed itinerary.", button: "Reserve a spot" },
  sidebar: { kind: "nav_split", title: "Workspace", body: "A compact nav frame for a dashboard starter.", nav: ["Overview", "Projects", "Delivery", "Settings"], contentTitle: "Start the dashboard with a calm information frame.", contentBody: "This shell creates a stable base for KPI, workflow, and activity sections." },
  kpi_cards: { kind: "cards", title: "KPI cards", body: "Show status quickly with a few strong numbers.", cards: [["92%", "On-time delivery health"], ["18", "Projects in review"], ["04", "Priority blockers today"]] },
  workflow_board: { kind: "cards", title: "Workflow board", body: "Current execution lanes across spec, build, and QA.", cards: [["Spec", "4 tasks structured and ready for planning."], ["Build", "6 active code generations with preview checks."], ["QA", "2 items in automatic repair and screenshot review."]] },
  insights_panel: { kind: "chart", title: "Insights", body: "A visual placeholder for weekly execution load and trends.", quote: "The goal is not more dashboards. It is faster, calmer delivery." },
  activity_feed: { kind: "list_panel", title: "Recent activity", body: "What changed in the last hour.", list: ["Spec Builder structured a new homepage request", "Runner started a preview server", "Packager exported a delivery report"] },
  feature_grid: { kind: "cards", title: "Features", body: "Structure the middle of the page around benefits users can feel quickly.", cards: [["Fast orientation", "Users understand the offer in one screen without a dense wall of text."], ["Confidence builders", "Metrics and product detail show up before objections pile up."], ["Conversion path", "CTA moments are distributed through the page."]] },
  workflow: { kind: "split_list", title: "Workflow", body: "Explain how the product works in three clean moves.", list: ["Capture the request and turn it into a clear spec.", "Generate the codebase and visual system from a reusable template.", "Run, verify, repair, and package the output."], quote: "A good homepage feels like an onboarding funnel, not a brochure." },
  pricing: { kind: "cards", title: "Pricing", body: "Simple enough to scan, clear enough to compare.", cards: [["Starter", "$19/mo · best for first launches"], ["Growth", "$59/mo · built for teams shipping weekly"], ["Scale", "$149/mo · advanced automation and delivery control"]] },
  faq: { kind: "cards", title: "FAQ", body: "Handle the last objections directly.", cards: [["Can the site be expanded later?", "Yes. The structure is a strong first delivery, not a dead end."], ["Does it include documentation?", "Yes. A README and delivery report are packaged with the source."], ["Can the visual style change?", "Yes. The design token layer makes restyling straightforward."]] },
  selected_work: { kind: "cards", title: "Selected work", body: "Frame projects as outcomes, not thumbnails.", cards: [["Launch Site", "A conversion-first homepage with crisp information architecture."], ["Content Platform", "An editorial experience focused on storytelling and discovery."], ["Ops Dashboard", "An internal interface designed for clarity under constant use."]] },
  capabilities: { kind: "split_list", title: "Capabilities", body: "Offer a concise service menu that supports trust.", list: ["Product narrative and UX structure", "Visual direction and UI systems", "Frontend implementation and launch support"], quote: "Clarity is a design asset. Speed is a delivery asset." },
  process: { kind: "cards", title: "Process", body: "Show a working method people can buy into.", cards: [["Discover", "Translate the brief into concrete page and content decisions."], ["Build", "Generate the project and shape the visual system around the brief."], ["Deliver", "Verify the build, package the files, and hand over a usable starting point."]] },
  contact_cta: { kind: "banner", title: "Contact", body: "Invite the next conversation with enough specificity to feel credible.", button: "Start a project" },
  social_proof: { kind: "cards", title: "Social proof", body: "Validation helps the value proposition land faster.", cards: [["14 launches supported", "Used as an internal starter for fast-moving teams."], ["3x clearer onboarding", "Structured pages reduce confusion on first visit."]] },
  cta: { kind: "banner", title: "Delivery ready", body: "Ship the first version, then iterate with clarity.", button: "Back to top" },
};

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function defaultContentPlan(spec) {
  const heroBase = PROJECT_DEFAULTS[spec.projectType] || PROJECT_DEFAULTS.landing_page;
  const sections = {};
  for (const feature of spec.coreFeatures) {
    sections[feature] = deepClone(SECTION_LIBRARY[feature] || { kind: "cards", title: titleCase(feature), body: `${titleCase(feature)} section.`, cards: [[titleCase(feature), `${titleCase(feature)} content block.`]] });
  }
  return {
    siteName: heroBase.siteName,
    hero: {
      eyebrow: heroBase.eyebrow,
      headline: heroBase.headline,
      subhead: `${heroBase.subhead} Built for ${spec.targetUsers}.`,
      primaryCta: heroBase.primaryCta,
      secondaryCta: heroBase.secondaryCta,
    },
    metrics: [
      { value: "48h", label: "Time-to-first-draft" },
      { value: String(spec.coreFeatures.length).padStart(2, "0"), label: "Core sections included" },
      { value: String(spec.style || "dark_tech").replace(/_/g, " "), label: "Visual direction" },
    ],
    sections,
  };
}

function normalizeCards(cards, fallback) {
  if (!Array.isArray(cards)) return fallback;
  const result = cards.map((item) => [String(item?.title || item?.[0] || "").trim(), String(item?.body || item?.[1] || "").trim()]).filter(([title, body]) => title && body);
  return result.length ? result : fallback;
}

function normalizeList(value, fallback) {
  if (!Array.isArray(value)) return fallback;
  const result = value.map((item) => String(item || "").trim()).filter(Boolean);
  return result.length ? result : fallback;
}

function mergeContentPlan(basePlan, override) {
  const merged = deepClone(basePlan);
  if (!override || typeof override !== "object") return merged;
  if (override.siteName) merged.siteName = String(override.siteName).trim() || merged.siteName;
  if (override.hero && typeof override.hero === "object") {
    merged.hero = {
      eyebrow: String(override.hero.eyebrow || merged.hero.eyebrow).trim(),
      headline: String(override.hero.headline || merged.hero.headline).trim(),
      subhead: String(override.hero.subhead || merged.hero.subhead).trim(),
      primaryCta: String(override.hero.primaryCta || merged.hero.primaryCta).trim(),
      secondaryCta: String(override.hero.secondaryCta || merged.hero.secondaryCta).trim(),
    };
  }
  if (Array.isArray(override.metrics)) {
    const metrics = override.metrics.map((item) => ({ value: String(item?.value || "").trim(), label: String(item?.label || "").trim() })).filter((item) => item.value && item.label).slice(0, 3);
    if (metrics.length) merged.metrics = metrics;
  }
  if (override.sections && typeof override.sections === "object") {
    for (const [feature, sectionOverride] of Object.entries(override.sections)) {
      if (!merged.sections[feature] || !sectionOverride || typeof sectionOverride !== "object") continue;
      const current = merged.sections[feature];
      merged.sections[feature] = {
        ...current,
        title: String(sectionOverride.title || current.title || "").trim(),
        body: String(sectionOverride.body || current.body || "").trim(),
        quote: String(sectionOverride.quote || current.quote || "").trim(),
        button: String(sectionOverride.button || current.button || "").trim(),
        formLabel: String(sectionOverride.formLabel || current.formLabel || "").trim(),
        formButton: String(sectionOverride.formButton || current.formButton || "").trim(),
        hint: String(sectionOverride.hint || current.hint || "").trim(),
        contentTitle: String(sectionOverride.contentTitle || current.contentTitle || "").trim(),
        contentBody: String(sectionOverride.contentBody || current.contentBody || "").trim(),
        cards: normalizeCards(sectionOverride.cards, current.cards),
        chips: normalizeList(sectionOverride.chips, current.chips),
        list: normalizeList(sectionOverride.list, current.list),
        nav: normalizeList(sectionOverride.nav, current.nav),
      };
    }
  }
  return merged;
}

function renderCards(cards, extraClass = "") {
  return cards.map(([title, body]) => `<article class="content-card ${extraClass}"><h3>${title}</h3><p>${body}</p></article>`).join("\n");
}

function renderList(items) {
  return `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

function renderSection(featureKey, section, spec) {
  if (section.kind === "banner") return `<section id="${featureKey === "cta" ? "delivery-cta" : featureKey}" class="shell cta-banner" data-feature="${featureKey}"><div><p>${section.title}</p><h2>${section.body}</h2></div><a class="button primary" href="${featureKey === "cta" ? "#top" : "#delivery-cta"}">${section.button}</a></section>`;
  if (section.kind === "chips") return `<section class="shell section-block" data-feature="${featureKey}"><div class="section-head"><p>${section.title}</p><h2>${section.body}</h2></div><div class="chip-row">${(section.chips || []).map((item, index) => `<span class="chip${index === 0 ? " active" : ""}">${item}</span>`).join("")}</div></section>`;
  if (section.kind === "form") return `<section class="shell section-block split" data-feature="${featureKey}"><div class="panel focus-panel"><p>${section.title}</p><h2>${section.body}</h2><span>Offer a clear promise, a low-friction field, and a quick reason to join.</span></div><form class="panel input-panel"><label>${section.formLabel || "Email updates"}</label><input type="email" placeholder="founder@domain.com" /><button type="button" class="button primary">${section.formButton || "Subscribe"}</button></form></section>`;
  if (section.kind === "search") return `<section class="shell section-block split" data-feature="${featureKey}"><div class="panel focus-panel"><p>${section.title}</p><h2>${section.body}</h2><span>Focused on reducing decision fatigue for ${spec.targetUsers}.</span></div><div class="panel input-panel"><input id="tool-search" type="search" placeholder="Search tools, workflows, or categories" /><span>${section.hint}</span></div></section>`;
  if (section.kind === "nav_split") return `<section class="shell section-block split" data-feature="${featureKey}"><aside class="panel nav-panel"><p>${section.title}</p><h2>${section.body}</h2><nav>${(section.nav || []).map((item) => `<a href="#">${item}</a>`).join("")}</nav></aside><div class="panel content-panel"><p>Overview</p><h2>${section.contentTitle}</h2><span>${section.contentBody}</span></div></section>`;
  if (section.kind === "chart") return `<section class="shell section-block split" data-feature="${featureKey}"><div class="panel chart-panel"><p>${section.title}</p><h2>${section.body}</h2><div class="fake-chart"></div></div><div class="panel quote-panel"><blockquote>"${section.quote}"</blockquote></div></section>`;
  if (section.kind === "split_quote") return `<section class="shell section-block split" data-feature="${featureKey}"><div class="panel focus-panel"><p>${section.title}</p><h2>${section.body}</h2><span>Use this section to explain the point of view behind the project.</span></div><div class="panel quote-panel"><blockquote>"${section.quote}"</blockquote></div></section>`;
  if (section.kind === "split_list") return `<section class="shell section-block split" data-feature="${featureKey}"><div class="panel focus-panel"><p>${section.title}</p><h2>${section.body}</h2>${renderList(section.list || [])}</div><div class="panel quote-panel"><blockquote>"${section.quote}"</blockquote></div></section>`;
  if (section.kind === "list_panel") return `<section class="shell section-block" data-feature="${featureKey}"><div class="section-head"><p>${section.title}</p><h2>${section.body}</h2></div><div class="card-grid three-up">${(section.list || []).map((item) => `<article class="content-card"><h3>${titleCase(featureKey)}</h3><p>${item}</p></article>`).join("")}</div></section>`;
  return `<section class="shell section-block" data-feature="${featureKey}"><div class="section-head"><p>${section.title}</p><h2>${section.body}</h2></div><div class="card-grid ${(section.cards || []).length === 2 ? "two-up" : "three-up"}">${renderCards(section.cards || [[section.title, section.body]], section.cardClass || "")}</div></section>`;
}

function buildHtml(spec, contentPlan) {
  const hero = contentPlan.hero;
  const metrics = contentPlan.metrics || [];
  const sections = spec.coreFeatures.filter((feature) => feature !== "hero").map((feature) => renderSection(feature, contentPlan.sections[feature], spec)).join("\n");
  const ctaSection = spec.coreFeatures.includes("cta") ? "" : renderSection("cta", SECTION_LIBRARY.cta, spec);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${contentPlan.siteName}</title>
    <meta name="description" content="${hero.subhead}" />
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body data-project-type="${spec.projectType}" data-theme="${spec.style}">
    <div class="ambient"></div>
    <header id="top" class="topbar shell">
      <div class="brand-lockup"><span class="brand-mark"></span><div><strong>${contentPlan.siteName}</strong><small>Automatic delivery starter</small></div></div>
      <nav class="topnav"><a href="#main-content">Overview</a><a href="#delivery-cta">CTA</a></nav>
    </header>
    <main id="main-content">
      <section class="hero shell" data-feature="hero">
        <div class="panel hero-copy"><p class="eyebrow">${hero.eyebrow}</p><h1>${hero.headline}</h1><p class="lead">${hero.subhead}</p><div class="hero-actions"><a class="button primary" href="#main-content">${hero.primaryCta}</a><a class="button secondary" href="#delivery-cta">${hero.secondaryCta}</a></div></div>
        <div class="panel metric-column">${metrics.map((item) => `<div class="metric"><span>${item.value}</span><small>${item.label}</small></div>`).join("")}</div>
      </section>
      ${sections}
      ${ctaSection}
    </main>
    <footer class="shell footer"><p>Generated from a structured brief for ${spec.targetUsers}.</p><span>${titleCase(spec.projectType)} · ${titleCase(spec.style)}</span></footer>
    <script src="./app.js"></script>
  </body>
</html>`;
}

function buildClientScript(spec) {
  return `const searchInput = document.getElementById("tool-search");
if (searchInput) {
  searchInput.addEventListener("input", (event) => {
    const value = event.target.value.trim().toLowerCase();
    for (const card of document.querySelectorAll(".tool-card")) {
      const visible = !value || card.textContent.toLowerCase().includes(value);
      card.style.display = visible ? "block" : "none";
    }
  });
}
for (const chip of document.querySelectorAll(".chip")) {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach((item) => item.classList.remove("active"));
    chip.classList.add("active");
  });
}
window.__DELIVERY_STATE__ = { projectType: ${JSON.stringify(spec.projectType)}, features: ${JSON.stringify(spec.coreFeatures)} };
`;
}

function buildProjectServer() {
  return `const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = __dirname;
const port = Number(process.env.PORT || 4173);
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "application/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml" };
const server = http.createServer((request, response) => {
  const url = new URL(request.url, \`http://localhost:\${port}\`);
  const filePath = path.join(root, url.pathname === "/" ? "index.html" : url.pathname.replace(/^\\//, ""));
  if (!filePath.startsWith(root)) { response.writeHead(403); response.end("Forbidden"); return; }
  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) { response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); response.end("Not found"); return; }
    response.writeHead(200, { "Content-Type": types[path.extname(filePath).toLowerCase()] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(response);
  });
});
server.listen(port, "127.0.0.1", () => console.log(\`Delivery project running at http://127.0.0.1:\${port}\`));
`;
}
function buildStyles(spec) {
  const theme = themeTokens(spec.style);
  return `:root {
  --bg: ${theme.bg}; --bg-secondary: ${theme.bgSecondary}; --surface: ${theme.surface}; --text: ${theme.text}; --muted: ${theme.muted}; --accent: ${theme.accent}; --accent-two: ${theme.accentTwo}; --border: ${theme.border}; --shadow: 0 24px 60px rgba(0, 0, 0, 0.18); --radius-xl: 28px; --radius-lg: 18px;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; min-height: 100vh; background: ${theme.glow}, linear-gradient(180deg, var(--bg), var(--bg-secondary)); color: var(--text); font-family: "Trebuchet MS", "Segoe UI", sans-serif; line-height: 1.55; }
body::before { content: ""; position: fixed; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 44px 44px; opacity: 0.22; pointer-events: none; }
.ambient { position: fixed; inset: 0; background: radial-gradient(circle at 12% 14%, rgba(255,255,255,0.08), transparent 24%), radial-gradient(circle at 88% 20%, rgba(255,255,255,0.04), transparent 18%); pointer-events: none; }
.shell { width: min(1180px, calc(100% - 32px)); margin: 0 auto; }
.topbar, .footer, .hero-actions, .chip-row { display: flex; }
.topbar { justify-content: space-between; align-items: center; padding: 24px 0 12px; position: sticky; top: 0; z-index: 10; backdrop-filter: blur(18px); }
.brand-lockup { display: flex; gap: 14px; align-items: center; }
.brand-mark { width: 14px; height: 14px; border-radius: 999px; background: linear-gradient(135deg, var(--accent), var(--accent-two)); box-shadow: 0 0 0 8px rgba(255,255,255,0.04); }
.topnav { display: flex; gap: 18px; }
.topnav a, .footer a { color: inherit; text-decoration: none; }
.topnav a, .eyebrow, .section-head p, .footer span, .metric small, .panel > p:first-child, .panel span, .content-card p, .lead, li, label { color: var(--muted); }
.hero, .split { display: grid; grid-template-columns: 1.3fr 0.9fr; gap: 20px; }
.hero { padding: 42px 0 28px; }
.section-block, .cta-banner { padding: 28px 0; }
.panel, .content-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); box-shadow: var(--shadow); }
.hero-copy, .metric-column, .focus-panel, .input-panel, .nav-panel, .content-panel, .chart-panel, .quote-panel { padding: 28px; }
.hero-copy h1 { font-size: clamp(2.8rem, 7vw, 5.1rem); line-height: 0.95; letter-spacing: -0.04em; margin: 10px 0 16px; }
.hero-actions { gap: 12px; flex-wrap: wrap; }
.button { display: inline-flex; align-items: center; justify-content: center; min-height: 46px; padding: 0 18px; border-radius: 999px; text-decoration: none; border: 1px solid transparent; cursor: pointer; }
.button.primary { background: linear-gradient(135deg, var(--accent), var(--accent-two)); color: #08111f; font-weight: 700; }
.button.secondary { border-color: var(--border); color: var(--text); }
.metric-column { display: grid; gap: 12px; }
.metric { padding: 18px; border-radius: var(--radius-lg); background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); }
.metric span { display: block; font-size: 2rem; font-weight: 700; }
.section-head { display: grid; gap: 6px; margin-bottom: 18px; }
.section-head h2, .focus-panel h2, .content-panel h2, .chart-panel h2, .cta-banner h2 { margin: 0; font-size: clamp(1.6rem, 4vw, 2.6rem); line-height: 1.05; letter-spacing: -0.03em; }
.card-grid { display: grid; gap: 16px; }
.three-up { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.two-up { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.content-card { padding: 22px; }
.content-card h3 { margin-top: 0; margin-bottom: 10px; }
input { width: 100%; min-height: 48px; border-radius: 14px; border: 1px solid var(--border); padding: 0 14px; background: rgba(255,255,255,0.08); color: var(--text); }
form, .input-panel { display: grid; gap: 12px; align-content: start; }
.chip-row { gap: 12px; flex-wrap: wrap; }
.chip { padding: 10px 16px; border-radius: 999px; border: 1px solid var(--border); background: rgba(255,255,255,0.05); cursor: pointer; }
.chip.active { border-color: var(--accent); }
.nav-panel nav { display: grid; gap: 10px; margin-top: 16px; }
.nav-panel a { color: inherit; text-decoration: none; padding: 12px 14px; border-radius: 12px; background: rgba(255,255,255,0.03); }
.fake-chart { height: 220px; border-radius: 18px; background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.08)), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px); background-size: auto, 44px 44px, 44px 44px; position: relative; overflow: hidden; }
.fake-chart::after { content: ""; position: absolute; left: 10%; right: 10%; bottom: 20%; height: 3px; background: linear-gradient(90deg, transparent 0%, var(--accent) 18%, var(--accent-two) 72%, transparent 100%); transform: skewY(-14deg); }
.quote-panel blockquote { margin: 0; font-size: clamp(1.35rem, 3vw, 2rem); line-height: 1.2; }
.cta-banner { justify-content: space-between; align-items: center; gap: 20px; }
.footer { justify-content: space-between; align-items: center; padding: 18px 0 40px; }
@media (max-width: 960px) { .hero, .split, .three-up, .two-up, .cta-banner { grid-template-columns: 1fr; } .topbar, .footer { flex-direction: column; align-items: flex-start; gap: 12px; } }
@media (prefers-reduced-motion: no-preference) { .panel, .content-card { animation: rise 620ms ease both; } .content-card:nth-child(2) { animation-delay: 80ms; } .content-card:nth-child(3) { animation-delay: 140ms; } }
@keyframes rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
`;
}

function buildReadme(spec, contentPlan, route, generationMode) {
  return `# ${contentPlan.siteName}

This project was automatically delivered from a structured brief.

## Brief summary
- Project type: ${spec.projectType}
- Target users: ${spec.targetUsers}
- Visual direction: ${spec.style}
- Requested framework: ${spec.framework}
- Runtime-ready template: ${spec.techStack.runtimeReady}
- Generator mode: ${generationMode}
- Model route: ${route.provider} / ${route.model}

## Start locally
\`\`\`bash
node server.js
\`\`\`

Open http://127.0.0.1:4173 in your browser.

## Acceptance criteria
${spec.acceptanceCriteria.map((item) => `- ${item}`).join("\n")}
`;
}

class GeneratorEngine {
  constructor({ deliveriesDir, modelRouter, llmClient }) {
    this.deliveriesDir = deliveriesDir;
    this.modelRouter = modelRouter;
    this.llmClient = llmClient;
  }

  async buildContentPlan(spec, plan, route, repairContext) {
    const fallback = defaultContentPlan(spec);
    if (!this.llmClient || !this.llmClient.isEnabled()) {
      return { contentPlan: fallback, generationMode: "template-only" };
    }

    const messages = [
      { role: "system", content: "You are a web copy and content rewrite engine. Do not change page structure. Return JSON only. Rewrite the fixed template content so the project feels tailored to the user brief. Keep output compact, concrete, and production-ready." },
      { role: "user", content: JSON.stringify({ spec, planSteps: plan.steps, repairContext: repairContext || null, template: fallback, requiredShape: { siteName: "string", hero: { eyebrow: "string", headline: "string", subhead: "string", primaryCta: "string", secondaryCta: "string" }, metrics: [{ value: "string", label: "string" }], sections: Object.fromEntries(spec.coreFeatures.map((feature) => [feature, { title: "string", body: "string", cards: [{ title: "string", body: "string" }], chips: ["string"], list: ["string"], quote: "string", button: "string", nav: ["string"] }])) } }) },
    ];

    try {
      const completion = await this.llmClient.chatJson({ model: route.model, messages, metadata: { stage: "generator" } });
      return { contentPlan: mergeContentPlan(fallback, completion.value), generationMode: "template-plus-litellm" };
    } catch (error) {
      return { contentPlan: fallback, generationMode: "template-only", llmError: error.message };
    }
  }

  async generate({ task, spec, plan, repairContext = null }) {
    const route = this.modelRouter.route("generator", { complexity: spec.complexity });
    const deliveryDir = path.join(this.deliveriesDir, task.id);
    const projectDir = path.join(deliveryDir, "project");
    const previewDir = path.join(deliveryDir, "preview");
    const contentResult = await this.buildContentPlan(spec, plan, route, repairContext);
    const contentPlan = contentResult.contentPlan;
    const identity = { projectName: contentPlan.siteName, packageName: slugify(`${contentPlan.siteName}-${spec.projectType}`) };

    await fs.mkdir(projectDir, { recursive: true });
    await fs.mkdir(previewDir, { recursive: true });

    await fs.writeFile(path.join(projectDir, "index.html"), buildHtml(spec, contentPlan), "utf8");
    await fs.writeFile(path.join(projectDir, "styles.css"), buildStyles(spec), "utf8");
    await fs.writeFile(path.join(projectDir, "app.js"), buildClientScript(spec), "utf8");
    await fs.writeFile(path.join(projectDir, "server.js"), buildProjectServer(), "utf8");
    await fs.writeFile(path.join(projectDir, "package.json"), JSON.stringify({ name: identity.packageName, private: true, version: "1.0.0", scripts: { start: "node server.js" } }, null, 2), "utf8");
    await fs.writeFile(path.join(projectDir, "README.md"), buildReadme(spec, contentPlan, route, contentResult.generationMode), "utf8");
    await fs.writeFile(path.join(projectDir, "spec.json"), JSON.stringify(spec, null, 2), "utf8");
    await fs.writeFile(path.join(projectDir, "plan.json"), JSON.stringify(plan, null, 2), "utf8");
    await fs.writeFile(path.join(projectDir, "content-plan.json"), JSON.stringify(contentPlan, null, 2), "utf8");
    if (repairContext) await fs.writeFile(path.join(projectDir, "repair-context.json"), JSON.stringify(repairContext, null, 2), "utf8");

    return { route, identity, deliveryDir, projectDir, previewDir, contentPlan, generationMode: contentResult.generationMode, llmError: contentResult.llmError || null, projectFiles: ["index.html", "styles.css", "app.js", "server.js", "package.json", "README.md", "spec.json", "plan.json", "content-plan.json"] };
  }
}

module.exports = { GeneratorEngine };

