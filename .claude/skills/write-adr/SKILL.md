---
name: write-adr
description: Write a new architecture decision record from the template and update the index. Use whenever a design decision is made or changed.
---

# write-adr

## When to use
When choosing between technical options, changing an earlier decision, or resolving a TODO that was an open decision (for example arq vs Celery).

## When not to use
Documenting how something works (use the architecture docs) or recording a procedure (use a skill).

## Read first
- `docs/adr/README.md` (template, rules, index)
- The ADRs related to the topic
- `docs/requirements.md`
- `docs/context/open-questions.md`

## Steps
1. Find the next number in `docs/adr/README.md`.
2. Create `docs/adr/NNNN-short-title.md` using the template: Status, Date, Related docs, Context, Decision, Alternatives considered, Consequences, When to revisit.
3. Context: the problem, forces, constraints, and the requirements involved (cite `docs/requirements.md`).
4. Alternatives: for each, what it is, its genuine strengths, and why it lost here.
5. Consequences: positive, negative and accepted costs, and what it obliges us to do.
6. When to revisit: concrete triggers.
7. Add the row to the index in `docs/adr/README.md`.
8. If it replaces an older ADR: write 'Supersedes ADR NNNN' in the new one and mark the old one 'Superseded by ADR NNNN' (the status line is the only allowed edit).
9. Link the ADR from affected architecture docs and remove the matching TODO from `docs/context/open-questions.md` by adding a dated answer (do not delete rows).

## Rules
- All five sections are required and must contain real reasoning, not one-liners.
- Never edit accepted ADRs except status.
- Do not invent facts; use TODO where unknown.

## Definition of done
- Tests written and passing (`write-tests`).
- Lint and type-check passing (`uv run ruff check .`, `uv run mypy app`, `npm run lint`, `npm run typecheck` as applicable).
- Docs updated via the `update-docs` skill.
- An ADR written via `write-adr` if a decision changed.

## Do not guess
If information is missing (a decision, a name, an address, a quota), stop and ask the user. Do not invent it. If it is not documented, ask. Record unknowns as `TODO: confirm with <who>` and add them to `docs/context/open-questions.md`.
