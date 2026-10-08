# Architecture decision records (ADRs)

An ADR is a short document that records one architecture decision: the problem, the options, what we chose, and when to reconsider. The format follows Michael Nygard's 2011 "Documenting Architecture Decisions", extended here with **alternatives considered** (each with its genuine strengths and why it lost) and **when to revisit** (concrete triggers).

## Rules

- ADRs are **never edited after acceptance**, except to change their status.
- A changed decision is a **new ADR** marked "Supersedes ADR NNNN", and the old one is marked "Superseded by ADR NNNN".
- Every ADR links to the architecture docs it affects; every architecture doc links to its related ADRs.
- Use the `write-adr` skill (`.claude/skills/write-adr/SKILL.md`) to add one.

## Template

```
# ADR NNNN: Title
Status: Accepted | Proposed
Date: YYYY-MM-DD
Related docs: links

## Context
## Decision
## Alternatives considered
## Consequences
## When to revisit
```

## Index

| ADR | Title | Status |
|---|---|---|
| [0001](0001-modular-monolith.md) | Modular monolith over microservices | Accepted |
| [0002](0002-on-premises-vms.md) | On-premises VMs over cloud hosting | Accepted |
| [0003](0003-fastapi.md) | FastAPI for the backend | Accepted |
| [0004](0004-sse-over-websockets.md) | Server-Sent Events over WebSockets | Accepted |
| [0005](0005-postgres-pgvector.md) | PostgreSQL with pgvector over Pinecone | Accepted |
| [0006](0006-redis.md) | Redis for job queue, cache and agent state | Accepted |
| [0007](0007-langgraph.md) | LangGraph for the agent pipeline | Accepted |
| [0008](0008-vllm.md) | vLLM over Ollama for model serving | Accepted |
| [0009](0009-rag-over-fine-tuning.md) | RAG over fine-tuning; no in-house quantisation | Accepted |
| [0010](0010-background-worker.md) | Background worker for sync and uploads | Accepted |
| [0011](0011-nginx.md) | Nginx for HTTPS, routing and rate limiting; no separate load balancer or API gateway | Accepted |
| [0012](0012-human-review.md) | Mandatory human review before any RCA upload | Accepted |
| [0013](0013-authentication.md) | Authentication method | Proposed |
| [0014](0014-nextjs-frontend-mock-live.md) | Keep the existing Next.js frontend with a mock/live API switch | Accepted |
| [0015](0015-box-system-of-record.md) | Box remains the system of record for RCA documents | Accepted |
| [0016](0016-environments-docker.md) | Environments and Docker-based deployment | Accepted |
| [0017](0017-testing-ci.md) | Testing and CI strategy | Accepted |
| [0018](0018-docs-skills-agents.md) | Documentation, skills and agents approach | Accepted |
| [0019](0019-rate-limiting.md) | Two-tier rate limiting | Accepted |
| [0020](0020-resilience.md) | Circuit breakers, timeouts and graceful degradation | Accepted |
| [0021](0021-stateless-backend.md) | Stateless backend; horizontal scaling deferred | Accepted |
| [0022](0022-model-routing.md) | Model routing by task, with a fixed embedding model | Accepted |
| [0023](0023-ollama-local-vllm-server.md) | Ollama for local development, vLLM for staging and production | Accepted |
| [0024](0024-cicd-github-actions.md) | CI/CD with GitHub Actions | Accepted (runner and registry TODO) |
| [0025](0025-observability.md) | Observability with structured logs, OpenTelemetry and agent tracing | Accepted |
| [0026](0026-interactive-vs-batch-agents.md) | Interactive agents in the API, batch agents in the worker | Accepted |
