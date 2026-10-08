---
name: new-integration
description: Add an external system client (like ServiceNow or Box) with all protections.
---

# new-integration

## When to use
When integrating a new external API. Only ServiceNow and Box are in scope today; Smartsheet, Outlook and WFH rosters are unconfirmed (TODO: confirm with manager).

## When not to use
Adding a simple link to the Tools page (links are not integrations).

## Read first
- `docs/architecture/integrations.md`
- `docs/architecture/rate-limiting.md`, `docs/architecture/resilience.md`
- ADR 0010, 0019, 0020
- `docs/security.md`

## Steps
1. Create the client in `backend/app/integrations/`.
2. Read credentials from settings only, never from code or the browser.
3. Add timeouts, retries with backoff, and 429 handling with `Retry-After`.
4. Route all calls through the shared egress limiter and a circuit breaker (use `harden-integration`).
5. Create the sync job with `new-background-job`.
6. Define behaviour when the service is down (last synced data with a label).
7. Write tests with fake responses including errors and 429.
8. Document it in `docs/architecture/integrations.md`.

## Rules
- Do not design for unconfirmed integrations.
- Credentials only on the backend.
- Pages read from Postgres, never live from the external system.

## Definition of done
- Tests written and passing (`write-tests`).
- Lint and type-check passing (`uv run ruff check .`, `uv run mypy app`, `npm run lint`, `npm run typecheck` as applicable).
- Docs updated via the `update-docs` skill.
- An ADR written via `write-adr` if a decision changed.

## Do not guess
If information is missing (a decision, a name, an address, a quota), stop and ask the user. Do not invent it. If it is not documented, ask. Record unknowns as `TODO: confirm with <who>` and add them to `docs/context/open-questions.md`.
