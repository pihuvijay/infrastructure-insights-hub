# Streaming (HTTP, polling, WebSockets, SSE)

**Purpose:** how data reaches the browser: what each technique is, which feature uses which, and how streaming and Stop work.

**Related ADRs:** [0004 SSE over WebSockets](../adr/0004-sse-over-websockets.md), [0011 Nginx](../adr/0011-nginx.md), [0026 interactive vs batch agents](../adr/0026-interactive-vs-batch-agents.md)

Last updated: 2026-10-08

## The four techniques

- **HTTP request/response** is like the postal service: you send a letter, you get one reply, the exchange is over.
- **Polling** is checking the post box every few seconds. Simple, but wasteful, and it cannot stream tokens smoothly.
- **WebSocket** is like a telephone call: a persistent, full-duplex connection where either side can speak at any time. It needs special handling (Nginx upgrade settings, stateful connections, custom reconnection, separate auth handling).
- **SSE (Server-Sent Events)** is a radio broadcast: an HTTP response the server keeps open and keeps writing to. One direction only, server to browser. It is plain HTTP, so existing auth, Nginx and logging work, and the browser reconnects automatically.

Correction: the "WebSocket memory overhead" argument applies equally to SSE, since both hold an open connection. At 1,000 users the cost is small either way ([corrections](../context/corrections.md) item 5).

## Which feature uses which

| Feature | Technique | Why |
|---|---|---|
| Agent sidebar answers | SSE | One-way streaming of tokens. |
| Stop button | Browser aborts the stream (optionally one cancel request) | No two-way channel needed. |
| Snapshot alerts and notifications | SSE or notification channel (email/Teams TODO) | One-way server to browser. |
| Data pages (Environments, Create RCA list, ...) | Normal HTTP with TanStack Query refetch about every 30 s | Matches the 30-60 s consistency target. |

## SSE endpoint pattern in FastAPI

The route returns a streaming response with media type `text/event-stream`, iterating an async generator that yields chunks as the agent produces them. Rules: set a heartbeat if the stream may be idle, detect client disconnect, cancel the agent work on disconnect, and end with a clear final event. Use the skill `new-streaming-endpoint`. No code is written yet.

### Wire format (decided 2026-10-15)

`POST /api/v1/agent/chat` responds with `Content-Type: text/event-stream`. The browser cannot use `EventSource` for a POST with a body, so `streamChat` in `src/lib/api.ts` reads the response with `fetch` and parses the events itself (`sseEvents`). Each event ends with a blank line:

| Event | Wire form | Meaning |
|---|---|---|
| token | `data: "<JSON string>"` | The next piece of text. JSON-encoded so newlines and quotes in the token are safe |
| done | `event: done` then `data: {}` | The answer is complete |
| error | `event: error` then `data: {"message": "..."}` | The run failed; the UI shows the message |
| heartbeat | `: ping` | A comment line sent while idle; the client ignores it |

If the stream closes without a `done` event, `streamChat` throws "Stream ended unexpectedly" so a cut-off answer is never shown as complete. Stop still aborts the `fetch` with its `AbortSignal`. In mock mode `mockChat` yields the same strings directly, so the sidebar code is unchanged.

## Frontend hook pattern

Components never call `fetch`. `streamChat` is an async generator; the sidebar iterates it, appends text and passes an `AbortController` signal. This pattern already exists for mock mode (`src/lib/agent-store.ts`, `src/lib/mock.ts`).

## How Stop works

1. The user presses Stop; the browser aborts the fetch.
2. The server notices the client disconnected.
3. The server cancels the agent run (stopping model calls and releasing the GPU).
4. Optionally, an explicit cancel endpoint can be added for runs that outlive the connection (TODO).

## Nginx settings required for SSE

Proxy buffering off for the streaming route, a long read timeout, and no response compression that waits for the whole body. Exact directives are written into `infra/nginx/` when it is built (TODO). See [deployment.md](deployment.md).

## When to revisit

Collaborative real-time RCA editing (TipTap collaboration uses WebSockets), user-to-user chat, or any genuine two-way real-time need would reopen ADR 0004.
