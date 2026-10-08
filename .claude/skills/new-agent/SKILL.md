---
name: new-agent
description: Add a LangGraph agent node with typed state, failure handling, docs and evals.
---

# new-agent

## When to use
When adding or changing an agent in the pipeline (ingest, embed, cluster, impact, advisor, or a new one).

## When not to use
Adding a plain background job with no agent logic (use `new-background-job`).

## Read first
- `docs/architecture/agents/README.md` and the doc for the closest existing agent
- ADR 0007, ADR 0022, ADR 0026, ADR 0012
- `docs/architecture/resilience.md`
- `docs/architecture/rag.md`

## Steps
1. Define the state inputs and outputs with Pydantic.
2. Decide whether an LLM is needed and write the justification (not every agent needs one).
3. Write the LangGraph node following the existing pattern in `backend/app/agents/`.
4. Set a recursion limit, a timeout per node, bounded retries and de-duplication.
5. Decide where it runs: interactive in the API or batch in the worker (ADR 0026).
6. Write unit tests with a fake model client.
7. Write the agent doc in `docs/architecture/agents/` with all required sections (purpose, inputs, outputs, LLM or not and why, model, prompt location, state, failure handling, tests, open questions).
8. Add eval questions to `backend/evals/` and run `run-evals`.

## Rules
- Human review is mandatory before any RCA upload (ADR 0012).
- Use the model routing in ADR 0022; do not hard-code model names in agent code.
- Every external call has a timeout, egress limiting and a circuit breaker.

## Definition of done
- Tests written and passing (`write-tests`).
- Lint and type-check passing (`uv run ruff check .`, `uv run mypy app`, `npm run lint`, `npm run typecheck` as applicable).
- Docs updated via the `update-docs` skill.
- An ADR written via `write-adr` if a decision changed.

## Do not guess
If information is missing (a decision, a name, an address, a quota), stop and ask the user. Do not invent it. If it is not documented, ask. Record unknowns as `TODO: confirm with <who>` and add them to `docs/context/open-questions.md`.
