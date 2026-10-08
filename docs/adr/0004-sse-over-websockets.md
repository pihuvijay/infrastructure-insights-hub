# ADR 0004: Server-Sent Events over WebSockets
Status: Accepted
Date: 2026-10-08
Related docs: [streaming](../architecture/streaming.md), [api](../architecture/api.md), [deployment](../architecture/deployment.md), [flows](../architecture/flows.md)

## Context
The agent sidebar streams answers token by token. Snapshot alerts must reach the browser. Data pages must refresh. Early notes recommended WebSockets for the sidebar and real-time notifications ([corrections](../context/corrections.md) item 5).

Definitions. **HTTP** is request and response: the browser asks, the server answers once (like the postal service). **Polling** repeats the request every few seconds. A **WebSocket** is a persistent, full-duplex connection where either side can send at any time (like a telephone call). **SSE (Server-Sent Events)** is an HTTP response the server keeps open and keeps writing to; one direction only, server to browser.

Feature by feature:
- Agent sidebar: one-way (server to browser). **Stop** is the browser closing the stream, or one cancel request.
- Alerts: one-way. Manager notification may be email or Teams (TODO: confirm with manager).
- Data pages: TanStack Query refetches about every 30 seconds, matching the 30-60 s consistency target.

## Decision
Use SSE for streaming (agent sidebar, Search answers, alerts if shown in-app) and plain HTTP with TanStack Query refetch for data pages. Do not use WebSockets.

## Alternatives considered
**WebSockets.** Strengths: true two-way real-time, low overhead per message. Why it lost: it needs Nginx upgrade configuration, stateful connections, custom reconnection logic, separate authentication handling and is harder to test, while adding nothing our one-way features need.

**Polling only.** Strengths: very simple. Why it lost: it cannot stream tokens smoothly.

Note on memory: an early argument said WebSockets cost memory overhead. That applies equally to SSE (both hold an open connection); at 1,000 users the cost is small either way, so it does not decide this.

## Consequences
Positive: plain HTTP means existing authentication, Nginx and logging work; the browser reconnects automatically; simpler tests.
Negative and obligations: Nginx proxy buffering must be off and timeouts long on SSE routes; `streamChat` in `src/lib/api.ts` currently reads a raw byte stream, so the format (plain text chunks vs SSE framing) must be decided when building ([streaming](../architecture/streaming.md)); the server must detect disconnect and cancel the agent run.

## When to revisit
Collaborative real-time editing of RCAs (TipTap collaboration uses WebSockets), user-to-user chat, or any genuine two-way real-time need. Open question: is collaborative RCA editing wanted? (team).
