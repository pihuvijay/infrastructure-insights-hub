---
name: add-cache
description: Add a Redis cache to a slow read, only after measuring.
---

# add-cache

## When to use
When a specific endpoint has been measured as slow (target: dashboards under 500 ms).

## When not to use
Anything not measured, per-user data under a shared key, or data that must be strictly fresh.

## Read first
- `docs/architecture/redis.md`
- ADR 0006
- `docs/requirements.md` (latency, consistency)

## Steps
1. Measure first and record the number (for example with the load test, `docs/commands.md`).
2. Implement cache-aside in Redis following the key and TTL rules in `redis.md` (`gev:cache:<resource>:<id-or-hash>`).
3. Choose a TTL that fits the 30-60 s consistency target.
4. Invalidate on writes.
5. Write tests: hit, miss, invalidation, and Redis down falls through to Postgres.
6. Re-measure and record the improvement.
7. Update `docs/architecture/redis.md`.

## Rules
- Never cache per-user data under a shared key.
- Redis down must not break pages.
- Durable data never lives only in Redis.

## Definition of done
- Tests written and passing (`write-tests`).
- Lint and type-check passing (`uv run ruff check .`, `uv run mypy app`, `npm run lint`, `npm run typecheck` as applicable).
- Docs updated via the `update-docs` skill.
- An ADR written via `write-adr` if a decision changed.

## Do not guess
If information is missing (a decision, a name, an address, a quota), stop and ask the user. Do not invent it. If it is not documented, ask. Record unknowns as `TODO: confirm with <who>` and add them to `docs/context/open-questions.md`.
