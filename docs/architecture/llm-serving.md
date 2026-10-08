# LLM serving

**Purpose:** how the private LLM is served on the GPU server, GPU memory facts, and how to switch between Ollama and vLLM.

**Related ADRs:** [0008 vLLM over Ollama](../adr/0008-vllm.md), [0023 Ollama locally, vLLM on servers](../adr/0023-ollama-local-vllm-server.md), [0022 model routing](../adr/0022-model-routing.md), [0002 on-premises VMs](../adr/0002-on-premises-vms.md)

Last updated: 2026-10-08. Model choice is TODO.

## What runs where

| Environment | Server | Why |
|---|---|---|
| Developer laptop | Ollama (OpenAI-compatible endpoint, `http://localhost:11434/v1`) | Easy to install. |
| Staging and production | vLLM on VM 4 (GPU), `http://<internal-ip>:8000/v1` | Concurrency. |

vLLM exposes an OpenAI-compatible API. The backend uses an OpenAI-compatible client with `base_url` and the model name read from settings, so switching is configuration only.

## Starting vLLM

From the notes (model choice is TODO):

```
docker run --gpus all -p 8000:8000 vllm/vllm-openai:latest --model meta-llama/Llama-3.1-8B-Instruct
```

Check it with `curl http://<gpu-address>:8000/v1/models` (also in `docs/commands.md`).

## Why vLLM

Ollama serves requests largely one at a time, so concurrent agents queue behind each other. vLLM uses **continuous batching**: it merges tokens from many requests into shared GPU passes. Dashboards do not depend on the LLM at all; vLLM's benefit is concurrency for AI features, not dashboard speed ([corrections](../context/corrections.md) item 3).

## GPU memory facts

- An 8B-parameter model needs roughly **16 GB** of GPU memory at full (16-bit) precision; roughly **5-6 GB** when 4-bit quantised.
- Extra memory is needed for the **KV cache** (the model's working memory for each request), which grows with the number of concurrent requests and context length.
- Parallel agents do not multiply model memory, but they do need KV cache headroom.
- Monitor vLLM KV cache utilisation in production ([observability.md](observability.md)).
- Typical GPUs: NVIDIA L4 (24 GB), A100 (40 or 80 GB). TODO: confirm GPU with IT.

## Quantisation

We do not quantise models ourselves. If memory requires it, download a model that is already quantised (AWQ or GPTQ versions on Hugging Face). The GPU server is on-prem, so model weights must be downloaded or transferred in. TODO: confirm with IT whether the server can reach Hugging Face.

## Choosing and changing the model

Model choice is TODO, decided with evals ([models.md](models.md)). Changing a model needs an ADR first and the `change-model` skill. Model builds can differ slightly between Ollama and vLLM, so evals must pass against staging.

## If the model server is down

AI features show "AI unavailable". Non-AI pages are unaffected ([resilience.md](resilience.md)).

## Open questions

GPU model and memory (IT). Hugging Face access (IT). Whether vLLM also serves the embedding model (you). LLM size (you, after evals).
