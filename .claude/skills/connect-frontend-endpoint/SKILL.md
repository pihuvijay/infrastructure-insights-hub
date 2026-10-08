---
name: connect-frontend-endpoint
description: Switch one call in src/lib/api.ts from mock to live. Use when a backend endpoint is ready.
---

# connect-frontend-endpoint

## When to use
When a backend endpoint exists and the page should use real data.

## When not to use
Adding a new endpoint from scratch (use `new-endpoint` first).

## Read first
- `src/lib/api.ts`, `src/lib/types.ts`, `src/lib/queries.ts`
- `docs/architecture/frontend.md`
- `docs/architecture/api.md`
- `CLAUDE.md`
- The checklist in `docs/checklists/` for the page, if any

## Steps
1. Pick exactly one call in `src/lib/api.ts`.
2. Confirm the backend endpoint exists and matches the generated types.
3. Make the live branch of that call work; keep the mock branch.
4. Run the page in live mode (`NEXT_PUBLIC_API_MODE=live`, `API_URL=http://localhost:8000`) and check loading, empty and error states.
5. Switch back to mock mode and confirm it still works.
6. Run `npm run lint && npm run typecheck && npm run build`.
7. Update the checklist and `docs/architecture/frontend.md`.

## Rules
- Only `src/lib/api.ts` calls the network; no `fetch` in components (CLAUDE.md).
- Keep mock mode working.
- Follow CLAUDE.md style rules and the `build-feature` skill in `.devin/skills/`.

## Definition of done
- Tests written and passing (`write-tests`).
- Lint and type-check passing (`uv run ruff check .`, `uv run mypy app`, `npm run lint`, `npm run typecheck` as applicable).
- Docs updated via the `update-docs` skill.
- An ADR written via `write-adr` if a decision changed.

## Do not guess
If information is missing (a decision, a name, an address, a quota), stop and ask the user. Do not invent it. If it is not documented, ask. Record unknowns as `TODO: confirm with <who>` and add them to `docs/context/open-questions.md`.
