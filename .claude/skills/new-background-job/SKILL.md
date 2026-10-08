---
name: new-background-job
description: Add a background job to the worker with idempotency, retries and visible failure.
---

# new-background-job

## When to use
When work is slow, needs retries, or must not block a request: syncs, uploads, embedding, batch agent runs.

## When not to use
Interactive work that must stream to the user (use `new-streaming-endpoint`).

## Read first
- `docs/architecture/background-jobs.md`
- `docs/architecture/redis.md`
- ADR 0006, ADR 0010
- `docs/architecture/resilience.md`

## Steps
1. Write the job function in `backend/app/workers/`.
2. Choose an idempotency key so running the job twice has the same effect as once.
3. Configure retries with exponential backoff and a maximum.
4. Define what happens on final failure: the job is kept and visible, never silently dropped, and the domain status shows it (for example Upload failed).
5. Pass the request or trace ID into the job.
6. Write unit tests, one behaviour at a time: succeeds, retries then fails visibly, duplicate queueing runs once.
7. Document it in `docs/architecture/background-jobs.md`.

## Rules
- Save durable data to Postgres before queuing the job (ADR 0010).
- Durable data never lives only in Redis.
- External calls go through the egress limiter and circuit breaker.

## Definition of done
- Tests written and passing (`write-tests`).
- Lint and type-check passing (`uv run ruff check .`, `uv run mypy app`, `npm run lint`, `npm run typecheck` as applicable).
- Docs updated via the `update-docs` skill.
- An ADR written via `write-adr` if a decision changed.

## Do not guess
If information is missing (a decision, a name, an address, a quota), stop and ask the user. Do not invent it. If it is not documented, ask. Record unknowns as `TODO: confirm with <who>` and add them to `docs/context/open-questions.md`.
