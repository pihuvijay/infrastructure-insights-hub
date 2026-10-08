# ADR 0006: Redis for job queue, cache and agent state
Status: Accepted
Date: 2026-10-08
Related docs: [redis](../architecture/redis.md), [background-jobs](../architecture/background-jobs.md), [agents](../architecture/agents/README.md), [rate-limiting](../architecture/rate-limiting.md)

## Context
The system needs background jobs (sync, uploads, embedding), a cache for slow reads, shared rate-limit counters, and a place to keep agent state between steps. Redis is on VM 3 ([ADR 0002](0002-on-premises-vms.md)).

## Decision
Use Redis for three jobs: the job queue, the cache and agent state, plus shared rate-limit counters and de-duplication locks. Durable data never lives only in Redis; RCAs and incidents are in Postgres. Key naming and TTL rules are in [redis](../architecture/redis.md). Open decisions (TODO): arq vs Celery for the queue; LangGraph state in Redis or a Postgres checkpointer; Redis persistence (AOF/RDB).

## Alternatives considered
**Postgres-backed queue.** Strengths: fewer moving parts; the queue is as durable as the data. Why it lost for now: Redis is also needed for caching and shared rate limiting, and a Redis queue is the common pattern with arq/Celery. It remains the fallback.

**RabbitMQ or Kafka.** Strengths: robust messaging, routing, throughput. Why it lost: overkill at this scale, and another system to run.

**Temporal.** Strengths: a durable workflow engine with strong recovery. Why it lost: another large system to operate; Redis plus LangGraph checkpointing covers our needs at this scale. Recorded as an alternative.

**LangGraph Postgres checkpointer for agent state.** Strengths: durable state without relying on Redis persistence. Status: TODO, undecided.

## Consequences
Positive: one fast service covers queue, cache, state and counters.
Negative and accepted: one more service to run and monitor; the queue and state can be lost on restart unless persistence is configured (corrections item 8); the design must tolerate that by saving to Postgres first and re-queuing from database status.
Obligations: document key names and TTLs; never cache per-user data under a shared key; `/health` checks Redis.

## When to revisit
If Redis adds more operational burden than value, move the queue and state to Postgres.
