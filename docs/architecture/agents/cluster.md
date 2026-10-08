# Cluster agent

**Purpose:** Group incidents by root cause so recurring problems become visible.

**Related ADRs:** [0007 LangGraph](../../adr/0007-langgraph.md), [0022 model routing](../../adr/0022-model-routing.md), [0026 interactive vs batch](../../adr/0026-interactive-vs-batch-agents.md), [0009 RAG](../../adr/0009-rag-over-fine-tuning.md)

Last updated: 2026-10-08. Part of the [agents overview](README.md). Not built yet.

## Inputs (Pydantic shape, described)
Embeddings and metadata of incidents (root cause code, severity, project, dates).

## Outputs
Cluster rows (id, name, severity, summary, suggested fix, counts, trend) matching the `Cluster` type in `src/lib/types.ts`, and a cluster id on each incident.

## Uses the LLM?
Only to name and summarise clusters. Grouping itself is a clustering algorithm over vectors (algorithm TODO). Keeping the LLM out of grouping makes results repeatable and cheaper.

## Model
A small or mid-size local model may be enough for naming (TODO: confirm with evals).

## Prompt location
TODO: `backend/app/agents/prompts/` is a suggestion; not decided.

## State read and written
Reads: embeddings, incidents. Writes: clusters, incident.cluster_id.

## Failure handling and retries
Runs in the worker (batch). Safe to re-run: results are replaced for the run, not appended. If the LLM is down, clusters are kept with the previous or a placeholder name and naming is retried.

## How it is tested
Unit tests for the grouping with fixed vectors. Evals: a few questions about known recurring issues that must land in the same cluster. Spot-check by reading the incidents inside clusters (build plan 6.5).

## Open questions
Clustering algorithm and parameters (TODO). How often to re-cluster (TODO).
