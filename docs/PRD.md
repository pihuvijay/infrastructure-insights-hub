# PRD — GEV System Delivery Web App

Single source of truth. If something is not written here or in `CLAUDE.md`, do not invent it: ask.

## 1. Problem

A service-delivery team for critical infrastructure has two problems:

1. **Fragmentation** — ~30 browser bookmarks across tools; no way to onboard new starters; facts like "when was this environment last snapshotted" live nowhere.
2. **RCA gaps** — ServiceNow (SNOW) incidents are resolved by different people so recurring root causes are not noticed. Not every incident has an RCA, but they should. RCA documents live as Word files in a Box folder.

## 2. Users

Service delivery engineers, their line manager (wants to be told when a snapshot is applied), new starters (onboarding).

## 3. Stack (fixed)

- Frontend: **Next.js 15 App Router**, React 19, TypeScript strict, Tailwind v4, shadcn/ui (`src/components/ui`), TanStack Query, Recharts, lucide-react, sonner.
- Backend: **FastAPI** (not built yet). Agents: **LangGraph** (Ingest → Embed → Cluster → Impact → Advisor). Retrieval: **RAG**.
- Until the backend exists the UI runs on mock data (`NEXT_PUBLIC_API_MODE=mock`). Switching to `live` must need no UI changes — only `src/lib/api.ts` talks to the network.
- Not allowed: TanStack Start/Router, Vite, Lovable APIs, Supabase.

## 4. Design rules

- Black and GEV teal, minimal, clean, few words (no explanatory sub-headings). Brand colour `--brand` (#005f61, from `src/components/images/gev.png`) for filled buttons; lighter teal `--primary` for accents on black. Logo (`gev-mark.png`) top-left of the sidebar. Fonts: Geist / Geist Mono (`next/font`). Tokens live in `src/app/globals.css` (`--background`, `--primary`, `--chart-1..5`, `--paper*`). Use tokens and the `.panel`, `.eyebrow`, `.btn-primary`, `.btn-ghost`, `.btn-done`, `.input`, `.icon-tile` classes. No hard-coded colours except the RCA "paper".
- HCI: minimal clicks. **No manual form filling anywhere** except reviewing/editing the AI-drafted RCA. Prefer one-click actions, detected values, selects over free text.
- Every data view has loading, empty and error states. Controls are labelled (aria) and keyboard-reachable.

## 5. Screens

### 5.1 Homepage `/`

Personalised widgets (add / remove, persisted in localStorage): environment snapshots (notify manager in one click), incident patterns, tool shortcuts, incident trend chart, ask-the-agent shortcuts.

### 5.2 Environment Tracker `/environments`

Table per environment: applied snapshot, applied by, when, status (synced/stale), notify-manager button. If a newer snapshot is detected, show it and a one-click **Log latest**. No form.

### 5.3 Tools & Onboarding `/tools`

Tools grouped in folders (Admin, Training, Working, Location, Tools), search across folders, one-click export of all folders as a Chrome-importable bookmarks file.

### 5.4 RCA Search `/rca`

Directed search, not a single box.

- Task chips: Find similar incidents · Who resolved them · Root causes · Suggest a fix.
- Query box with **Attach logs or tickets** (files).
- Filters: date range (30 days, 90 days, Past year, All time), project, source (ServiceNow/Box/Uploads), status, resolved by. Reset filters.
- Result: Advisor answer + likely pattern + follow-up chat, and a **related incidents list** that appears beside it (id, status, root cause, resolution, resolved by, project, date, hours, match %).
- With no query: incidents matching the filters.

### 5.5 Create RCA `/rca/create` (replaces "Upload RCA")

- Lists **ServiceNow incidents in chronological order** (toggle newest/oldest): number, description, priority, opened, resolved, time taken, assignee, **RCA status** (Needs RCA / Draft / In Box).
- **Multi-filters, combinable**: Status, Priority, Assignee, Time taken (under 2h, 2-4h, 4-8h, 8h+), Opened (last 30/90 days, last year, or from/to dates), plus search by number/description. Each filter accepts several values. Clear all.
- Every incident row has three labelled buttons: **Edit RCA info** (opens the form in a half-page panel on the same page, list on the left half, Esc closes), **View Word** (read-only document, new tab) and **Edit Word** (editable document, new tab). Clicking the row also opens Edit RCA info.
- Source of the list is the ServiceNow connection only (historical years included).

### 5.6 RCA form (side panel, full page, Word view)

- **Side panel**: pre-filled from ServiceNow (problem statement, business impact, timeline, service restoration, root cause code, investigation). The user completes what ServiceNow cannot supply: 5 Whys, root cause details, mitigation, next steps, corrective actions, **screenshots (image upload)**. A "to do" counter shows what is left. Actions: Save, View Word, Edit Word, Upload to Box.
- **Full page** `/rca/create/[number]`: Word-style paper with the exact template (section 6), Edit/Preview, ServiceNow record side panel, Save, Word view, `.docx`, Review -> Upload to Box.
- **Word view** `/document/[number]` (opens in a new tab; `?mode=view` is read-only; auto-drafts if no RCA exists yet): document editor (styles, bold/italic/underline, lists, tables, images), Save, Download `.docx`, Upload to Box, **Open in Word Online** (via Box; needs the live backend, disabled until uploaded). Edits made here take over the exported version; the form shows a banner with "Use form" to revert.
- Export is always `.docx`. After upload the incident shows **In Box**.

### 5.7 RCA Insights `/rca/insights`

KPIs (incidents, hours spent, average resolution, hours savable), agent pipeline strip, high-priority clusters (sort/filter, click tags the agent), and proper charts with axes, units, legends and value labels: incidents per month + average hours; hours spent vs savable per cluster; root-cause donut; subsystem × severity stacked bars; cluster trend lines; resolution heatmap.

Every chart is interactive: hover shows the value, clicking a bar, slice, trend point or heatmap cell opens a small card with **Ask agent**. That opens the agent sidebar tagged with that item (label and numbers) and an opening answer. Clicking a cluster bar also tags the cluster.

### 5.8 Data sources `/rca/upload`

Two tabs: **Upload** (drop zone, per-file status) and **Connect** (ServiceNow, Box: one-click connect, discovered scope, sync now, disconnect). No inputs to fill.

### 5.10 Build Release Progress `/build-release`

Three clickable progress trackers (PD1, PD2, MPR1): tickets done / total. Each opens `/build-release/[env]`, a page of that environment's tickets (id, title, assignee, priority, state). Mock data until the backend exists.

### 5.9 Admin `/admin`

Line manager (pick from list), notification toggles.

### Agent panel

Right-hand Advisor chat, opened from clusters or widgets; streams text; can be tagged to a cluster.

## 6. RCA template (exact — all RCAs use it)

Title **Root Cause Analysis (RCA) Report**

- Problem Number · Problem Statement (title)
- **Problem Statement**: Problem Statement; Business Impact
- **Investigation**: Timeline (key events, report → resolution); Investigation (what was reviewed, conclusions); Service Restoration (how service was restored); Next Steps (plan; actions must be raised)
- **Root Cause**: Root Cause Code (from ServiceNow selection); Root Cause Details (why; use 5 Whys; a trigger such as capacity is not the root cause)
- **Mitigation**: preventive actions, plan if in progress, workaround, or why no solution
- **Corrective Actions** (raised in ServiceNow; otherwise listed here): table Number · Action · Owner · Due Date · State (6 rows)

Exported as `.docx` with these headings in this order. Do not rename or reorder sections.

## 7. FastAPI contract (prefix `/api/v1`, JSON camelCase)

| Method          | Path                                      | Purpose                                                                          |
| --------------- | ----------------------------------------- | -------------------------------------------------------------------------------- |
| GET             | /tools/folders                            | tool folders                                                                     |
| GET             | /environments                             | environments                                                                     |
| GET             | /release/environments                     | release environments with tickets (Build Release Progress)                       |
| POST            | /environments/{id}/notify                 | notify manager                                                                   |
| POST            | /environments/{id}/snapshots/apply-latest | log latest detected snapshot                                                     |
| GET             | /rca/filters                              | `{projects, people}`                                                             |
| POST            | /rca/search                               | multipart `payload` (SearchRequest) + `files` → `{answer, incidents[], cluster}` |
| GET             | /rca/insights                             | insights                                                                         |
| GET             | /rca/incidents                            | SNOW incident list (no RCA body)                                                 |
| GET             | /rca/incidents/{number}                   | incident + work notes + resolution comments                                      |
| GET             | /rca/root-cause-codes                     | codes                                                                            |
| GET             | /rca/reports/{number}                     | saved RCA or null                                                                |
| POST            | /rca/reports/{number}/draft               | AI draft                                                                         |
| PUT             | /rca/reports/{number}                     | save draft                                                                       |
| POST            | /rca/reports/{number}/publish             | multipart `report` + `file` (.docx) → upload to Box → `{fileName, boxUrl}`       |
| GET/POST/DELETE | /rca/connections[/{id}/connect\|sync]     | ServiceNow / Box connections                                                     |
| GET/POST        | /rca/uploads                              | file uploads                                                                     |
| POST            | /agent/chat                               | `{messages, clusterId, incidentIds, focus}` → streamed text                      |

Types are in `src/lib/types.ts` and are the contract. Change them together with this table.

## 8. Out of scope (for now)

Auth/SSO, real ServiceNow/Box credentials in the browser, multi-tenant, mobile layout.
