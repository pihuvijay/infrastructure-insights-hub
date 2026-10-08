# ADR 0003: FastAPI for the backend
Status: Accepted
Date: 2026-10-08
Related docs: [api](../architecture/api.md), [high-level](../architecture/high-level.md), [streaming](../architecture/streaming.md), [engineering-practices](../engineering-practices.md)

## Context
The backend is AI-heavy and spends much of its time waiting for LLM responses and external APIs (see [requirements](../requirements.md)). The Python AI ecosystem (LangGraph, vLLM's OpenAI-compatible clients, embedding libraries) is where the agent work lives. The frontend is TypeScript, and `docs/PRD.md` already specifies a FastAPI contract under `/api/v1`.

## Decision
Use FastAPI (Python) for the backend. Use Pydantic for request/response validation, LLM structured output and settings (reading `.env` and failing at startup if something is missing). FastAPI generates OpenAPI, from which frontend TypeScript types are generated.

## Alternatives considered
**Django.** Strengths: batteries included (admin, ORM, auth), mature. Why it lost: heavier, sync-first, and we mostly need an async API with Pydantic validation, not server-rendered pages or the Django admin.

**Flask.** Strengths: minimal and familiar. Why it lost: no native async or request validation, so we would assemble what FastAPI includes.

**Next.js API routes in TypeScript.** Strengths: one language and one deploy for frontend and backend. Why it lost: it would split the AI work away from the Python ecosystem (LangGraph, vLLM clients, evals), and long-running streaming and worker processes fit poorly there.

## Consequences
Positive: async handling suits waiting on LLMs; Pydantic validation; automatic OpenAPI docs at `/docs`; generated frontend types mean frontend and backend cannot silently disagree; the official Full Stack FastAPI Template is a model for layout.
Negative: two languages in the repo (TypeScript and Python), two toolchains in CI.
Obligations: routes contain no business logic; use Pydantic models for every schema.

## When to revisit
Unlikely.
