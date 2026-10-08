---
name: rag-add-source
description: Add a new data source to the RAG pipeline.
---

# rag-add-source

## When to use
When a new kind of document or data (beyond ServiceNow incidents, Box RCAs and uploads) should be searchable.

## When not to use
Changing the embedding model (use `change-model`).

## Read first
- `docs/architecture/rag.md`
- `docs/architecture/models.md`
- ADR 0005, 0009, 0022
- `backend/evals/`

## Steps
1. Write the loader (as part of Ingest).
2. Choose the chunking and test it.
3. Write the embedding job using the fixed embedding model.
4. Store chunks and vectors with the model name and version.
5. Add retrieval filters (date, project, source, status, resolved by) so the source is filterable.
6. Add eval questions for the new source.
7. Run `run-evals` and record the result.
8. Update `docs/architecture/rag.md`.

## Rules
- Same embedding model for ingestion and queries in every environment.
- Ingestion runs as a background job, not a one-off script.

## Definition of done
- Tests written and passing (`write-tests`).
- Lint and type-check passing (`uv run ruff check .`, `uv run mypy app`, `npm run lint`, `npm run typecheck` as applicable).
- Docs updated via the `update-docs` skill.
- An ADR written via `write-adr` if a decision changed.

## Do not guess
If information is missing (a decision, a name, an address, a quota), stop and ask the user. Do not invent it. If it is not documented, ask. Record unknowns as `TODO: confirm with <who>` and add them to `docs/context/open-questions.md`.
