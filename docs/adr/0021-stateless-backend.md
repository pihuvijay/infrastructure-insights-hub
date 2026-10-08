# ADR 0021: Stateless backend; horizontal scaling deferred
Status: Accepted
Date: 2026-10-08
Related docs: [scaling](../architecture/scaling.md), [deployment](../architecture/deployment.md), [redis](../architecture/redis.md), [ADR 0001](0001-modular-monolith.md)

## Context
The strategy notes proposed horizontal scaling with Kubernetes autoscaling and a layer-7 load balancer. The load is 200 to 1,000 internal users, read-heavy, with a January 2027 deadline ([requirements](../requirements.md)). A second app server is not needed now, but adding one later must not require a rewrite.

## Decision
Keep backend instances stateless now: sessions, tokens and temporary state live in Redis or Postgres; uploaded files are not stored on the app VM's local disk (location TODO). Do **not** build scaling infrastructure now. The path, when needed: a second app VM behind Nginx upstream load balancing, then container orchestration (for example Kubernetes) with autoscaling and a layer-7 load balancer, then splitting services.

## Alternatives considered
**Kubernetes from day one.** Strengths: autoscaling, self-healing, industry standard. Why it lost: heavy operations burden, unjustified at 1,000 users, and it risks the January date.

**Stateful instances (in-memory sessions, local file storage).** Strengths: easiest. Why it lost: it blocks adding a second instance later.

## Consequences
Positive: one app server now, with a clear path if load grows; low cost today.
Negative: discipline is needed to avoid local state; some features (for example file uploads) need an external storage decision.
Obligations: `code-reviewer` checks for local state on the app server.

## When to revisit
Sustained latency over the target that caching cannot fix, or user growth well beyond 1,000.
