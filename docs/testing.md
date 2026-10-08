# Testing

**Purpose:** the testing pyramid, what each layer covers, how to run each, and how CI and AI evals fit in.

**Related ADRs:** [0017 testing and CI](adr/0017-testing-ci.md), [0009 RAG](adr/0009-rag-over-fine-tuning.md), [0023 Ollama/vLLM](adr/0023-ollama-local-vllm-server.md), [0024 CI/CD](adr/0024-cicd-github-actions.md)

Last updated: 2026-10-08. Today the repo has no tests; the frontend is verified with `npm run lint && npm run typecheck && npm run build` (AGENTS.md).

## The pyramid

| Layer | Quantity | Covers | Where | Run |
|---|---|---|---|---|
| Unit | Many | Services and pure logic; no network, no real DB, fake LLM client | `backend/tests/unit/` | `uv run pytest tests/unit -v` |
| Integration | Fewer | API endpoints and database code against real Postgres (pgvector image) and Redis in Docker | `backend/tests/integration/` | `uv run pytest tests/integration -v` (Docker running) |
| End-to-end | A handful | Key user journeys in a real browser (Playwright) | `tests/e2e/` (per `docs/commands.md`) | `npx playwright test` |
| AI evals | About 30 questions | Whether answers and retrieval are accurate | `backend/evals/` | script set in build plan 6.1 |
| Load | By hand | Dashboards stay under 500 ms | `tests/load/` | `uv run locust -f tests/load/locustfile.py` |

Exact commands are in `docs/commands.md`.

## Rules

- Write tests one at a time with the code: one behaviour, make it pass, then the next.
- No test calls a real LLM, ServiceNow or Box except evals (and the throwaway `spikes/`).
- Mock external services with fake responses including errors and `429` (build plan 5.8).
- Every pull request needs tests, passing CI and updated docs.
- Skill: `write-tests`.

## CI behaviour

CI runs lint, format, types, unit and integration tests, migration checks, type-drift check and docker build on every pull request; merges are blocked on failure ([ci-cd.md](architecture/ci-cd.md)). The pipeline grows over the build; see the table at the end of `docs/build-plan.md`.

## AI evals

A set of about 30 real questions with known answers from past incidents, in `backend/evals/`. Run after every change to a prompt, chunking strategy, embedding model or LLM. Results are stored and compared with the previous run; an AI change is not done if accuracy dropped without a written reason (skill `run-evals`). Evals run against **staging (vLLM)** before release because Ollama and vLLM builds can differ. The `evals.yml` workflow is manual or on pull requests labelled `ai`. Check RCA draft output has every template section in order.

## Before a pull request

Use the `test-before-pr` skill in `.devin/skills/` (lint, types, build, tests, run the app, click through flows, console, screenshots).
