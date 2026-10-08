# ADR 0025: Observability with structured logs, OpenTelemetry and agent tracing
Status: Accepted
Date: 2026-10-08
Related docs: [observability](../architecture/observability.md), [resilience](../architecture/resilience.md), [security](../security.md)

## Context
A single user action can touch Nginx, the API, services, agents, the worker, Postgres, Redis, vLLM and external services. The 500 ms target, queue health and GPU capacity must be visible. Data must stay on-prem, so hosted SaaS tools are not an option for ticket content.

## Decision
- Structured JSON logs with a request ID on every line.
- OpenTelemetry tracing across API, services, agents and integrations, with trace IDs passed into background jobs.
- LLM and agent tracing: each node's inputs, outputs, token counts and latency. Candidate: self-hosted Langfuse (TODO). It must be self-hosted to keep data on-prem.
- Metrics: request latency (p95 against 500 ms), queue depth, failed jobs, circuit breaker state per integration, GPU memory and KV cache use.
- Plus `/health` and error alerts.

## Alternatives considered
**Logs only.** Strengths: simplest. Why it lost: cannot follow one request across API, agents and jobs.

**Hosted observability SaaS.** Strengths: fast to set up with rich dashboards. Why it lost: data leaves the network.

## Consequences
Positive: faster debugging; evidence for the latency target; model behaviour is inspectable.
Negative: an extra self-hosted tool to run for agent tracing; care needed so logs and traces do not leak credentials or sensitive ticket content.
Obligations: skill `add-observability`; `security-reviewer` checks logs and traces.

## When to revisit
If the company provides a standard observability platform.
