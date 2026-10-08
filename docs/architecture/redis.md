# Redis

**Purpose:** what Redis is used for, how keys are named, and what happens when Redis restarts.

**Related ADRs:** [0006 Redis](../adr/0006-redis.md), [0010 background worker](../adr/0010-background-worker.md), [0019 rate limiting](../adr/0019-rate-limiting.md), [0021 stateless backend](../adr/0021-stateless-backend.md)

Last updated: 2026-10-08. Redis runs on VM 3 in staging and production, and as a container (`redis:7`) locally.

**Rule: durable data never lives only in Redis.** RCAs and incidents are in Postgres. Redis holds only things that can be rebuilt or retried.

## Redis's three jobs

| Job | What is stored | Key naming (proposed) | TTL | If Redis restarts |
|---|---|---|---|---|
| Job queue | Pending jobs: ServiceNow sync, Box sync, Box uploads, embedding, batch agent runs | `gev:queue:<queue-name>` (exact keys depend on arq vs Celery, TODO) | Jobs persist until done (TODO) | Without persistence, queued jobs are lost. Because RCAs are saved in Postgres before the upload is queued, a lost upload job can be re-queued from the database status. |
| Cache | Results of slow reads (cache-aside) | `gev:cache:<resource>:<id-or-hash>` | TODO values, per resource | Cache is rebuilt on demand. Pages are slower, not broken. |
| Agent state | LangGraph state between steps (or a Postgres checkpointer, TODO) | `gev:agent:<run-id>` | TODO | A running agent run may need to start again. |

Also: shared counters for rate limiting ([rate-limiting.md](rate-limiting.md)), key `gev:ratelimit:<scope>:<id>`; and idempotency / de-duplication keys, `gev:lock:<job-or-task-id>`. The `gev:` prefix and layout above are proposals, TODO: confirm when the first key is written.

## Rules

- Never cache per-user data under a shared key (skill `add-cache`).
- Every key has a TTL unless it is a queue.
- Measure before adding a cache; add caching only to endpoints shown to be slow ([build plan 7.1](../build-plan.md)).
- Invalidate on writes.

## Persistence

AOF/RDB persistence settings are TODO (you / IT). Corrections item 8: "Redis state lets workflows survive failures" is only true if persistence is configured.

## Failure behaviour

If Redis is down, pages still load from Postgres (cache misses fall through); background jobs pause; rate limiting must fail in a defined way (TODO: decide fail-open or fail-closed). `/health` reports Redis as down rather than crashing (build plan 1.3). See [resilience.md](resilience.md).

## Open questions

arq vs Celery. LangGraph state in Redis or a Postgres checkpointer. Persistence settings. Key TTLs.
