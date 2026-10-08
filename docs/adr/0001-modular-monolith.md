# ADR 0001: Modular monolith over microservices
Status: Accepted
Date: 2026-10-08
Related docs: [requirements](../requirements.md), [high-level](../architecture/high-level.md), [scaling](../architecture/scaling.md), [background-jobs](../architecture/background-jobs.md), [agents](../architecture/agents/README.md)

## Context
GEV System Delivery serves 200 to 1,000 internal users with a heavily read-heavy load (see [requirements](../requirements.md): users, load shape, architecture style). It is built by a small team, likely one developer, and must be deployed and hosted by January 2027. Engineering effort should go into agent intelligence (accuracy of RCAs and search), not into infrastructure scaling. The system has several concerns (HTTP API, agents, integrations, background work) that must not become tangled.

## Decision
One FastAPI codebase with clear internal modules: `api` (routes only), `services` (business logic), `agents`, `integrations`, `workers`, plus `core`, `models` and `schemas`. The background worker is a **separate process started from the same codebase**, not a separate service. One repository, one set of images, one deploy pipeline.

## Alternatives considered
**Microservices.** Strengths: services scale and deploy independently, failures can be isolated, different teams can own different services, and each can use different technology. Why it lost here: it adds network calls between services, distributed tracing, multiple pipelines and harder failure modes (partial failure, version skew between services). Those costs pay off when many teams or very different scaling needs exist; with 1,000 users and one developer they only slow delivery and threaten the January date.

**A single undifferentiated script/app with no internal structure.** Strength: fastest first day. Why it lost: logic would leak into routes, making testing and later extraction difficult.

## Consequences
Positive: faster delivery, one deploy, one place to debug, simple local setup (Docker Compose), easy refactoring across modules.
Negative and accepted costs: one deployment unit means a bug in one module can take down the API process; all modules scale together.
Obligations: keep module boundaries clean (routes have no business logic; services do not import from routes; agents and integrations are called through services) so that a part, for example ingestion, could be extracted later. Code review (`code-reviewer` agent) checks this.

## When to revisit
10x scale; multiple teams working in the same codebase; a component that needs independent scaling (for example ingestion or the AI path). See [scaling](../architecture/scaling.md).
