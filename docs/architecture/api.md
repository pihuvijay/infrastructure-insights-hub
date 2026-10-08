# API

**Purpose:** the API conventions, how the frontend calls it, and the endpoint list.

**Related ADRs:** [0003 FastAPI](../adr/0003-fastapi.md), [0014 Next.js with mock/live switch](../adr/0014-nextjs-frontend-mock-live.md), [0004 SSE](../adr/0004-sse-over-websockets.md), [0013 auth](../adr/0013-authentication.md)

Last updated: 2026-10-08. `docs/PRD.md` section 7 is the contract and is read-only. Anything the backend records about the API goes here.

## Conventions

- All routes under `/api/v1`, JSON in camelCase (PRD section 7). `/health` is outside the prefix (build plan 1.3).
- **One consistent error format everywhere.** The exact shape is TODO (no standard exists yet; `src/lib/api.ts` currently throws the response text or `Request failed (status)`).
- FastAPI generates OpenAPI from Pydantic models. Frontend TypeScript types are generated from it (for example `openapi-typescript`, written to `src/lib/api-types.ts` per `docs/commands.md`) so frontend and backend cannot silently disagree. CI fails if generated types differ from committed ones.
- Routes contain no business logic (module boundaries, [ADR 0001](../adr/0001-modular-monolith.md)).
- Every route except `/health` requires sign-in once auth exists.

Note: `src/lib/types.ts` is currently the hand-written contract ("Types are in `src/lib/types.ts` and are the contract" in the PRD). The move to generated types needs a decision on which file wins during the transition (TODO).

## Mock/live switching

`src/lib/api.ts` is the only place that calls the network. `const LIVE = process.env.NEXT_PUBLIC_API_MODE === "live"`; each method is `LIVE ? http(...) : mock.mockX(...)`. Live calls go to `/api/v1`, which `next.config.ts` rewrites to `API_URL` when set. Endpoints are switched to live one at a time (skill `connect-frontend-endpoint`). The UI never changes between modes.

## Endpoints

The authoritative list is `docs/PRD.md` section 7 (not duplicated here). Pages map to endpoints in [frontend.md](frontend.md).

### Used by `src/lib/api.ts` but not in the PRD table
- `GET /rca/reports/{number}/word-url` returns `{ url }` for Open in Word Online (`wordOnlineUrl`). Suggested PRD addition ([corrections](../context/corrections.md) item 23).

### Streaming
`POST /agent/chat` streams text; see [streaming.md](streaming.md).

### Health
`GET /health` checks Postgres and Redis and reports each as OK or down instead of crashing (build plan 1.3). The frontend's System status indicator calls it.

## Adding an endpoint

Use the skill `new-endpoint`: schemas, route, service, tests, error format, regenerate OpenAPI and types, update this file. CLAUDE.md also requires: new endpoint means a type, an entry in `api.ts` (live and mock), and an entry in PRD section 7. Because the PRD is read-only for foundation setup, a developer applies the PRD change.
