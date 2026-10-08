# ADR 0014: Keep the existing Next.js frontend with a mock/live API switch
Status: Accepted
Date: 2026-10-08
Related docs: [frontend](../architecture/frontend.md), [api](../architecture/api.md), [requirements](../requirements.md)

## Context
The UI was built first, as a prototype on mock data, before the backend design. It helped discover requirements: pages, filters, the RCA template flow, the agent sidebar. It is built on Next.js 15 App Router, React 19, TypeScript, Tailwind v4, shadcn/ui, TanStack Query, Recharts, TipTap and html-to-docx (`CLAUDE.md`, `package.json`). All network calls already go through `src/lib/api.ts`, where `NEXT_PUBLIC_API_MODE=mock | live` switches between sample data and the real backend. The endpoint list the backend must provide is in `docs/PRD.md` section 7.

Building the UI before the design is not the usual order. It is acceptable here because the UI is treated as a prototype that discovered requirements, and the design phase is capped at about a week. A source note argued the backend should be built first because a UI with no backend is "hollow"; the agreed approach is vertical slices instead ([corrections](../context/corrections.md) item 21).

## Decision
Keep the frontend. Keep all calls inside `src/lib/api.ts` with the mock/live switch. Move endpoints to live one at a time, starting with non-AI pages (Environments, Tools, Settings). Use TanStack Query for fetching and periodic refetching. Frontend types will be generated from the backend's OpenAPI.

## Alternatives considered
**Rebuild the UI.** Strengths: could align to the backend from scratch. Why it lost: the UI works, matches the PRD and costs time to redo before January.

**Backend first, then connect the UI.** Strengths: backend depth first. Why it lost: delays real value and risks integration surprises at the end; vertical slices deliver both together.

## Consequences
Positive: the UI does not change when the backend arrives; mock mode stays useful for demos and development.
Negative: the mock layer (`mock.ts`, `mock-data.ts`) must be kept in step with the contract; mock behaviour can hide integration issues until a slice is live.
Obligations: no `fetch` in components; new endpoint means type, `api.ts` entry (live and mock) and PRD entry.

## When to revisit
If the frontend moves into `frontend/` (an open question; it affects build config).
