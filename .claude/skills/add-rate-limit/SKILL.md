---
name: add-rate-limit
description: Add an ingress or egress rate limit and test that it triggers and recovers.
---

# add-rate-limit

## When to use
When adding an expensive endpoint, a new external call, or after a quota is learned.

## When not to use
General retry logic with no limit needed (use `harden-integration`).

## Read first
- `docs/architecture/rate-limiting.md`
- ADR 0019, ADR 0011
- `docs/architecture/redis.md`

## Steps
1. Decide ingress (into our app) or egress (out to ServiceNow or Box).
2. Ingress: an Nginx `limit_req` rule in `infra/nginx/`, or a stricter per-user limit on an expensive AI endpoint in FastAPI stored in Redis (library TODO: `fastapi-limiter` or `slowapi`).
3. Egress: wrap the integration client calls in the shared Redis limiter, set below the service quota.
4. Handle HTTP 429 and honour `Retry-After`.
5. Write a test that the limit triggers and then recovers.
6. Update `docs/architecture/rate-limiting.md`.

## Rules
- The egress counter must be shared in Redis when more than one process calls a service.
- Agent loops and retries must also be capped.
- What the user sees when limited must be a clear message, not a spinner.

## Definition of done
- Tests written and passing (`write-tests`).
- Lint and type-check passing (`uv run ruff check .`, `uv run mypy app`, `npm run lint`, `npm run typecheck` as applicable).
- Docs updated via the `update-docs` skill.
- An ADR written via `write-adr` if a decision changed.

## Do not guess
If information is missing (a decision, a name, an address, a quota), stop and ask the user. Do not invent it. If it is not documented, ask. Record unknowns as `TODO: confirm with <who>` and add them to `docs/context/open-questions.md`.
