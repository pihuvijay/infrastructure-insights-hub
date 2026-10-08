---
name: db-migration
description: Change the database safely with SQLAlchemy and Alembic. Use for every table or column change.
---

# db-migration

## When to use
Any new table, column, index, constraint or extension, and any change to a SQLAlchemy model.

## When not to use
Editing tables by hand in a database (never allowed) or changes that do not touch the schema.

## Read first
- `docs/architecture/database.md`
- The model files in `backend/app/models/`
- ADR 0005
- `docs/commands.md` (Alembic section)

## Steps
1. Edit the SQLAlchemy model in `backend/app/models/`.
2. Generate: `uv run alembic revision --autogenerate -m "<what changed>"`.
3. Read the generated migration and correct it by hand; autogenerate misses things (for example extensions, vector indexes, data moves, server defaults).
4. Test locally: `uv run alembic upgrade head`, `uv run alembic downgrade -1`, `uv run alembic upgrade head`.
5. Run `uv run alembic check` to confirm models and migrations match.
6. Add or update an integration test against Postgres in Docker.
7. Update the ER diagram in `docs/architecture/database.md`.

## Rules
- Every schema change goes through a migration; nobody edits tables by hand.
- Embedding rows store model name and version (ADR 0022).
- CI runs `alembic upgrade head` on an empty database and `alembic check`.

## Definition of done
- Tests written and passing (`write-tests`).
- Lint and type-check passing (`uv run ruff check .`, `uv run mypy app`, `npm run lint`, `npm run typecheck` as applicable).
- Docs updated via the `update-docs` skill.
- An ADR written via `write-adr` if a decision changed.

## Do not guess
If information is missing (a decision, a name, an address, a quota), stop and ask the user. Do not invent it. If it is not documented, ask. Record unknowns as `TODO: confirm with <who>` and add them to `docs/context/open-questions.md`.
