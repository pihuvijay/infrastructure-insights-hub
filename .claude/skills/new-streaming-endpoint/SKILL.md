---
name: new-streaming-endpoint
description: Add an SSE streaming route and its frontend hook. Use for streamed agent answers.
---

# new-streaming-endpoint

## When to use
When a response must stream to the browser (agent sidebar, Search answers).

## When not to use
Normal request/response endpoints (use `new-endpoint`) and anything needing two-way real-time (see ADR 0004 revisit triggers).

## Read first
- `docs/architecture/streaming.md`
- ADR 0004, ADR 0026
- `src/lib/api.ts` (`streamChat`) and `src/lib/agent-store.ts`
- `docs/architecture/api.md`

## Steps
1. Add a FastAPI route that returns a `text/event-stream` response from an async generator.
2. Detect client disconnect and cancel the agent run.
3. Add a heartbeat if the stream can be idle.
4. Send a clear final event or end of stream, and a clear error event.
5. Decide the framing and keep `streamChat` in `src/lib/api.ts` compatible (or update it together with the PRD).
6. Add the frontend hook or generator following the existing `streamChat` pattern; no `fetch` in components.
7. Make sure Nginx buffering is off and timeouts are long for the route (`infra/nginx/`).
8. Write tests: tokens arrive in order, disconnect cancels the run.
9. Update `docs/architecture/streaming.md`.

## Rules
- SSE, not WebSockets (ADR 0004).
- Interactive agents run in the API (ADR 0026).
- Show 'AI unavailable' if the model server is down.

## Definition of done
- Tests written and passing (`write-tests`).
- Lint and type-check passing (`uv run ruff check .`, `uv run mypy app`, `npm run lint`, `npm run typecheck` as applicable).
- Docs updated via the `update-docs` skill.
- An ADR written via `write-adr` if a decision changed.

## Do not guess
If information is missing (a decision, a name, an address, a quota), stop and ask the user. Do not invent it. If it is not documented, ask. Record unknowns as `TODO: confirm with <who>` and add them to `docs/context/open-questions.md`.
