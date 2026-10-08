# ADR 0010: Background worker for sync and uploads
Status: Accepted
Date: 2026-10-08
Related docs: [background-jobs](../architecture/background-jobs.md), [integrations](../architecture/integrations.md), [resilience](../architecture/resilience.md), [redis](../architecture/redis.md), [flows](../architecture/flows.md)

## Context
Consistency is eventual: a 30-60 s delay from ServiceNow and Box is acceptable. Delivery of RCA uploads to Box must be at-least-once, because RCAs are critical historical records ([requirements](../requirements.md)). External services can be down or slow. Dashboards must respond in under 500 ms.

## Decision
Run a worker process consuming jobs from Redis. Sync jobs run on a schedule (interval TODO). Box uploads are jobs with retries, exponential backoff and idempotency so a retried upload does not create a duplicate. Failed jobs are visible, not silently dropped. The RCA is saved in Postgres **before** its upload is queued. Pages read from Postgres, never live from ServiceNow or Box (the "sync engine" pattern).

## Alternatives considered
**Calling ServiceNow and Box live on page load.** Strengths: always fresh, no sync code. Why it lost: slow, breaks the 500 ms target, and fails when the external service is down.

**arq vs Celery.** Both are job queue libraries that work with Redis. The source notes do not compare them, so strengths are not stated here. TODO: compare and decide in build plan 5.7, and record the choice with `write-adr`.

**RabbitMQ and Temporal.** RabbitMQ: robust messaging, but overkill and another system. Temporal: a durable workflow engine with strong recovery, but another large system to run; Redis plus LangGraph checkpointing covers our needs at this scale.

## Consequences
Positive: fast pages; resilience to external outages; uploads survive failures.
Negative and accepted: data can be up to 30-60 s old; the UI must show "last synced X ago"; another process to deploy and monitor; Redis persistence settings matter.
Obligations: idempotency keys on every job and write; failed jobs surfaced; egress rate limiting and circuit breakers in the integration clients ([ADR 0019](0019-rate-limiting.md), [ADR 0020](0020-resilience.md)).

## When to revisit
Job volume or scheduling needs grow.
