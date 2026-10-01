# CLAUDE.md — read before every change

Project: GEV System Delivery web app. Full spec: `docs/PRD.md`. Follow it; do not invent features, fields, endpoints or copy.

## Stack — do not change
Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind v4 · shadcn/ui · TanStack Query · Recharts · Geist fonts. Backend will be **FastAPI** (LangGraph agents, RAG); it does not exist yet, so the UI uses mock data.
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
