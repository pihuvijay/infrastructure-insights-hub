---
name: write-tests
description: Choose the right test layer and write tests one at a time.
---

# write-tests

## When to use
Whenever code is added or changed (every pull request needs tests).

## When not to use
AI quality measurement (use `run-evals`).

## Read first
- `docs/testing.md`
- `docs/engineering-practices.md`
- Existing tests in `backend/tests/` and the code under test
- ADR 0017

## Steps
1. Pick the layer: unit for services and pure logic; integration against real Postgres in Docker for endpoints and database code; Playwright for a handful of key journeys.
2. Write one test for one behaviour, make it pass, then the next. Do not write code first and tests later.
3. Name tests by behaviour (for example `test_<thing>_<expected>`).
4. Fake the LLM, ServiceNow and Box in unit and integration tests, including error and 429 cases.
5. Run `uv run pytest tests/unit -v` and `uv run pytest tests/integration -v`; `npx playwright test` for e2e.

## Rules
- No test calls a real LLM except evals.
- Tests must be fast and independent.
- Integration tests use Postgres (pgvector image) and Redis in Docker, as in CI.

## Definition of done
- Tests written and passing (`write-tests`).
- Lint and type-check passing (`uv run ruff check .`, `uv run mypy app`, `npm run lint`, `npm run typecheck` as applicable).
- Docs updated via the `update-docs` skill.
- An ADR written via `write-adr` if a decision changed.

## Do not guess
If information is missing (a decision, a name, an address, a quota), stop and ask the user. Do not invent it. If it is not documented, ask. Record unknowns as `TODO: confirm with <who>` and add them to `docs/context/open-questions.md`.
