# Repo inventory

Last updated: 2026-10-08. Everything below was read from the files named. Nothing is described that was not read.

## Top level (read via directory listing)
- `README.md` (153 lines): product README. Pages, agents, RCA template, run instructions, known gaps.
- `CLAUDE.md` (34 lines) and `AGENTS.md` (9 lines): rules for AI assistants. Stack is fixed, never add Supabase / Vite / TanStack Start, use CSS tokens, no `any`, read the PRD, do not invent.
- `docs/PRD.md` (129 lines): specification and API contract (read-only).
- `docs/checklists/create-rca.md`: per-feature checklist for Create RCA (PRD §5.5, §5.6, §6). Open items: verify `.docx` in Word, wire to FastAPI/Box, narrow layouts.
- `docs/commands.md` (146 lines) and `docs/build-plan.md` (838 lines): written by the developer, currently untracked. `build-plan.md` is a walking-skeleton plan (Stages 0-8). `commands.md` is the command cheat sheet.
- `docs/gev-foundation-prompt (1).md`: the foundation prompt this work follows.
- `package.json`, `.env.example` (names `NEXT_PUBLIC_API_MODE`, `API_URL`), `next.config.ts` (rewrites `/api/v1/*` to `API_URL` when set), `.gitignore`, `.prettierrc`, `eslint.config.mjs`, `tsconfig.json`, `vercel.json`.
- Scripts in `package.json`: `dev`, `build`, `start`, `lint`, `typecheck`, `format`.
- Not present yet: `backend/`, `infra/`, `.github/`, `docs/context/source/`, tests, Dockerfiles.

## Existing skills and agents (`.devin/`)
- `.devin/skills/build-feature/SKILL.md`: turns a PRD section into `docs/checklists/<feature>.md`, builds against it, ticks only what has been seen working, hands off to tester and reviewer.
- `.devin/skills/test-before-pr/SKILL.md`: install, lint, type-check, build, tests, run app, click through, console check, screenshots, PR description.
- `.devin/agents/reviewer/AGENT.md`: read-only reviewer (spec completeness, design, rules, data/security, code quality). Mentions RLS, which does not apply to this stack (no Supabase). Suggestion only; file not edited.
- `.devin/agents/tester/AGENT.md`: runs the app and verifies checklist items; does not edit code.

## Frontend routes (`src/app/**/page.tsx`)
`/` (home), `/environments`, `/tools`, `/rca` (search), `/rca/create`, `/rca/create/[number]`, `/rca/insights`, `/rca/upload` (Data sources), `/admin`, `/build-release`, `/build-release/[env]`, `/document/[number]` (Word view).
Views live in `src/components/views/`: Admin, BuildRelease, CreateRca, DocumentEditor, Environments, Home, Insights, RcaEditor, ReleaseTickets, Search, Tools, Upload. RCA components in `src/components/rca/`.
Browser storage (`localStorage`) is used in `src/components/AppSidebar.tsx`, `src/components/views/HomeView.tsx` and `src/lib/mock.ts`.

## Endpoints in `src/lib/api.ts` (prefix `/api/v1`)
GET `/tools/folders`, `/rca/insights`, `/rca/filters`, `/release/environments`, `/environments`, `/rca/connections`, `/rca/uploads`, `/rca/root-cause-codes`, `/rca/incidents`, `/rca/incidents/{n}`, `/rca/reports/{n}`, `/rca/reports/{n}/word-url` (not in PRD).
POST `/environments/{id}/notify`, `/environments/{id}/snapshots/apply-latest`, `/rca/connections/{id}/connect`, `/rca/connections/{id}/sync`, `/rca/uploads` (multipart `files`), `/rca/reports/{n}/draft`, `/rca/reports/{n}/publish` (multipart `report`, `file`), `/rca/search` (multipart `payload`, `files`), `/agent/chat` (JSON, streamed text read with a `ReadableStream` reader).
PUT `/rca/reports/{n}`. DELETE `/rca/connections/{id}`.
The mock/live switch is `NEXT_PUBLIC_API_MODE === "live"`. Errors are thrown from the response text; there is no standard error format yet.

## Data types (`src/lib/types.ts`, 211 lines)
`Env`, `Tool`, `Folder`, `Incident`, `Cluster`, `SearchRequest/Response/Filters`, `ScoredIncident`, `FilterOptions`, `UploadItem`, `Connection` (`servicenow | box`), `Insights` (clusters, monthly, rootCauses, subsystems, heatmap, agents), `ChatMsg`, `ChatContext`, `RcaStatus`, `SnowIncident`, `SnowIncidentDetail`, `WorkNote`, `RcaReport` (template fields, `aiFilled`, `images`, `documentHtml`), `PublishResult`, `ReleaseTicket`, `ReleaseEnv`.
Other lib files: `mock.ts` (387 lines), `mock-data.ts` (600), `queries.ts` (TanStack Query hooks), `agent-store.ts`, `rca-docx.ts`, `rca-html.ts`, `use-rca-doc.ts`, `utils.ts`.

## Foundation setup outputs
See `docs/context/progress.md`.
