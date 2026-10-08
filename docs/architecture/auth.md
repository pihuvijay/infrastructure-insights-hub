# Authentication

**Purpose:** current state and requirements for sign-in.

**Related ADRs:** [0013 authentication method (Proposed)](../adr/0013-authentication.md), [0011 Nginx](../adr/0011-nginx.md), [0012 human review](../adr/0012-human-review.md)

Last updated: 2026-10-08

## Current state

There is no sign-in (README "Known gaps", PRD section 8 "Out of scope"). Bookmarks and homepage widgets are stored per browser in `localStorage` (`src/components/views/HomeView.tsx`, `src/components/AppSidebar.tsx`).

## Requirements

- Company sign-in must exist **before real data is on a server** (build plan 5.6).
- Every API route requires sign-in except `/health`.
- Per-user storage replaces per-browser storage for homepage widgets and bookmarks (new per-user tables, TODO).
- Approvals record who approved an RCA and when ([ADR 0012](../adr/0012-human-review.md)), so the user identity must be reliable.
- Credentials for ServiceNow and Box stay on the backend.

## Method

Likely company SSO, for example Microsoft Entra ID (build plan 0.1 says "probably"). TODO: confirm with IT, including an app registration. Authentication happens in FastAPI middleware; Nginx handles TLS and rate limiting ([ADR 0011](../adr/0011-nginx.md)). The "API Gateway" box in an early diagram is fulfilled by Nginx plus this middleware ([corrections](../context/corrections.md) item 6).

## Statelessness

Sessions or tokens must not be held in the memory of one backend process; they live in Redis or Postgres, or in signed tokens ([scaling.md](scaling.md)).

## Open questions

Auth method (IT). Whether the line manager and roles need different permissions (TODO: confirm with manager). Whether the Settings "line manager" is a user in the same table.
