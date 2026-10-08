---
name: new-endpoint
description: Add a FastAPI endpoint end to end: schemas, route, service, tests, OpenAPI and frontend types, docs.
---

# new-endpoint

## When to use
When the backend must provide a new or changed `/api/v1` route.

## When not to use
Streaming endpoints (use `new-streaming-endpoint`) or changes only to the frontend mock.

## Read first
- `docs/architecture/api.md`
- `docs/PRD.md` section 7 (read-only)
- `src/lib/types.ts` and `src/lib/api.ts`
- ADR 0003 and ADR 0001
- `docs/testing.md`

## Steps
1. Confirm the endpoint is in PRD section 7. If not, note that a human must add it (PRD is read-only) and record it in `docs/architecture/api.md`.
2. Add Pydantic request and response schemas in `backend/app/schemas/`.
3. Add the route in `backend/app/api/v1/` (no business logic).
4. Add the logic in `backend/app/services/`.
5. Write unit tests for the service and an integration test for the route, one behaviour at a time.
6. Use the consistent error format (see `docs/architecture/api.md`).
7. Regenerate OpenAPI and the TypeScript types (`npx openapi-typescript http://localhost:8000/openapi.json -o src/lib/api-types.ts`).
8. Update `docs/architecture/api.md`.
9. Switch the frontend call with `connect-frontend-endpoint`.

## Rules
- Routes contain no business logic.
- JSON is camelCase per the PRD.
- Every route except `/health` requires sign-in once auth exists.
- Validate all input with Pydantic.

## Definition of done
- Tests written and passing (`write-tests`).
- Lint and type-check passing (`uv run ruff check .`, `uv run mypy app`, `npm run lint`, `npm run typecheck` as applicable).
- Docs updated via the `update-docs` skill.
- An ADR written via `write-adr` if a decision changed.

## Do not guess
If information is missing (a decision, a name, an address, a quota), stop and ask the user. Do not invent it. If it is not documented, ask. Record unknowns as `TODO: confirm with <who>` and add them to `docs/context/open-questions.md`.
