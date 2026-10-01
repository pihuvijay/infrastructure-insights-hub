GEV System Delivery
A web app for a service delivery team that looks after critical infrastructure. It replaces a wall of browser bookmarks with one place to work from, tracks which snapshot is on each environment, and uses AI agents to turn ServiceNow incidents into root cause analyses (RCAs) and to spot patterns across them.
Status: the front end is built and runs on sample data. The FastAPI backend, the agents, and the real ServiceNow and Box connections are not built yet. Everything described below as "the app does X" works in the UI today; where a real backend is needed it is called out.
1. The two problems it solves
Problem 1: fragmentation
The team uses about 30 different tools (leave, HR, ServiceNow, Jira, Slack, Box, Datadog, Splunk and so on). Today they live as 30 bookmarks at the top of Chrome.
There is no way to onboard a new starter, other than sharing a bookmarks HTML file.
Box is used like a SharePoint to store files and details.
Simple facts have nowhere to live. For example, "on what date was this environment last restored from a snapshot?" is tracked nowhere, and the line manager wants to be told when a snapshot is applied.
Problem 2: RCAs are missing and patterns go unseen
Incidents are logged as tickets in ServiceNow (SNOW). When resolved, the engineer adds comments and the time taken.
Not every SNOW incident has an RCA, but they should. Historical incidents (several years, a large spreadsheet with comments) have had nothing done with them.
Some RCAs exist as Word documents in a folder in Box. They all follow the same template.
Different people resolve different tickets, so tickets with the same root cause are never recognised as the same issue. There is no sense of patterns, and no estimate of how many hours repeated problems cost.
The existing tooling is decentralised and does not automatically pull from Box or ServiceNow.
2. What the product is
A side-navigation web app in two halves:


Half
What it gives the team
Operations (homepage, environments, tools)
One launcher instead of 30 bookmarks, an environment snapshot tracker, and a personalised homepage.
RCA (insights, create, search)
AI-assisted RCA creation from ServiceNow incidents, AI search over past incidents (who fixed what, how), and insights that flag recurring root causes and estimate hours that could be saved.
Design goals: minimal clicks, no manual form filling (the only form is reviewing and editing an AI-drafted RCA), clean and sleek, few words. Colours are black with the GEV logo teal.
3. Every page, end to end
The sidebar (top-left shows the GEV logo) contains: Homepage, RCA (Insights, Create RCA, Search), Environments, Tools, Data sources, Settings.
Homepage `/`
A personalised dashboard of widgets the user can add or remove (saved in the browser). Available widgets:
Environment snapshots: each environment with its snapshot, who applied it, how long ago, and a one-click Notify manager button. Built for the line manager's need to be told when a snapshot is applied.
Incident patterns: the top recurring root-cause clusters and the hours that could be saved. Clicking one opens the agent.
Tool shortcuts: the user's most-used links.
Incident trend: incidents per month chart.
Ask the agent: quick questions to the Advisor agent.
Environments `/environments`
A table of every environment (PD1, PD2, MPR1, MPR2) showing the snapshot last applied, who applied it, when, and whether it is up to date or stale. If a newer snapshot has been detected, it appears under the current one with a one-click Log latest button (no typing a snapshot name). Notify manager tells the line manager.
Tools `/tools`
All team tools grouped into folders (Admin, Training, Working, Location, Tools) such as annual leave, ServiceNow sign-up, Jira, Slack, Box, Datadog, Splunk. Search across all folders. Export bookmarks downloads every folder as a Chrome-importable bookmarks file, which is the onboarding pack for new starters.
RCA > Insights `/rca/insights`
The "where is time being lost" page.
Summary figures: incidents, hours spent resolving, average resolution time, hours that could be saved.
A strip showing the five agents in the pipeline (Ingest, Embed, Cluster, Impact, Advisor).
High-priority clusters: groups of incidents with the same root cause, with incident count, hours spent and hours savable. Filter by severity, sort, click to talk to the agent.
Charts: incidents per month with average hours, hours spent vs savable per cluster, root cause donut, subsystems by severity, cluster trend over time, and a resolution-time heatmap.
Every chart is interactive: hover for the value; click a bar, slice, point or cell to get a card with Ask agent. That opens the agent sidebar already tagged with that item and its numbers, and answers straight away.
RCA > Create RCA `/rca/create`
The core RCA workflow.
Lists ServiceNow incidents in date order (newest or oldest first): number, description, priority, opened, resolved, time taken, assignee, and RCA status (Needs RCA, Draft, In Box). The history comes from the ServiceNow connection.
Filters that combine: status, priority, assignee, time taken, opened date (presets or a from/to range), plus search. Each filter takes several values.
Every row has three clearly labelled buttons:
Edit RCA info: opens the RCA form in the right half of the same page (list stays on the left). It is pre-filled from ServiceNow (problem statement, impact, timeline, service restoration, root cause code, investigation). The user completes what ServiceNow cannot know: 5 Whys, root cause details, mitigation, next steps, corrective actions, and screenshots (image upload). A "to do" counter shows what is left. Save, or Upload to Box.
View Word: read-only view of the RCA as a Word-style document (new tab).
Edit Word: the same document in an editor (styles, bold, lists, tables, images), with Save, Download `.docx` and Upload to Box (new tab).
A full-page version of the form exists at `/rca/create/[number]`.
The RCA follows the team template exactly (see section 5), is exported as a Word `.docx`, and is uploaded to the Box RCA folder. After upload the incident shows In Box.
Open in Word Online (in the Word view) is wired for the real Box connection and is disabled until the report is uploaded; in the demo it explains it needs the live backend.
RCA > Search `/rca`
Directed AI search over past incidents, not a single search box.
Pick what you want: Find similar incidents, Who resolved them, Root causes, or Suggest a fix.
Type a symptom, optionally attach logs or tickets.
Narrow with filters: date range (30 days, 90 days, past year, all time), project, source (ServiceNow, Box, uploads), status, resolved by.
The Advisor answers, names the likely pattern, and a list of related past incidents appears beside it showing root cause, resolution, who resolved it, project, date, hours, and a match score. A follow-up chat lets you keep asking.
Data sources `/rca/upload`
How incident data gets into the system, with no forms.
Upload: drop files (exports, post-mortems, logs); each shows processing, indexed or failed.
Connect: one-click connect to ServiceNow and Box. The connection discovers its own scope, shows the account, last sync and record count, and offers Sync now and Disconnect. Once real, this is what keeps RCA data up to date automatically.
Settings `/admin`
Line manager (chosen from a list) and notification toggles (auto-notify on snapshot, weekly insights digest).
Agent sidebar (appears on any page)
The Advisor agent opens on the right like a sidebar. It can be tagged with a cluster or a chart item, shows that context at the top, suggests relevant questions, streams its answer, and can be stopped.
4. How it is meant to work end to end
```
ServiceNow incidents + comments + time taken ─┐
Box folder of existing RCA Word documents ───┼─> Ingest -> Embed -> Cluster -> Impact -> Advisor
Uploaded files (spreadsheet, logs) ──────────┘ |
v
Insights (patterns, hours saved) Search (similar incidents, who fixed them) Create RCA (draft from SNOW,
user completes, Word, Box)
```
The five agents (built later with LangGraph, retrieval with RAG):
Ingest pulls ServiceNow tickets and Box documents.
Embed chunks and vectorises them.
Cluster groups incidents by root cause.
Impact estimates hours spent and hours that a permanent fix would save.
Advisor answers questions and drafts RCAs.
The RCA story in one sentence: an incident is resolved in ServiceNow, it shows up in Create RCA as "Needs RCA", the agent pre-fills the RCA from the ticket, the engineer adds what only they know, reviews the Word document, and uploads it to Box, which in turn feeds Insights and Search.
5. The RCA template
Exactly as the team uses it. Sections are never renamed, reordered or added to.
Root Cause Analysis (RCA) Report: Problem Number, Problem Statement (title)
Problem Statement: Problem Statement, Business Impact
Investigation: Timeline, Investigation, Service Restoration, Next Steps
Root Cause: Root Cause Code (from ServiceNow), Root Cause Details (5 Whys; a trigger such as capacity is not the root cause)
Mitigation: preventive actions, plan if in progress, workaround, or why there is no solution
Corrective Actions: table of Number, Action, Owner, Due Date, State (6 rows)
6. Tech


Layer
Choice
Front end
Next.js 15 (App Router), React 19, TypeScript, Tailwind v4, shadcn/ui, TanStack Query, Recharts, TipTap (Word-style editor), html-to-docx
Back end (planned)
FastAPI
Agents and retrieval (planned)
LangGraph and RAG
Integrations (planned)
ServiceNow, Box
All network calls go through one file, `src/lib/api.ts`. A switch decides whether it uses the built-in sample data or the real FastAPI backend, so the UI does not change when the backend arrives. The full list of endpoints the backend must provide is in `docs/PRD.md`.
7. Run it
```sh
npm i
cp .env.example .env.local # NEXT_PUBLIC_API_MODE=mock | live
npm run dev # http://localhost:3000
```


Command
Purpose
`npm run dev`
Start the app
`npm run lint`
Lint
`npm run typecheck`
Type-check
`npm run build`
Production build
Mock mode (default) uses sample data: four environments (PD1, PD2, MPR1, MPR2), about 20 incidents, three clusters. Your reports, uploads and connections are stored in the browser so the Word view tab sees the same data. Set `NEXT_PUBLIC_API_MODE=live` and `API_URL` to use FastAPI once it exists.
8. What is real and what is not yet


Works now (in the UI)
Needs the backend
All pages, filters, charts, chart-to-agent flow
Real ServiceNow and Box connections
Create RCA list, form side panel, image upload
Real AI drafts (currently rule-based from the ticket text)
Word view and editor, `.docx` download
Real agent answers (currently scripted)
Environment actions, tools export
Saving to a database, real Box upload, Word Online
Other known gaps: no sign-in yet, the bookmarks and homepage widgets are stored per browser, and it is desktop-first.
9. Where things are
`docs/PRD.md`: the specification and API contract (source of truth).
`CLAUDE.md` and `AGENTS.md`: rules for people and AI assistants working in the repo (stack, style, no guessing).
`docs/checklists/`: per-feature checklists.
`.devin/skills`, `.devin/agents`: build, test, and review helpers.
`src/app`: pages. `src/components/views`: each page's screen. `src/lib`: API layer, sample data, types.
10. Questions you may be asked
Why not just use ServiceNow? It has the tickets but no pattern detection, no RCA drafting, and nothing for tools, onboarding or environment tracking.
Does it replace Box? No. Box stays the store of record for RCA documents; the app writes to it and reads from it.
Who writes the RCA? The agent drafts the parts ServiceNow can answer; the engineer completes the parts only they know and approves before anything is uploaded.
How are patterns found? Incidents are embedded and clustered by root cause, then the Impact agent estimates hours spent and hours a permanent fix would save.
What about security of ticket data? Nothing real is connected yet; credentials will live on the FastAPI backend, never in the browser