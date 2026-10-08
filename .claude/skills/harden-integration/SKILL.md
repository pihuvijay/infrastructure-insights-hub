---
name: harden-integration
description: Add timeouts, circuit breaker, egress limiting, retries and idempotency to an integration client.
---

# harden-integration

## When to use
When building or reviewing any ServiceNow, Box or other external client.

## When not to use
Internal-only code with no external calls.

## Read first
- `docs/architecture/resilience.md`, `docs/architecture/integrations.md`
- `docs/architecture/rate-limiting.md`
- ADR 0019, ADR 0020
- The existing client code in `backend/app/integrations/`

## Steps
1. Add a timeout on every call.
2. Add retries with exponential backoff and a maximum.
3. Add the egress limiter and 429 / `Retry-After` handling.
4. Add a circuit breaker (closed, open, half-open) with TODO thresholds recorded.
5. Make writes idempotent with a key.
6. Define what the UI shows when the service is down (last synced X ago).
7. Test each failure mode with mocked responses: timeout, 5xx, 429, open circuit, recovery.
8. Update `docs/architecture/resilience.md` and `integrations.md`.

## Rules
- Pages read from Postgres, never live from the external system.
- Failed jobs stay visible.

## Definition of done
- Tests written and passing (`write-tests`).
- Lint and type-check passing (`uv run ruff check .`, `uv run mypy app`, `npm run lint`, `npm run typecheck` as applicable).
- Docs updated via the `update-docs` skill.
- An ADR written via `write-adr` if a decision changed.

## Do not guess
If information is missing (a decision, a name, an address, a quota), stop and ask the user. Do not invent it. If it is not documented, ask. Record unknowns as `TODO: confirm with <who>` and add them to `docs/context/open-questions.md`.
