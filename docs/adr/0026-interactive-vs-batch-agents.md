# ADR 0026: Interactive agents in the API, batch agents in the worker
Status: Accepted
Date: 2026-10-08
Related docs: [agents](../architecture/agents/README.md), [background-jobs](../architecture/background-jobs.md), [streaming](../architecture/streaming.md), [flows](../architecture/flows.md)

## Context
Some agent work needs the user to see tokens as they are produced; other work is long, batch and not user-attended. The strategy notes proposed sending every RCA flow to a queue.

## Decision
- **Interactive work runs in the API process and streams over SSE:** Advisor answers in the sidebar and Search, and a single RCA draft when the user clicks.
- **Long or batch work runs in the background worker from the queue:** Ingest, Embed, Cluster, Impact, and bulk drafting for historical incidents.
- If interactive drafting proves too slow, it moves to the worker with progress streamed. TODO: decide after measuring (build plan 6.4).

## Alternatives considered
**All agent work in the worker.** Strengths: robust to API restarts; one path. Why it lost: no live streaming for users.

**All agent work in the API.** Strengths: one path, simple. Why it lost: long jobs tie up request handling and die if the API restarts.

## Consequences
Positive: users see answers stream; long jobs survive restarts and can retry.
Negative: two execution paths to test; shared agent code must work in both contexts.
Obligations: both paths use the same graphs with recursion limits and node timeouts; interactive runs cancel on client disconnect.

## When to revisit
After measuring RCA drafting time.
