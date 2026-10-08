# Frontend

**Purpose:** the existing frontend: stack, structure, data fetching, and how pages map to endpoints.

**Related ADRs:** [0014 keep the Next.js frontend with a mock/live switch](../adr/0014-nextjs-frontend-mock-live.md), [0004 SSE](../adr/0004-sse-over-websockets.md), [0015 Box](../adr/0015-box-system-of-record.md)

Last updated: 2026-10-08. Read from `CLAUDE.md`, `package.json`, `src/`.

## Stack (fixed by CLAUDE.md)

Next.js 15 App Router, React 19, TypeScript strict, Tailwind v4, shadcn/ui, TanStack Query, Recharts, TipTap (Word-style editor), html-to-docx, lucide-react, sonner, Geist fonts. Never add Supabase, Vite, TanStack Start/Router or another UI/state library without asking.

## Structure

- `src/app/(app)/<route>/page.tsx`: thin server pages (metadata plus one view).
- `src/components/views/*View.tsx`: client views.
- `src/components/`: shared components (`PageHeader`, `AppSidebar`, `AgentPanel`, `rca/*`); `src/components/ui/` is shadcn only.
- `src/lib/types.ts`: API contract types. `src/lib/api.ts`: the only network caller. `src/lib/mock.ts`, `mock-data.ts`: fake backend. `src/lib/queries.ts`: TanStack Query hooks. `src/lib/agent-store.ts`: sidebar state and streaming. `rca-docx.ts`, `rca-html.ts`, `use-rca-doc.ts`: RCA Word export and shared form state.
- The frontend lives at the repo root; whether it moves into `frontend/` is an open question (it affects build config).

## Data fetching

TanStack Query hooks in `src/lib/queries.ts` call `api.*`. Data pages refetch about every 30 seconds in the target design ([streaming.md](streaming.md)); the current refetch settings were not checked here. TODO: verify against `src/components/Providers.tsx`.

## Page to endpoint map

| Page | Route | Main endpoints (from `src/lib/api.ts`) |
|---|---|---|
| Homepage | `/` | `/environments`, `/rca/insights`, `/tools/folders` |
| Environments | `/environments` | `/environments`, `/environments/{id}/notify`, `/environments/{id}/snapshots/apply-latest` |
| Tools | `/tools` | `/tools/folders` |
| Insights | `/rca/insights` | `/rca/insights`, `/agent/chat` |
| Create RCA | `/rca/create`, `/rca/create/[number]` | `/rca/incidents`, `/rca/incidents/{n}`, `/rca/root-cause-codes`, `/rca/reports/{n}` (GET, PUT), `/rca/reports/{n}/draft` |
| Word view | `/document/[number]` | `/rca/reports/{n}`, `/rca/reports/{n}/publish`, `/rca/reports/{n}/word-url` |
| Search | `/rca` | `/rca/filters`, `/rca/search`, `/agent/chat` |
| Data sources | `/rca/upload` | `/rca/connections` (and connect, sync, DELETE), `/rca/uploads` |
| Settings | `/admin` | not found in `api.ts`: no settings endpoint exists yet. TODO: add (line manager, notification toggles). |
| Build Release | `/build-release`, `/build-release/[env]` | `/release/environments` |

The homepage row is inferred from the widgets it shows (PRD 5.1); the exact calls were not traced. TODO: verify in `HomeView.tsx`.

## Browser storage

`localStorage` is used by `AppSidebar.tsx`, `HomeView.tsx` and `mock.ts`. In mock mode reports, uploads and connections are stored in the browser so the Word view tab sees the same data (README). These move to the server when endpoints go live.

## Integration points to add (build plan)

- Next.js rewrite for `/health` (today only `/api/v1/*`) and a System status indicator (build plan 1.5).
- Generated types from OpenAPI ([api.md](api.md)).
- Playwright tests ([testing.md](../testing.md)).
