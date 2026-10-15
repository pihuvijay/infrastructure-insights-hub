# Ingest job

**Purpose:** Pull ServiceNow incidents, Box RCA Word documents and uploaded files (historical spreadsheet, logs, post-mortems) into Postgres in a normalised shape.

**Related ADRs:** [0007 LangGraph](../../adr/0007-langgraph.md), [0022 model routing](../../adr/0022-model-routing.md), [0026 interactive vs batch](../../adr/0026-interactive-vs-batch-agents.md), [0010 background worker](../../adr/0010-background-worker.md), [0019 rate limiting](../../adr/0019-rate-limiting.md), [0020 resilience](../../adr/0020-resilience.md)

Last updated: 2026-10-08. Part of the [agents overview](README.md). Not built yet.

## Inputs (Pydantic shape, described)
A source descriptor (ServiceNow, Box or upload) and a cursor such as 'since last sync'. Raw records have fields like those in `SnowIncident` and `SnowIncidentDetail` (`src/lib/types.ts`): number, short description, project, priority, opened, resolved, hours, resolved by, work notes, resolution comments, root cause code.

## Outputs
Normalised incident, RCA-document and upload rows saved to Postgres, and a list of changed record ids passed on to Embed.

## Uses the LLM?
No. It is fetching, parsing and normalising. An LLM would add cost and error for no gain.

## Model
None.

## Prompt location
Not applicable (no prompts).

## State read and written
Reads: last-sync cursor per source (Postgres). Writes: incidents, uploads, sync status, record counts.

## Failure handling and retries
Runs in the worker. Every external call has a timeout, passes the egress limiter and the circuit breaker, handles 429 and `Retry-After`, and writes idempotently (upsert). A failed job is kept visible and retried with backoff; an open circuit means the last synced data is served with 'last synced X ago'. See [resilience.md](../resilience.md) and [integrations.md](../integrations.md).

## How it is tested
Unit tests with mocked ServiceNow and Box responses, including errors and 429. Integration test of the upsert against Postgres. Eval questions are not needed here.

## Open questions
Sync interval (TODO, within the 30-60 s target). ServiceNow and Box quotas (TODO from admins). Where uploaded files are stored (TODO). How the historical spreadsheet columns map to fields (TODO: needs a copy of the spreadsheet).
