# Impact agent

**Purpose:** Estimate hours spent per cluster and the hours a permanent fix would save.

**Related ADRs:** [0007 LangGraph](../../adr/0007-langgraph.md), [0022 model routing](../../adr/0022-model-routing.md), [0026 interactive vs batch](../../adr/0026-interactive-vs-batch-agents.md)

Last updated: 2026-10-08. Part of the [agents overview](README.md). Not built yet.

## Inputs (Pydantic shape, described)
Clusters and the recorded hours on their incidents (`hoursToResolve`).

## Outputs
Per cluster `hoursSpent` and `hoursSavable`, and the monthly and heatmap numbers shown on Insights.

## Uses the LLM?
No. It is mainly arithmetic over recorded hours. How 'hours savable' is defined (for example assuming a permanent fix removes future recurrences) is TODO: confirm the formula with the team before building.

## Model
None.

## Prompt location
Not applicable.

## State read and written
Reads: clusters, incidents. Writes: cluster impact numbers, aggregates.

## Failure handling and retries
Runs in the worker. Pure and repeatable: re-running gives the same numbers. Missing hours on an incident are excluded and counted, not guessed.

## How it is tested
Unit tests with hand-calculated examples. Build plan 6.5: check one cluster's hours by hand.

## Open questions
Definition of hours savable (TODO). How to treat incidents with no recorded time (TODO).
