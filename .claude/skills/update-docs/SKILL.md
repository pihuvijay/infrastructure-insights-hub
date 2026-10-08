---
name: update-docs
description: After a code change, update the affected how-it-works docs from the git diff. Use at the end of every change.
---

# update-docs

## When to use
At the end of every feature, fix or refactor, and whenever a pull request is about to be opened.

## When not to use
Changing accepted ADRs (never edit them; use `write-adr` to supersede) or editing `docs/PRD.md` (read-only).

## Read first
- `git diff main...HEAD` (or `git diff --stat`)
- `docs/architecture/` docs for each touched area
- `docs/adr/README.md`
- `docs/build-plan.md`
- `docs/commands.md`

## Steps
1. Read the git diff and list what changed.
2. Find every architecture doc, agent doc, runbook section and ADR link affected.
3. Update the 'how' docs and their 'Last updated' line. Do not rewrite reasoning; reasoning is in ADRs.
4. If a decision changed, stop and use `write-adr` instead of editing an accepted ADR.
5. Update status of the step in `docs/build-plan.md` (tick the box only for items seen working; append-only notes).
6. Add new commands to `docs/commands.md` if any were introduced.
7. Report what changed and what still needs a human decision.

## Rules
- Never edit accepted ADRs except their status.
- Never edit `docs/PRD.md`; record API facts in `docs/architecture/api.md`.
- `CLAUDE.md`, `AGENTS.md`, `README.md` are append-only; after any change `git diff --numstat <file>` must show 0 deletions.
- Convert any unverifiable statement into `TODO: confirm with <who>`.

## Definition of done
- Tests written and passing (`write-tests`).
- Lint and type-check passing (`uv run ruff check .`, `uv run mypy app`, `npm run lint`, `npm run typecheck` as applicable).
- Docs updated via the `update-docs` skill.
- An ADR written via `write-adr` if a decision changed.

## Do not guess
If information is missing (a decision, a name, an address, a quota), stop and ask the user. Do not invent it. If it is not documented, ask. Record unknowns as `TODO: confirm with <who>` and add them to `docs/context/open-questions.md`.
