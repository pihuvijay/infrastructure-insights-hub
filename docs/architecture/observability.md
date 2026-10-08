# Observability

**Purpose:** how we see what the system is doing: logs, traces, metrics, health and alerts.

**Related ADRs:** [0025 observability](../adr/0025-observability.md), [0020 resilience](../adr/0020-resilience.md), [0008 vLLM](../adr/0008-vllm.md)

Last updated: 2026-10-08. Not built yet.

## Structured logging

JSON logs, one object per line, with a **request ID** on every line. The request ID is passed into background jobs so one request can be followed across API, worker and agents. Never log credentials or unnecessary ticket content (skill `add-observability`).

## Health

`GET /health` reports Postgres and Redis (build plan 1.3). The frontend System status indicator shows green or red for backend, database and Redis (build plan 1.5). Later checks: worker alive, model server reachable (TODO).

## Alerts

Error alerts exist before launch (build plan 7.4: trigger an error on purpose, the alert fires). Alert channel and tool are TODO.

## C11.9: Observability (in full)

- Structured JSON logs with a request ID on every line.
- OpenTelemetry tracing across API, services, agents and integrations, with trace IDs passed into background jobs.
- LLM and agent tracing: each node's inputs, outputs, token counts and latency. Candidate: self-hosted Langfuse (TODO). It must be self-hosted to keep data on-prem.
- Metrics: request latency (p95 against 500 ms), queue depth, failed jobs, circuit breaker state per integration, GPU memory and KV cache use.

## vLLM KV cache monitoring

The KV cache grows with concurrent requests and context length. Watch vLLM KV cache utilisation in production; high utilisation means requests queue or fail ([llm-serving.md](llm-serving.md)).

## What to look at during an incident

1. `/health` and the System status indicator.
2. Circuit breaker state per integration and "last synced" age.
3. Queue depth and failed jobs.
4. p95 latency against the 500 ms target.
5. vLLM KV cache and GPU memory.
6. Logs by request ID.
See [runbook.md](../runbook.md).
