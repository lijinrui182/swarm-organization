# Automatic Delivery System MVP

This repository implements the product as an automatic delivery system rather than a chat-first AI platform.

## Current product shape
- Input: one-line or short-form product brief
- Output: runnable web project starter, preview artifact, README, delivery report, and zip package
- UX: order-style workflow instead of conversation-style interaction

## Module architecture
1. `Spec Builder`
   - Turns the raw brief into a structured spec.
   - Uses LiteLLM when configured, otherwise deterministic parsing rules.
2. `Planner`
   - Produces the delivery plan and file manifest.
   - Uses LiteLLM when configured, otherwise deterministic fallback steps.
3. `Generator`
   - Generates project files into `deliveries/<task-id>/project`.
   - Uses a stable template core plus optional LiteLLM content rewrite.
4. `Runner`
   - Serves the generated project through the main app and creates a preview artifact.
5. `Verifier`
   - Checks engineering readiness, page presence, required sections, README, and preview generation.
   - Uses LiteLLM for semantic QA when available.
6. `Repairer`
   - Rebuilds and reruns the project when verification fails.
7. `Packager`
   - Produces `project.zip`, `delivery_report.json`, and `delivery_summary.md`.

## LiteLLM routing
The runtime calls a LiteLLM-compatible `/chat/completions` endpoint through [src/llm/litellm-client.js](D:/Users/lijinrui/Desktop/Swarm%20Organization/src/llm/litellm-client.js).

Supported provider families in the router:
- OpenAI
- Anthropic
- Gemini via Vertex AI style model names
- DeepSeek

Routing is configured per stage with environment variables such as:
- `MODEL_PROVIDER_SPEC_BUILDER`
- `MODEL_PROVIDER_PLANNER`
- `MODEL_PROVIDER_GENERATOR`
- `MODEL_PROVIDER_VERIFIER`
- `MODEL_NAME_*`
- `MODEL_FALLBACKS_*`

See `.env.example` for the full matrix.

## Runtime note
The target long-term stack from the product plan is:
- Python
- FastAPI
- Pydantic
- PostgreSQL
- Redis
- LangGraph

The current workstation does not have Python installed, so this MVP keeps the executable runtime in zero-dependency Node.js to guarantee a runnable closed loop now. The stage boundaries and data contracts are already aligned with the intended Python migration.

## Output contract
Each successful task produces:
- `deliveries/<task-id>/project/`
- `deliveries/<task-id>/preview/home.svg`
- `deliveries/<task-id>/project.zip`
- `deliveries/<task-id>/delivery_report.json`
- `deliveries/<task-id>/delivery_summary.md`

## API contract
- `POST /api/tasks`
- `GET /api/tasks`
- `GET /api/tasks/:id`
- `GET /api/metrics`
- `GET /api/model-status`
- `GET /api/events`
- `GET /artifacts/...`

## Migration path to Python
1. Replace `src/server.js` with FastAPI while preserving the same input and output JSON shapes.
2. Move each engine in `src/engines` to Python services or LangGraph nodes.
3. Replace JSON file persistence with PostgreSQL + Redis.
4. Keep the frontend contract unchanged so the UI does not need a rewrite.
