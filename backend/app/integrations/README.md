# backend/app/integrations/

**Belongs here:** ServiceNow and Box clients. Every call has a timeout, goes through the shared egress limiter and a circuit breaker.

**Does not belong here:** Business logic that decides what to do with the data.

**Governed by:** docs/architecture/integrations.md, ADR 0019, ADR 0020, skills new-integration and harden-integration

Status: placeholder created by foundation setup (2026-10-08). No application code exists here yet.
