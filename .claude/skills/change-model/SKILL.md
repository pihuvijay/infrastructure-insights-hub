---
name: change-model
description: Switch an LLM or embedding model safely with an ADR, re-embedding and evals.
---

# change-model

## When to use
Whenever the LLM, embedding model, or their serving setup changes.

## When not to use
Changing prompts only (still run `run-evals`).

## Read first
- `docs/architecture/models.md`, `docs/architecture/llm-serving.md`
- ADR 0022, ADR 0023, ADR 0008
- `backend/evals/`

## Steps
1. Write an ADR first with `write-adr`.
2. Run the evals on the current model and record the baseline.
3. For an embedding model: plan full re-embedding of all data and run it before switching queries; store the new model name and version per row.
4. Switch via settings (`base_url` and model name); no code change if the API is OpenAI-compatible.
5. Run the evals again and compare per task.
6. Run evals against staging (vLLM).
7. Roll back if accuracy drops.
8. Update `docs/architecture/models.md`.

## Rules
- Never change the embedding model without an ADR and full re-embedding.
- A hosted API for ticket data requires a recorded security approval (ADR).

## Definition of done
- Tests written and passing (`write-tests`).
- Lint and type-check passing (`uv run ruff check .`, `uv run mypy app`, `npm run lint`, `npm run typecheck` as applicable).
- Docs updated via the `update-docs` skill.
- An ADR written via `write-adr` if a decision changed.

## Do not guess
If information is missing (a decision, a name, an address, a quota), stop and ask the user. Do not invent it. If it is not documented, ask. Record unknowns as `TODO: confirm with <who>` and add them to `docs/context/open-questions.md`.
