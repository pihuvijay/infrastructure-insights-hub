# ADR 0022: Model routing by task, with a fixed embedding model
Status: Accepted
Date: 2026-10-08
Related docs: [models](../architecture/models.md), [rag](../architecture/rag.md), [llm-serving](../architecture/llm-serving.md), [agents](../architecture/agents/README.md)

## Context
Different tasks need different models. Using one large model for everything wastes GPU capacity and time, and sending everything to hosted APIs would send ticket data outside the network (not allowed unless security approves, TODO).

## Decision

| Task | Needs | Model approach |
|---|---|---|
| Embeddings | Consistency, not intelligence | Local embedding model. Candidate: `nomic-embed-text` (TODO: choose after evals) |
| Simple tasks: categorise, summarise, name clusters | Moderate quality | A smaller local model may be enough |
| Reasoning: planner deciding the workflow, RCA drafting, 5 Whys suggestions, Advisor answers | Highest reasoning quality | The strongest model available. A hosted "premium" API was suggested for the planner; allowed only if security approves sending ticket data externally (TODO). Otherwise the largest model the GPU can serve |

Embedding rules: the **same embedding model must be used for ingestion and for queries, in every environment**. Vectors from different models cannot be compared. Changing the embedding model means re-embedding all data. Store the model name and version with every vector. Every routing choice is validated with evals per task.

## Alternatives considered
**One large model for everything.** Strengths: simplest to configure. Why it lost: wasteful and slower; embeddings and naming do not need the strongest model.

**Hosted APIs for all tasks.** Strengths: strongest models, no GPU management. Why it lost: data leaves the network.

## Consequences
Positive: matched cost, speed and quality per task; embeddings are consistent.
Negative: several models to serve and evaluate; embedding changes require full re-embedding.
Obligations: skill `change-model`; an ADR before changing any model; `code-reviewer` flags embedding changes without an ADR.

## When to revisit
Eval results, GPU capacity, or a security decision on hosted APIs.
