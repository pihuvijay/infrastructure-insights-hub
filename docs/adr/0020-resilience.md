# ADR 0020: Circuit breakers, timeouts and graceful degradation
Status: Accepted
Date: 2026-10-08
Related docs: [resilience](../architecture/resilience.md), [integrations](../architecture/integrations.md), [rate-limiting](../architecture/rate-limiting.md), [observability](../architecture/observability.md)

## Context
ServiceNow, Box and the GPU server can fail. The dashboard must not degrade during incidents, which is when it is most needed ([requirements](../requirements.md)). Pages already read from Postgres, never live from external systems ([ADR 0010](0010-background-worker.md)).

## Decision
- **Timeouts** on every external call.
- **Circuit breakers** on each integration: after repeated failures, stop calling for a cool-down, serve the last synced data with "last synced X ago" in the UI, then probe before resuming (states: closed, open, half-open).
- **Idempotency** on every write and write-back, so retries never create duplicates.
- **Graceful degradation:** the dashboard keeps working when ServiceNow, Box or the GPU server is down. AI features show "AI unavailable"; non-AI pages are unaffected.
- **Fail fast:** clear UI feedback, never an endless spinner.
- **Agent safeguards:** maximum iterations (LangGraph recursion limit), a timeout per node, bounded retries, checkpointing so a failed run resumes, and de-duplication so the same RCA task is never processed twice at once.

## Alternatives considered
**Retries only.** Strengths: simple. Why it lost: retries without breakers create retry storms and long hangs, and can burn external quotas.

**Calling external systems live.** Strengths: freshest data. Why it lost: rejected in [ADR 0010](0010-background-worker.md); slow and fragile.

## Consequences
Positive: partial failures stay partial; the app stays useful during incidents.
Negative: users sometimes see stale data with a clear "last synced" label; more states to test.
Obligations: thresholds and cool-downs are TODO; every failure mode tested with mocked responses (skill `harden-integration`); verified by the failure drills in build plan 7.2.

## When to revisit
Unlikely.
