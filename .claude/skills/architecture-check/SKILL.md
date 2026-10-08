---
name: architecture-check
description: Compare a proposed change against docs/architecture/ and docs/adr/ before building it. Use before any design-affecting change.
---

# architecture-check

## When to use
Before implementing anything that changes structure, adds a dependency, adds a service, or touches data flow, hosting, models, auth or integrations.

## When not to use
Pure bug fixes or UI tweaks that do not affect design; writing the ADR itself (use `write-adr`).

## Read first
- `docs/architecture/high-level.md` and any architecture doc for the area
- `docs/adr/README.md` (index) and every ADR the change touches
- `docs/requirements.md`
- `CLAUDE.md`, `AGENTS.md`, `docs/PRD.md`

## Steps
1. Describe the proposed change in 2-3 sentences.
2. Open the ADR index and list every ADR the change touches.
3. Read each touched ADR (Decision, Consequences, When to revisit).
4. Compare the change against each ADR and the matching architecture doc.
5. Report conflicts with file references (path and heading or line). Report which docs would need updating.
6. If the change needs to override an ADR, stop: write a new ADR with `write-adr` that supersedes the old one before any code.

## Rules
- Never override an ADR without writing a new one via `write-adr`.
- Every claim cites a file and heading or line.
- Check against protected-file rules (`docs/PRD.md` read-only; `CLAUDE.md`, `AGENTS.md`, `README.md` append-only).

## Definition of done
- Tests written and passing (`write-tests`).
- Lint and type-check passing (`uv run ruff check .`, `uv run mypy app`, `npm run lint`, `npm run typecheck` as applicable).
- Docs updated via the `update-docs` skill.
- An ADR written via `write-adr` if a decision changed.

## Do not guess
If information is missing (a decision, a name, an address, a quota), stop and ask the user. Do not invent it. If it is not documented, ask. Record unknowns as `TODO: confirm with <who>` and add them to `docs/context/open-questions.md`.
