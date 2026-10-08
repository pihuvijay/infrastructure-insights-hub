# Requirements

**Purpose:** the non-functional targets (with the reason for each) and the functional requirements per page. Reasoning for how we meet them is in the ADRs.

**Related ADRs:** [0001 modular monolith](adr/0001-modular-monolith.md), [0002 on-premises VMs](adr/0002-on-premises-vms.md), [0004 SSE](adr/0004-sse-over-websockets.md), [0010 background worker](adr/0010-background-worker.md), [0012 human review](adr/0012-human-review.md), [0016 environments and Docker](adr/0016-environments-docker.md), [0021 stateless backend](adr/0021-stateless-backend.md)

Last updated: 2026-10-08

## Non-functional requirements

| Requirement | Target | Why |
|---|---|---|
| Users | 200-1,000 internal | Focused internal team tool, not public traffic. Drives the choice to avoid distributed architecture. |
| Load shape | Heavily read-heavy | Engineers mostly view dashboards and search past incidents. Writes are rare but complex (AI reasoning, multi-step document generation). |
| Consistency | Eventual; 30-60 s delay from ServiceNow/Box is acceptable | Operational workflow does not need instant sync. Allows background sync instead of live calls on each page load. |
| Latency | Dashboard responses under 500 ms | The app must feel like a launchpad, and must not degrade during active incidents, which is when it is most needed. Applies to non-AI reads. |
| Durability | High; at-least-once delivery for RCA uploads to Box | RCAs are critical historical records and must never be lost in transit. |
| AI quality | Accuracy (precision) over speed | Wrong RCAs are worse than slow RCAs. Every AI-drafted RCA requires human review (human-in-the-loop). |
| Architecture style | Modular monolith, not "NASA-grade" distributed | Higher velocity, lower maintenance; engineering effort goes into agent intelligence rather than infrastructure scaling. |
| Deadline | Deployed and hosted by January 2027 | Drives build order: deploy a thin slice early, defer the hardest infrastructure (GPU) until the basics work. |

Corrections that affect these targets: the 500 ms target does not depend on the LLM at all (see [corrections](context/corrections.md) item 3). The 30-60 s consistency target applies to synced data, not to AI answers.

## Functional requirements per page

The product specification is `docs/PRD.md` (read-only). The summary below follows the product description in `docs/context/project-context.md` (C1). Where they differ, the PRD is the contract for the UI and the difference is in [corrections](context/corrections.md).

| Page | Route | Requirements |
|---|---|---|
| Homepage | `/` | Configurable widgets (environment snapshots, incident patterns, tool shortcuts, incident trend, ask-the-agent). Currently stored in the browser; must become per-user once sign-in exists. |
| Environments | `/environments` | Show applied snapshot, who applied it, when, status (synced/stale) for PD1, PD2, MPR1, MPR2. One-click **Log latest** when a newer snapshot is detected. **Notify manager** in one click. The line manager must be told when a snapshot is applied. |
| Tools | `/tools` | Tools in folders (Admin, Training, Working, Location, Tools), search across folders, export all folders as a Chrome-importable bookmarks file (onboarding pack). |
| RCA Insights | `/rca/insights` | Summary figures, agent pipeline strip, clusters, interactive charts. Clicking a chart item opens the agent sidebar tagged with that item. |
| Create RCA | `/rca/create`, `/rca/create/[number]` | List of ServiceNow incidents (newest/oldest), combinable multi-value filters, RCA status (Needs RCA / Draft / In Box). Edit RCA info side panel pre-filled from SNOW. View Word, Edit Word (TipTap), download `.docx`, upload to Box. The agent drafts what SNOW can answer; the engineer completes and approves. |
| RCA Search | `/rca` | Directed AI search: Find similar incidents, Who resolved them, Root causes, Suggest a fix. Filters: date range, project, source, status, resolved by. Advisor answer, likely pattern, follow-up chat, related incidents list with match score. |
| Data sources | `/rca/upload` | Upload files (per-file status processing/indexed/failed). One-click connect for ServiceNow and Box with discovered scope, sync now, disconnect. |
| Settings | `/admin` | Line manager (from a list), notification toggles. |
| Build Release Progress | `/build-release`, `/build-release/[env]` | Progress trackers for PD1, PD2, MPR1 (tickets done / total) and a ticket list per environment. In the PRD (section 5.10); not in the foundation prompt. Live data source is TODO: confirm with manager. |
| Agent sidebar | every page | Tagged context, suggested questions, streamed answers, stop button. |

### RCA template (exact)
Sections are never renamed, reordered or added to. The exact list is in `docs/PRD.md` section 6 and is enforced in the backend by a Pydantic model ([ADR 0009](adr/0009-rag-over-fine-tuning.md)).

### Cross-cutting
- Every data view has loading, empty and error states (PRD section 4).
- No manual form filling except reviewing the AI-drafted RCA (PRD section 4).
- Credentials live on the backend, never in the browser.
- Box stays the store of record for RCA documents ([ADR 0015](adr/0015-box-system-of-record.md)).
- Dashboards keep working when ServiceNow, Box or the GPU server is down ([ADR 0020](adr/0020-resilience.md)).
