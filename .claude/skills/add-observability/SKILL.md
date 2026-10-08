---
name: add-observability
description: Add structured logs, tracing, metrics and agent tracing for a new component.
---

# add-observability

## When to use
When adding a new service, job, integration or agent.

## When not to use
Changing existing log text only.

## Read first
- `docs/architecture/observability.md`
- ADR 0025
- `docs/security.md`

## Steps
1. Add structured JSON logs with the request ID on every line.
2. Add OpenTelemetry spans around the component's work and pass trace IDs into jobs.
3. Add metrics where relevant: latency, queue depth, failed jobs, breaker state, GPU or KV cache use.
4. If it calls a model, add agent tracing: inputs, outputs, token counts and latency (self-hosted tool only).
5. Confirm no credentials or unnecessary ticket content are logged.
6. Update `docs/architecture/observability.md`.

## Rules
- Tracing tools must be self-hosted to keep data on-prem.
- Never log secrets.

## Definition of done
- Tests written and passing (`write-tests`).
- Lint and type-check passing (`uv run ruff check .`, `uv run mypy app`, `npm run lint`, `npm run typecheck` as applicable).
- Docs updated via the `update-docs` skill.
- An ADR written via `write-adr` if a decision changed.

## Do not guess
If information is missing (a decision, a name, an address, a quota), stop and ask the user. Do not invent it. If it is not documented, ask. Record unknowns as `TODO: confirm with <who>` and add them to `docs/context/open-questions.md`.
