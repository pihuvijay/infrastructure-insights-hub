# ADR 0005: PostgreSQL with pgvector over Pinecone
Status: Accepted
Date: 2026-10-08
Related docs: [database](../architecture/database.md), [rag](../architecture/rag.md), [models](../architecture/models.md), [high-level](../architecture/high-level.md)

## Context
> CONFLICT (recorded, resolved by this ADR): an early architecture note names Pinecone as the vector store; the VM plan names pgvector. See [corrections](../context/corrections.md) item 1.

The system needs two kinds of storage: relational data (incidents, RCA status, environments, snapshots, users) and semantic search over incident and RCA text. The Search page filters semantic results by date, project, source, status and resolver, so vector search and ordinary SQL filters must work together. Ticket data must stay on the company network ([ADR 0002](0002-on-premises-vms.md)). The "polyglot storage" argument from the notes says use the best store per job (relational for tables, a vector database for vectors); pgvector gives both in one database.

## Decision
Store everything in PostgreSQL on VM 2, with the pgvector extension for embeddings (HNSW index). Each embedding row stores the model name and version. Vector similarity and SQL filters are combined in one query.

## Alternatives considered
**Pinecone.** Strengths: managed, scalable vector search with little operational work. Why it lost: it is SaaS, so data leaves the network, and it is a second store that must be kept consistent with Postgres.

**Self-hosted vector databases (Qdrant, Weaviate).** Strengths: strong vector features and scale. Why it lost: another server to run, back up and secure, and filters on relational data would need duplication or cross-system joins.

**FAISS saved to a local folder with OpenAI embeddings** (from a source note, [corrections](../context/corrections.md) item 12). Strengths: very simple, quick to prototype. Why it lost: a FAISS file lives on one machine, is not shared between servers, and is not backed up with the database; OpenAI embeddings would send text to an external service.

## Consequences
Positive: one database to back up and secure; vector search combined with SQL filters, which the Search page needs; one fewer system.
Negative: pgvector is less specialised than a dedicated vector database, and heavy vector load shares the database server.
Obligations: store the embedding model name and version per row; changing the embedding model requires full re-embedding ([ADR 0022](0022-model-routing.md)); add the HNSW index.

## When to revisit
The vector count or search latency outgrows pgvector.
