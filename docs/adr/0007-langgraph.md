# ADR 0007: LangGraph for the agent pipeline
Status: Accepted
Date: 2026-10-08
Related docs: [agents](../architecture/agents/README.md), [resilience](../architecture/resilience.md), [flows](../architecture/flows.md), [redis](../architecture/redis.md)

## Context
Five cooperating agents (Ingest, Embed, Cluster, Impact, Advisor) run multi-step workflows, and every RCA needs mandatory human review before upload ([ADR 0012](0012-human-review.md)). Real work is not linear.

What an agent is here: an agent does not just answer once; it loops until a task is complete. LangGraph models this as a directed graph. **Nodes** are functions (the agents or steps). **Edges** are paths between nodes, including conditional paths. **State** is shared memory, like a whiteboard, that moves with the work; one agent writes to it and the next reads from it.

The graph allows three things a simple input, AI, output chain cannot: **loop back** ("the data looks wrong, research again"), **branch** ("if urgent, route one way; if routine, another"), and **wait** ("pause until the user clicks Approve", implemented with LangGraph interrupts). Written as plain if/else code this becomes unmanageable quickly. LangGraph tracks where the work is, what has been done and what comes next, and with a checkpointer it can resume after a failure rather than start again. The pattern Research, Approval, Execution maps onto the RCA flow: Draft, Human review, Upload to Box.

Design note: not every agent needs an LLM. Embed is an embedding model call; Cluster can be a clustering algorithm over vectors (algorithm TODO) with the LLM only naming clusters; Impact is mainly arithmetic over recorded hours. Using the LLM only where reasoning is needed improves accuracy, speed and GPU load. This is documented in each agent doc.

## Decision
Each agent is a node in a LangGraph graph; shared state passes between nodes; checkpointing allows resuming; interrupts implement human review. Every graph sets a recursion limit (maximum iterations), a timeout per node and bounded retries.

## Alternatives considered
**Plain Python functions.** Strengths: simplest, no dependency. Why it lost: no built-in state tracking, recovery or interrupts, so we would rebuild them badly.

**LangChain chains alone.** Strengths: quick linear pipelines. Why it lost: less control over flow (loops, branches, waits).

**CrewAI or AutoGen.** Strengths: higher-level multi-agent abstractions. Why it lost: less control and more opinionated; our flow is a defined pipeline, not free-form agent conversation.

## Consequences
Positive: one agent can be upgraded or swapped without rewriting the pipeline; resumable runs; human review is a first-class step; agent tracing per node.
Negative: a new dependency and concepts to learn; state storage choice (Redis or Postgres checkpointer) is TODO.
Obligations: recursion limits and node timeouts on every graph; de-duplicate runs so one RCA task is never processed twice at once; `code-reviewer` checks this.

## When to revisit
If the graph adds complexity without benefit for simple agents.
