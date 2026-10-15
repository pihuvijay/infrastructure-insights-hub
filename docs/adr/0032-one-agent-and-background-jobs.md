# ADR 0032: One agent (the Advisor); Ingest, Embed, Cluster and Impact are background jobs
Status: Accepted
Date: 2026-10-15
Supersedes: the "five cooperating agents" framing in [ADR 0007](0007-langgraph.md) and the "batch agents in the worker" wording in [ADR 0026](0026-interactive-vs-batch-agents.md). The decisions to use LangGraph, to stream interactive work over SSE and to run long work in the worker still stand.
Related docs: [agents](../architecture/agents/README.md), [background-jobs](../architecture/background-jobs.md), [flows](../architecture/flows.md), [high-level](../architecture/high-level.md)

## Context
The earlier docs call five pipeline steps "agents": Ingest, Embed, Cluster, Impact and Advisor. The agent docs themselves say four of them do not need an LLM: Ingest fetches and normalises, Embed calls an embedding model, Cluster is a clustering algorithm (the LLM only names groups) and Impact is arithmetic over recorded hours. Only the Advisor reasons with the LLM, answers questions, suggests root causes and drafts RCAs, and only it needs loops, branches and a pause for human approval ([ADR 0012](0012-human-review.md)).

Calling all five "agents" blurs what needs an LLM, what needs LangGraph and what can be an ordinary job, and it makes the Insights page and the docs promise more agent behaviour than exists.

## Decision
- The **Advisor is the only agent.** It runs as a LangGraph graph with typed state, a recursion limit, a timeout per node, bounded retries and an interrupt for human approval. It runs in the API process and streams over SSE; bulk drafting of historical incidents may run it from the worker.
- **Ingest, Embed, Cluster and Impact are background jobs** in the worker, taken from the Redis queue, written as plain Python with idempotent writes, retries with backoff and visible failures ([ADR 0010](0010-background-worker.md)). They are not LangGraph agents. The LLM is used only where needed: Cluster may call it to name clusters.
- Their results are stored in Postgres. The Advisor reads the stored clusters and hours and retrieved incidents; it does not compute or invent those numbers.
- The UI labels the four as jobs and the Advisor as the agent.

## Alternatives considered
**Keep five agents as LangGraph nodes (ADR 0007 as written).** Strengths: one uniform model, one tracing style, easy to swap a node. Why it lost: four nodes gain nothing from loops, branches or interrupts and would pay LangGraph's concepts and state-storage cost for no benefit.

**Make Cluster or Impact LLM agents that decide how to group and cost incidents.** Strengths: flexible. Why it lost: results become unrepeatable and costlier on the GPU, and hours should be arithmetic, not generated.

**No LangGraph at all.** Strengths: fewer dependencies. Why it lost: the Advisor still needs a pause for approval, resumable runs and per-node limits ([ADR 0007](0007-langgraph.md)).

## Consequences
Positive: clear split between jobs and the one reasoning component; less LangGraph surface to learn and test; repeatable numbers; simpler worker code.

Negative: two styles of unit to test and trace (jobs and the Advisor graph); the docs and `new-agent` skill wording need to follow this decision.

Obligations: job docs keep their format under `docs/architecture/agents/` but describe jobs; evals cover the Advisor's use of stored hours and clusters; jobs still need timeouts, circuit breakers and egress limits for external calls.

## When to revisit
If Cluster or Impact need multi-step reasoning with tools, or if a second reasoning component (for example a separate RCA drafter) is added.
