# Models

**Purpose:** which kind of model does which task, embedding consistency rules, and how to change a model safely.

**Related ADRs:** [0022 model routing](../adr/0022-model-routing.md), [0023 Ollama locally, vLLM on servers](../adr/0023-ollama-local-vllm-server.md), [0008 vLLM](../adr/0008-vllm.md), [0009 RAG](../adr/0009-rag-over-fine-tuning.md)

Last updated: 2026-10-08. All model names below are candidates, not decisions.

## Routing by task

Different tasks need different models.

| Task | Needs | Model approach |
|---|---|---|
| Embeddings | Consistency, not intelligence | Local embedding model. Candidate: `nomic-embed-text` (TODO: choose after evals) |
| Simple tasks: categorise, summarise, name clusters | Moderate quality | A smaller local model may be enough |
| Reasoning: planner deciding the workflow, RCA drafting, 5 Whys suggestions, Advisor answers | Highest reasoning quality | The strongest model available. A hosted "premium" API was suggested for the planner; allowed only if security approves sending ticket data externally (TODO). Otherwise the largest model the GPU can serve |

## Embedding rules

- The **same embedding model must be used for ingestion and for queries, in every environment.** Vectors from different models cannot be compared.
- Changing the embedding model means **re-embedding all data**.
- Store the model name and version with every vector.
- Every routing choice is validated with evals per task.

## Ollama locally, vLLM on the server

- **Ollama on the developer laptop** for local development: easy to install, OpenAI-compatible endpoint.
- **vLLM on the GPU server** for staging and production, for concurrency ([ADR 0008](../adr/0008-vllm.md)).
- The code uses an OpenAI-compatible client with `base_url` and model name from settings, so switching is configuration only.
- Model builds can differ slightly between Ollama and vLLM, so **evals must pass against staging (vLLM)** before release.
- The embedding model is identical everywhere.
Laptop candidates from the build plan: `nomic-embed-text` and `llama3.1:8b` via Ollama (`docs/commands.md`).

## Changing a model safely

1. Write an ADR first (skill `write-adr`).
2. For an embedding model: plan full re-embedding and run it before switching queries.
3. Run evals before and after, per task (skill `run-evals`).
4. Compare per question; roll back if accuracy drops.
Use the skill `change-model`.

## Open questions

LLM choice and size (after evals). Embedding model choice and whether vLLM serves it. Hosted API for the planner (security).
