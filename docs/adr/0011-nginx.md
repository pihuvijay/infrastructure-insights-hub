# ADR 0011: Nginx for HTTPS, routing and rate limiting; no separate load balancer or API gateway
Status: Accepted
Date: 2026-10-08
Related docs: [deployment](../architecture/deployment.md), [rate-limiting](../architecture/rate-limiting.md), [streaming](../architecture/streaming.md), [high-level](../architecture/high-level.md), [auth](../architecture/auth.md)

## Context
An early diagram showed an "API Gateway", and the developer asked about load balancing. With one app server there is nothing to balance, and a separate gateway product would add features we do not need ([corrections](../context/corrections.md) items 6 and 7).

## Decision
Nginx on VM 1 terminates HTTPS, routes `/` to Next.js and `/api` (and `/health`) to FastAPI, applies ingress rate limiting (full design in [ADR 0019](0019-rate-limiting.md)), and has SSE-friendly settings (buffering off, long timeouts; [ADR 0004](0004-sse-over-websockets.md)). Authentication happens in FastAPI middleware. The gateway role is fulfilled by Nginx plus that middleware.

## Alternatives considered
**Dedicated API gateway products (for example Kong).** Strengths: plugin ecosystem, central policy. Why it lost: unnecessary features and another component to run.

**Traefik.** Strengths: automatic service discovery, container-friendly. Why it lost: viable alternative, but Nginx is familiar and sufficient.

**Hand-built rate limiter.** Strengths: full control. Why it lost: Nginx `limit_req` already implements a leaky bucket with burst allowance.

## Consequences
Positive: one component covers TLS, routing and ingress limiting; Nginx can act as a load balancer if a second app server is added.
Negative: Nginx configuration must be maintained and tested (including SSE); no built-in per-user limits (those live in FastAPI and Redis).
Obligations: config lives in `infra/nginx/`; the local production setup (build plan 3.2) rehearses it.

## When to revisit
A second app server or a second GPU server is added.
