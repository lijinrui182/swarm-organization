# Swarm Organization

<p align="center">
  <img src="web/assets/swarm-mark.svg" alt="Swarm Organization icon" width="96" height="96">
</p>

<p align="center">
  <strong>Turn one-line briefs into production-ready deliverables.</strong>
</p>

<p align="center">
  <a href="https://github.com/lijinrui182/swarm-organization/releases"><img src="https://img.shields.io/github/v/release/lijinrui182/swarm-organization?include_prereleases&style=for-the-badge" alt="GitHub release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js 18+"></a>
</p>

**Swarm Organization** is an AI-powered delivery pipeline that takes a single-line project brief and orchestrates it through a complete production loop:

`brief 鈫?spec 鈫?plan 鈫?generate 鈫?preview 鈫?verify 鈫?repair 鈫?package`

You submit a request. The platform handles the rest 鈥?structured specs, code generation, quality verification, and final packaging.

![Swarm Organization Web UI](docs/assets/webui-dashboard.png)

[Quick Start](#quick-start) 路 [API Reference](#api-reference) 路 [Architecture](#architecture) 路 [Model Routing](#model-routing)

## Why This Exists

Most AI demos stop at "generate some text" or "chat with a model."

Swarm Organization explores a different product shape: an **order-style delivery system** where the user submits a request and the platform orchestrates a full production pipeline around it. No prompt engineering required 鈥?just describe what you want.

Use it to validate:

- **AI-assisted internal delivery tooling** 鈥?automate repetitive project scaffolding
- **Brief-to-project automation flows** 鈥?convert requirements to runnable code
- **Multi-stage LLM orchestration** 鈥?coordinate specialized models per pipeline stage
- **Verification and repair loops** 鈥?auto-detect and fix quality issues
- **Product direction** 鈥?test ideas before investing in a heavier backend stack

## Highlights

- **[7-Stage Pipeline](#product-shape)** 鈥?spec, plan, generate, runtime, verify, repair, package
- **[Web Console](#web-console)** 鈥?control dashboard with workflow visualization, module status, and artifact previews
- **[HTTP API](#api-reference)** 鈥?RESTful endpoints for task creation, status polling, and artifact retrieval
- **[Model Routing](#model-routing)** 鈥?per-stage provider/model/fallback configuration via LiteLLM or direct providers
- **[Quality Verification](#verification)** 鈥?automated checks for runtime health, file integrity, and content quality
- **[Self-Healing](#product-shape)** 鈥?repair loop rebuilds and re-verifies when output fails checks
- **[Portable Output](#output-artifacts)** 鈥?generates runnable project starters, previews, reports, and zip packages

## How It Works

```
User Brief (Web UI / API)
         鈹?         鈻?鈹屸攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹?鈹?                  Swarm Organization                    鈹?鈹?                                                        鈹?鈹? 鈹屸攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹? 鈹屸攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹? 鈹屸攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹? 鈹屸攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹愨攤
鈹? 鈹?  Spec   鈹傗啋 鈹? Planner 鈹傗啋 鈹侴enerator 鈹傗啋 鈹俁untime  鈹傗攤
鈹? 鈹?Builder  鈹? 鈹?         鈹? 鈹?         鈹? 鈹?        鈹傗攤
鈹? 鈹斺攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹? 鈹斺攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹? 鈹斺攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹? 鈹斺攢鈹€鈹€鈹€鈹攢鈹€鈹€鈹€鈹樷攤
鈹?                                                 鈹?    鈹?鈹? 鈹屸攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹? 鈹屸攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹? 鈹屸攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹愨攤     鈹?鈹? 鈹?Packager 鈹傗啇 鈹?Repairer 鈹傗啇 鈹?   Verifier      鈹傗攤     鈹?鈹? 鈹?         鈹? 鈹? (retry) 鈹? 鈹?(pass/fail gate) 鈹傗攤     鈹?鈹? 鈹斺攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹? 鈹斺攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹? 鈹斺攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹樷攤     鈹?鈹斺攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹?         鈹?         鈻?   Preview / Report / Zip
```

Each stage is a discrete engine with clean boundaries, making the system easy to understand, test, and eventually migrate to the planned Python stack.

## Product Shape

| Stage | Engine | Responsibility |
|-------|--------|----------------|
| 1. Spec Builder | `spec-builder.js` | Turns raw brief into structured project requirements |
| 2. Planner | `planner-engine.js` | Produces execution steps, file targets, and verification expectations |
| 3. Generator | `generator-engine.js` | Writes the runnable project starter and supporting files |
| 4. Runtime | `runtime-engine.js` | Loads generated output and produces preview assets |
| 5. Verifier | `verifier-engine.js` | Checks runtime health, required files, sections, and content quality |
| 6. Repairer | `repairer-engine.js` | Rebuilds and re-verifies when output fails verification |
| 7. Packager | `packager-engine.js` | Emits final report, summary, and downloadable zip package |

## Quick Start

### Requirements

- **Node.js** 18+

### Install and Run

```bash
npm start
```

Then open:

```
http://127.0.0.1:3000
```

### Environment Setup (Optional)

Copy `.env.example` to `.env` to enable LiteLLM gateway or direct provider routing:

```bash
cp .env.example .env
```

If no gateway or provider keys are configured, the system falls back to deterministic local behavior 鈥?the MVP remains fully runnable without any external API keys.

## Web Console

The Web UI is designed as a **control console** rather than a chat surface. It shows:

- **Task intake** 鈥?submit briefs with delivery type, framework, style, and platform options
- **Workflow visualization** 鈥?real-time pipeline progress through all 7 stages
- **Module status** 鈥?health and state of each engine
- **Artifact previews** 鈥?generated previews, reports, and downloadable packages
- **Task history** 鈥?track all past deliveries
- **Model routing state** 鈥?active providers and fallback chains

## Usage

### From the Web UI

1. Enter a short project brief
2. Pick delivery type, framework, style, and target platform
3. Submit the task
4. Watch the pipeline progress through spec 鈫?plan 鈫?generate 鈫?runtime 鈫?verify 鈫?repair 鈫?package
5. Open the generated preview, report, summary, or zip artifact

### From the API

Create a task:

```bash
curl -X POST http://127.0.0.1:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Build a dark tech AI tools directory for university students",
    "outputType": "web_project",
    "framework": "nextjs",
    "style": "dark_tech",
    "targetPlatform": "web"
  }'
```

Check task status:

```bash
curl http://127.0.0.1:3000/api/tasks
curl http://127.0.0.1:3000/api/tasks/<task-id>
```

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/model-status` | GET | Model routing status |
| `/api/tasks` | GET | List all tasks |
| `/api/tasks` | POST | Create a new task |
| `/api/tasks/:id` | GET | Get task status and details |
| `/api/metrics` | GET | System metrics |
| `/api/events` | GET | Event stream |
| `/artifacts/...` | GET | Download generated artifacts |

## Output Artifacts

Each successful task writes artifacts under `deliveries/<task-id>/`:

| Path | Description |
|------|-------------|
| `project/` | Generated runnable project starter |
| `preview/home.svg` | Visual preview asset |
| `project.zip` | Downloadable project package |
| `delivery_report.json` | Structured delivery report |
| `delivery_summary.md` | Human-readable delivery summary |

## Model Routing

The backend supports staged model routing for each pipeline stage:

- **Spec Builder** 鈥?structured requirement extraction
- **Planner** 鈥?execution plan generation
- **Generator** 鈥?code and file generation
- **Verifier** 鈥?quality assessment
- **Repairer** 鈥?fix and rebuild
- **Finalizer** 鈥?report and packaging

Configure provider, model, and fallback chains per stage via `.env.example`.

Supported modes:
- **LiteLLM gateway** 鈥?unified proxy for multiple providers
- **Direct provider** 鈥?native API integration
- **Deterministic fallback** 鈥?no external keys required for local development

## Architecture

```text
src/
  core/              Delivery engine, task store, event hub, knowledge base, cost manager, resource monitor
  engines/           7 pipeline engines + model router
  llm/               LiteLLM client and provider abstraction
  utils/             Shared helpers (env, hash, id, json, zip)
web/                 Local Web Console (HTML/CSS/JS)
scripts/             Smoke tests and regression checks
docs/                Architecture notes and assets
```

### Key Subsystems

- **[Delivery Engine](src/core/delivery-engine.js)** 鈥?orchestrates the 7-stage pipeline with state management
- **[Task Store](src/core/task-store.js)** 鈥?file-based task persistence and status tracking
- **[Event Hub](src/core/event-hub.js)** 鈥?real-time event streaming for UI and API consumers
- **[Knowledge Base](src/core/knowledge-base.js)** 鈥?domain knowledge for spec and planning stages
- **[Cost Manager](src/core/cost-manager.js)** 鈥?token usage tracking and cost estimation
- **[Resource Monitor](src/core/resource-monitor.js)** 鈥?system resource usage and health checks
- **[Model Router](src/engines/model-router.js)** 鈥?per-stage provider selection with fallback chains

See [docs/architecture.md](docs/architecture.md) for detailed architecture documentation and migration direction.

## Verification

Run local smoke test:

```bash
npm run smoke
```

Run backend regression checks:

```bash
npm run backend-check
```

## Current Constraints

- **MVP stage** 鈥?not a production multi-tenant system
- **File-based persistence** 鈥?no database yet
- **Web project focus** 鈥?primary delivery target is generated website starters
- **Node.js runtime** 鈥?clean stage boundaries preserved for planned Python migration

## Roadmap

The intended long-term stack:

- **Python** + **FastAPI** + **Pydantic**
- **PostgreSQL** + **Redis**
- **LangGraph** for orchestration

This repository keeps the runtime in Node.js for now so the delivery loop remains executable on a minimal workstation with zero infrastructure dependencies.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=lijinrui182/swarm-organization&type=date)](https://www.star-history.com/#lijinrui182/swarm-organization&type=date)

## License

[MIT](LICENSE)



