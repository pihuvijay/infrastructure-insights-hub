# ADR 0019: Two-tier rate limiting
Status: Accepted
Date: 2026-10-08
Related docs: [rate-limiting](../architecture/rate-limiting.md), [integrations](../architecture/integrations.md), [resilience](../architecture/resilience.md), [redis](../architecture/redis.md), [ADR 0011](0011-nginx.md)

## Context
We must protect our app from overload (many users, a runaway client, expensive AI endpoints) and protect ServiceNow and Box quotas and our access to them. An agent loop or retry storm could exceed ServiceNow's limits and get the service account blocked, leaving the app blind until IT unblocks it.

Algorithms:
- **Token bucket:** a bucket of N tokens refilling at a steady rate; each request takes one; empty means rejected. Allows short bursts.
- **Fixed window:** N requests per minute, resetting each minute. Simple but choppy: all N can arrive in one second, then nothing for 59.
- **Leaky bucket:** requests flow out at a fixed, steady rate whatever the arrival speed. Smooth.
- **Sliding window:** a smoother version of fixed window.

## Decision
**Tier 1, ingress (protects our app):** Nginx `limit_req` per user or IP; Nginx implements a leaky bucket with a burst allowance, which tolerates short bursts such as a manager refreshing dashboards during a major incident. Stricter per-user limits on expensive AI endpoints in FastAPI, stored in Redis (library TODO: `fastapi-limiter` or `slowapi`), so one user cannot saturate the GPU.

**Tier 2, egress (protects ServiceNow and Box; the more critical tier):** every ServiceNow and Box call goes through a limiter set below that service's quota (quotas TODO from admins). A steady, leaky-bucket style outflow suits background sync. Handle HTTP 429 and honour `Retry-After`. If more than one process calls the same service, the counter must be shared in Redis; otherwise each process counts separately and traffic multiplies. Agent loops and retries are also capped ([ADR 0020](0020-resilience.md)). Only ServiceNow and Box are API integrations; the roughly 30 team tools are links.

Why each tier uses its choice: ingress needs burst tolerance for humans (leaky bucket with burst at Nginx; per-user limits for expensive endpoints); egress needs smooth, steady output below a quota and shared counters because several processes may call the same service.

## Alternatives considered
**Ingress only.** Strengths: simple and visible. Why it lost: it leaves the critical external-quota risk unaddressed; an internal loop is not traffic from a browser.

**No limits.** Strengths: nothing to configure. Why it lost: one runaway agent loop can get the service account blocked.

**In-memory limiter in each process** (a source note suggested `fastapi-limiter`, in-memory; [corrections](../context/corrections.md) item 20). Why it lost: counts would be per process, and `fastapi-limiter` stores counts in Redis and limits only requests coming into our API.

## Consequences
Positive: our app and the external services are both protected; limits are shared across processes.
Negative: integration calls are slowed deliberately; limits must be tuned once quotas are known; Redis becomes a dependency of rate limiting (fail-open or fail-closed is TODO).
Obligations: skill `add-rate-limit`; tests that limits trigger and recover.

## When to revisit
Quotas change, or new integrations are added.
