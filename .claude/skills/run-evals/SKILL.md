---
name: run-evals
description: Run the AI evaluation set and compare with the last result.
---

# run-evals

## When to use
After any change to prompts, chunking, the embedding model, the LLM or retrieval, and before releasing AI changes.

## When not to use
Normal unit or integration testing (use `write-tests`).

## Read first
- `docs/testing.md`
- `backend/evals/` (questions, scoring script, results history)
- `docs/architecture/rag.md`, `docs/architecture/models.md`

## Steps
1. Run the evals script in `backend/evals/` (exact command is set when it is created, build plan 6.1).
2. Compare with the last stored result.
3. Report accuracy and every regression, question by question.
4. If accuracy dropped, find the cause or write a reason; do not mark the change done.
5. For release, run against staging (vLLM), not only the laptop (ADR 0023).
6. Store the new result in the results history.

## Rules
- Never mark an AI change done if accuracy dropped without a written reason.
- Embedding or LLM changes need an ADR first (`change-model`).
- Evals are the only tests allowed to call a real LLM.

## Definition of done
- Tests written and passing (`write-tests`).
- Lint and type-check passing (`uv run ruff check .`, `uv run mypy app`, `npm run lint`, `npm run typecheck` as applicable).
- Docs updated via the `update-docs` skill.
- An ADR written via `write-adr` if a decision changed.

## Do not guess
If information is missing (a decision, a name, an address, a quota), stop and ask the user. Do not invent it. If it is not documented, ask. Record unknowns as `TODO: confirm with <who>` and add them to `docs/context/open-questions.md`.
