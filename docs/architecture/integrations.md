# Integrations: ServiceNow and Box

**Purpose:** what is pulled from and pushed to ServiceNow and Box, and how the integration clients protect the app and the external services.

**Related ADRs:** [0010 background worker](../adr/0010-background-worker.md), [0015 Box system of record](../adr/0015-box-system-of-record.md), [0019 rate limiting](../adr/0019-rate-limiting.md), [0020 resilience](../adr/0020-resilience.md)

Last updated: 2026-10-08. Only ServiceNow and Box are API integrations; the roughly 30 team tools are links.

## ServiceNow (read)

Pulls incidents with comments, time taken and root cause code, including several years of history. Fields seen in the UI contract: `SnowIncident` / `SnowIncidentDetail` in `src/lib/types.ts` (number, short description, project, priority, opened, resolved, hours, resolved by, work notes, resolution comments, root cause code). Real field names are unknown until build-plan experiment 4.1. TODO: service account, API limits, field names (ServiceNow admins).

## Box (read and write)

- **Read:** existing RCA Word documents from the RCA folder, ingested for search and clustering.
- **Write:** the approved RCA `.docx` is uploaded to the RCA folder ([ADR 0015](../adr/0015-box-system-of-record.md)). Delivery is at-least-once and idempotent ([background-jobs.md](background-jobs.md)).
- Word Online depends on the real Box connection (the PRD says it is disabled until uploaded).
TODO: Box API app, authentication method, limits (Box admins; build-plan experiment 4.2).

## Credentials and location

Credentials live on the backend (settings from the environment, never Git, never the browser). Production secrets location: TODO (IT). Connection status shown on Data sources (`Connection` type).

## Sync frequency

TODO: within the 30-60 s eventual-consistency target. Pages read from Postgres, never live from ServiceNow or Box.

## Historical spreadsheet import

Several years of historical incidents with comments sit in a large spreadsheet. It is imported through the Data sources Upload tab (status processing / indexed / failed) and then ingested like any other source. TODO: obtain a copy (build plan 0.1) and map columns. Uploaded files are not stored on the app VM's disk; location TODO.

## Egress rate limiting

Every call to ServiceNow and Box goes through a limiter set below that service's quota, with the counter shared in Redis when more than one process calls the same service. 429 and `Retry-After` are honoured. An agent loop or retry storm could otherwise get the service account blocked. See [rate-limiting.md](rate-limiting.md) and [ADR 0019](../adr/0019-rate-limiting.md).

## Timeouts and circuit breakers

Every call has a timeout. After repeated failures the circuit opens, calls stop for a cool-down, the UI shows the last synced data with "last synced X ago", then the breaker probes before resuming. See [resilience.md](resilience.md).

## Behaviour when a service is down

| Down | What the user sees |
|---|---|
| ServiceNow | Create RCA list and Insights show last synced data with a "last synced X ago" label. |
| Box | RCAs can still be saved and approved; uploads queue and retry; status shows Uploading / Upload failed. |

## Possible extra integrations (C11.12)

The strategy notes mention Smartsheet, Outlook, WFH rosters and "20+ services". The README scope is ServiceNow and Box only. TODO: confirm scope with the manager. Do not design for the extras until confirmed. The `new-integration` skill makes adding them later straightforward.
