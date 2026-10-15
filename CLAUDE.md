# CLAUDE.md — read before every change

Project: GEV System Delivery web app. Full spec: `docs/PRD.md`. Follow it; do not invent features, fields, endpoints or copy.

## Stack — do not change
Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind v4 · shadcn/ui · TanStack Query · Recharts · Geist fonts. Backend will be **FastAPI** (LangGraph Advisor agent, background jobs, RAG); it does not exist yet, so the UI uses mock data.
Never add: TanStack Start/Router, Vite, Lovable, Supabase, another UI/CSS/chart/state library. Ask first if you think one is needed.

## Commands
`npm run dev` · `npm run lint` · `npm run typecheck` · `npm run build` · `npm run format`. Run lint + typecheck + build before saying "done".

## Where things go
- `src/app/(app)/<route>/page.tsx` — thin server page: `metadata` + one view. Keep it that way.
- `src/components/views/*View.tsx` — client views (`"use client"`).
- `src/components/` shared (`PageHeader`, `AppSidebar`, `AgentPanel`, `rca/*`); `src/components/ui/` shadcn only.
- `src/lib/types.ts` — API contract types. `src/lib/api.ts` — the ONLY place that calls the network; switches mock/live via `NEXT_PUBLIC_API_MODE`. `src/lib/mock.ts` + `mock-data.ts` — fake backend. `src/lib/queries.ts` — TanStack Query hooks. `src/lib/rca-docx.ts` + `rca-html.ts` — RCA Word export (html-to-docx); `use-rca-doc.ts` — shared RCA form state (side panel, full page, Word view).
- New endpoint = add type → add to `api.ts` (live + mock) → add to PRD §7. No `fetch` in components.

## Style rules (do not drift)
- Black UI with GEV teal (`--brand` #005f61 for filled buttons, `--primary` for accents); logo `src/components/images/gev-mark.png` top-left. Fewer words: no sub-headings or helper paragraphs unless needed. Geist / Geist Mono. Use CSS tokens from `src/app/globals.css` and the helper classes `.panel .eyebrow .btn-primary .btn-ghost .btn-done .input .icon-tile`. No hard-coded hex/oklch in components (only the `--paper*` tokens for the RCA document).
- Match existing patterns: `PageHeader` at the top of every page, `eyebrow` labels, rounded-xl panels, lucide icons, `cn()` for classes, sonner toasts for confirmations.
- Charts: Recharts, colours `var(--chart-1..5)`, always axes/units/legend/tooltip, value labels where useful.
- Minimal clicks; **no manual forms** except editing the AI-drafted RCA. Prefer selects, one-click actions, detected values.
- Every view: loading, empty and error states; aria labels on icon buttons.
- Compact code; don't add comments unless asked; no `any`; no leftover `console.log`.

## Anti-hallucination rules
- Facts about the product come from `docs/PRD.md`. The RCA template (PRD §6) is exact — never rename/reorder/add sections.
- Don't fabricate API behaviour, package APIs or Next.js features: read the code or docs (node_modules/next/dist/docs, official docs) first.
- Mock data is clearly mock (`mock-data.ts`). Never present it as real in copy.
- If a requirement is missing or ambiguous, ask the user. Don't silently drop requirements; mark them blocked in the checklist.

## Workflow
Use `.devin/skills/build-feature` for any feature (checklist in `docs/checklists/`, tick only what you've seen working) and `.devin/skills/test-before-pr` before finishing. Reviewer/tester agents are in `.devin/agents/`.

## Architecture rules (added 2026-10-08 by foundation setup)

- Before changing design, read `docs/architecture/` and `docs/adr/`. If something is not documented, ask; do not guess.
- Every claim about the codebase must cite a file. If you cannot point to one, do not state it.
- Never commit to `main`. Every change is a branch and a pull request.
- Every database change goes through Alembic. Every pull request needs tests, passing CI, and updated docs.
- Protected files: `docs/PRD.md` is read-only. `CLAUDE.md`, `AGENTS.md` and `README.md` are append-only: add new sections at the end under a dated heading; never edit, reorder or remove existing lines. After changing any of them, `git diff --numstat` must show 0 deletions.
- Use the skills in `.claude/skills/` for these tasks: `architecture-check`, `update-docs`, `write-adr`, `new-endpoint`, `db-migration`, `new-agent`, `new-background-job`, `new-streaming-endpoint`, `add-cache`, `connect-frontend-endpoint`, `new-integration`, `run-evals`, `write-tests`, `deploy-staging`, `security-check`, `ci-cd-change`, `add-rate-limit`, `harden-integration`, `add-observability`, `rag-add-source`, `change-model`. Reviewers: `.claude/agents/code-reviewer.md` and `security-reviewer.md` (the `.devin/` skills and agents above still apply).
- Backend is a modular monolith: routes only in `api/v1`, logic in `services`. See docs/adr/0001-modular-monolith.md.
- On-premises VMs; ticket data stays on the company network. See docs/adr/0002-on-premises-vms.md.
- Backend is FastAPI with Pydantic. See docs/adr/0003-fastapi.md.
- Streaming uses SSE, not WebSockets. See docs/adr/0004-sse-over-websockets.md.
- Vectors live in PostgreSQL with pgvector, not Pinecone or FAISS. See docs/adr/0005-postgres-pgvector.md.
- Redis holds queue, cache and agent state; durable data never lives only in Redis. See docs/adr/0006-redis.md.
- The Advisor is the only agent: a LangGraph graph with a recursion limit and per-node timeouts. Ingest, Embed, Cluster and Impact are background worker jobs. See docs/adr/0007-langgraph.md and docs/adr/0032-one-agent-and-background-jobs.md.
- vLLM serves models on the GPU server. See docs/adr/0008-vllm.md.
- Knowledge comes from RAG, not fine-tuning. See docs/adr/0009-rag-over-fine-tuning.md.
- Slow and external work runs in the background worker; pages read from Postgres, never live from ServiceNow or Box. See docs/adr/0010-background-worker.md.
- Nginx handles HTTPS, routing and ingress rate limiting; no separate gateway. See docs/adr/0011-nginx.md.
- No RCA reaches Box without explicit human approval. See docs/adr/0012-human-review.md.
- Authentication method is still proposed (TODO with IT). See docs/adr/0013-authentication.md.
- The Next.js frontend stays, with the mock/live switch in `src/lib/api.ts`. See docs/adr/0014-nextjs-frontend-mock-live.md.
- Box stays the system of record for RCA documents. See docs/adr/0015-box-system-of-record.md.
- Local, staging and production environments; everything runs as Docker images. See docs/adr/0016-environments-docker.md.
- Follow the testing pyramid and CI gates. See docs/adr/0017-testing-ci.md.
- ADRs record why, architecture docs record how, skills record procedures. See docs/adr/0018-docs-skills-agents.md.
- Every external call needs a timeout, egress rate limiting and a circuit breaker. See docs/adr/0019-rate-limiting.md and docs/adr/0020-resilience.md.
- Keep backend instances stateless; no files or sessions on the app VM. See docs/adr/0021-stateless-backend.md.
- Use the same embedding model everywhere; changing it needs an ADR and full re-embedding. See docs/adr/0022-model-routing.md.
- Ollama for local development, vLLM for staging and production; evals must pass on staging. See docs/adr/0023-ollama-local-vllm-server.md.
- CI must pass before merge. Production deploys promote the same image that passed staging. See docs/adr/0024-cicd-github-actions.md.
- Structured logs with request IDs, OpenTelemetry, self-hosted agent tracing. See docs/adr/0025-observability.md.
- The Advisor runs in the API and streams over SSE; the four batch jobs run in the worker. See docs/adr/0026-interactive-vs-batch-agents.md and docs/adr/0032-one-agent-and-background-jobs.md.
