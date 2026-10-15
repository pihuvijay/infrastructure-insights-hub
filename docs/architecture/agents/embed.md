# Embed job

**Purpose:** Chunk incident and RCA text and convert each chunk to a vector with an embedding model, then store the vectors in pgvector.

**Related ADRs:** [0007 LangGraph](../../adr/0007-langgraph.md), [0022 model routing](../../adr/0022-model-routing.md), [0026 interactive vs batch](../../adr/0026-interactive-vs-batch-agents.md), [0005 pgvector](../../adr/0005-postgres-pgvector.md), [0009 RAG](../../adr/0009-rag-over-fine-tuning.md)

Last updated: 2026-10-08. Part of the [agents overview](README.md). Not built yet.

## Inputs (Pydantic shape, described)
Changed record ids from Ingest. Text fields to embed (descriptions, comments, RCA sections). Chunking settings.

## Outputs
Rows in chunks and embeddings tables. Each embedding row stores the model name and version.

## Uses the LLM?
No, but it calls an embedding model (a model that turns text into a list of numbers; similar text gives similar numbers).

## Model
A local embedding model. Candidate: `nomic-embed-text` (TODO: choose after evals). The **same** embedding model must be used for ingestion and queries in every environment; changing it means re-embedding everything ([ADR 0022](../../adr/0022-model-routing.md)).

## Prompt location
Not applicable.

## State read and written
Reads: chunk settings, existing embeddings (to skip unchanged text). Writes: chunks, embeddings.

## Failure handling and retries
Runs in the worker. Idempotent (same chunk text and model produces the same row). Retries with backoff if the model server is down; jobs stay visible if they fail. Embedding being unavailable only delays Search freshness; dashboards are unaffected.

## How it is tested
Unit tests with a fake embedding client (shape, chunk boundaries, model name stored). Retrieval quality measured with eval questions: the right incidents must come back.

## Open questions
Embedding model choice and whether vLLM or a separate server serves it (TODO). Chunk size and overlap (TODO, tune with evals).
