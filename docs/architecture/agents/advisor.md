# Advisor agent

**Purpose:** Answer questions, power RCA Search and the agent sidebar, and draft RCAs.

**Related ADRs:** [0007 LangGraph](../../adr/0007-langgraph.md), [0022 model routing](../../adr/0022-model-routing.md), [0026 interactive vs batch](../../adr/0026-interactive-vs-batch-agents.md), [0009 RAG](../../adr/0009-rag-over-fine-tuning.md), [0012 human review](../../adr/0012-human-review.md), [0008 vLLM](../../adr/0008-vllm.md), [0004 SSE](../../adr/0004-sse-over-websockets.md)

Last updated: 2026-10-08. Part of the [agents overview](README.md). Not built yet.

## Inputs (Pydantic shape, described)
Messages (`ChatMsg`), tagged context (`ChatContext`: cluster id, incident ids, focus) from `src/lib/types.ts`, search task and filters (`SearchRequest`), or an incident number for a draft.

## Outputs
Streamed text answers citing incidents; a `SearchResponse` (answer, scored incidents, cluster); an `RcaReport` draft that always contains every template section, produced as Pydantic structured output, with the AI-filled fields listed.

## Uses the LLM?
Yes. This is where reasoning quality matters: Advisor answers, RCA drafting, and 5 Whys suggestions.

## Model
The strongest model available. A hosted premium API is allowed only if security approves sending ticket data externally (TODO); otherwise the largest model the GPU can serve. Model choice is TODO after evals.

## Prompt location
TODO: decide location (suggested `backend/app/agents/`). Prompts live in code or files under version control, never only in a UI.

## State read and written
Reads: retrieved chunks (RAG), cluster, incident detail from Postgres, conversation. Writes: draft RCA (status Draft). A LangGraph interrupt waits for human approval before any upload.

## Failure handling and retries
Interactive runs in the API with a recursion limit, timeout per node and bounded retries. If vLLM is down the UI shows 'AI unavailable' and other pages are unaffected. A client disconnect cancels the run. De-duplicate so the same RCA draft is not generated twice at once.

## How it is tested
Unit tests with a fake LLM client. Evals: about 30 real questions with known answers in `backend/evals/`, run after any change to prompt, chunking, embedding model or LLM. Check every template section is present and in order.

## Open questions
Model choice (TODO). Whether interactive drafting stays in the API or moves to the worker (TODO after measuring). Hosted API for the planner model (TODO: security).
