# ADR 0023: Ollama for local development, vLLM for staging and production
Status: Accepted
Date: 2026-10-08
Related docs: [models](../architecture/models.md), [llm-serving](../architecture/llm-serving.md), [testing](../testing.md), [ADR 0008](0008-vllm.md)

## Context
A source note said "move to Ollama"; that is corrected: Ollama is for local development only ([corrections](../context/corrections.md) item 14). Developers need an easy local model; the servers need concurrency ([ADR 0008](0008-vllm.md)). Laptops may not have NVIDIA GPUs.

## Decision
Ollama on the developer laptop (easy to install, OpenAI-compatible endpoint). vLLM on the GPU server for staging and production. Code uses an OpenAI-compatible client with `base_url` and model name from settings, so switching is configuration only. Model builds can differ slightly between Ollama and vLLM, so **evals must pass against staging (vLLM)** before release. The embedding model is identical everywhere.

## Alternatives considered
**vLLM on laptops.** Strengths: identical to production. Why it lost: needs NVIDIA GPUs and is heavy for laptops.

**Ollama in production.** Strengths: one tool everywhere. Why it lost: poor concurrency ([ADR 0008](0008-vllm.md)).

## Consequences
Positive: easy local setup, production concurrency.
Negative: behaviour may differ between the two; local eval scores may not match staging.
Obligations: evals run against staging; commands for both are in `docs/commands.md`.

## When to revisit
If model behaviour differs too much between the two.
