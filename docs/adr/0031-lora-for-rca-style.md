# ADR 0031: LoRA fine-tuning for RCA template and style, alongside RAG
Status: Accepted
Date: 2026-10-15
Supersedes: the "Do not fine-tune" part of [ADR 0009](0009-rag-over-fine-tuning.md). The RAG-for-knowledge and no-in-house-quantisation parts of 0009 still stand.
Related docs: [models](../architecture/models.md), [llm-serving](../architecture/llm-serving.md), [rag](../architecture/rag.md), [agents/advisor](../architecture/agents/advisor.md), [ADR 0008](0008-vllm.md), [ADR 0012](0012-human-review.md), [ADR 0022](0022-model-routing.md), [ADR 0023](0023-ollama-local-vllm-server.md)

## Context
ADR 0009 chose RAG for knowledge and prompts plus Pydantic structured output for the RCA template, and said to revisit if evals show failures that prompting and retrieval cannot fix. The team now wants the Advisor model to learn the RCA template, section style and tone directly, to shorten prompts and make drafts need less editing. RCAs already exist as Word documents in Box, all following one template, and each links to a ServiceNow incident, so labelled prompt and response pairs can be built from approved RCAs.

LoRA (low-rank adaptation) trains a small set of extra weights and leaves the base model unchanged, so the adapter is small, quick to train and can be switched off. QLoRA does the same with the base model loaded in 4-bit during training only. vLLM can serve a LoRA adapter next to the base model with `--enable-lora` ([ADR 0008](0008-vllm.md)). Ticket data must stay on the company network ([ADR 0002](0002-on-premises-vms.md)), so training must run on an approved machine. A laptop has no NVIDIA GPU, so a CPU run is only possible with a small model.

Fine-tuning does not teach the model which incidents happened. That stays with RAG.

## Decision
Add LoRA fine-tuning of the Advisor model for RCA template adherence, section style and tone. Keep RAG for all knowledge. Keep Pydantic structured output as the guarantee that every section is returned in order; the adapter reduces editing, it does not replace that guarantee.

- Training script: `backend/scripts/train_lora.py` (one file). Base model `meta-llama/Llama-3.1-8B-Instruct` with QLoRA on an NVIDIA GPU; a small model (`Qwen/Qwen2.5-0.5B-Instruct`) on CPU only to prove the pipeline.
- Data: only approved RCAs. `prompt` is the ServiceNow ticket text, `response` is the approved RCA in the exact template. Training data and adapters never leave the company network.
- Serving: vLLM on the GPU server with `--enable-lora --lora-modules rca=<path>`; the app selects the adapter by model name `rca`. Locally, a merged model can be imported into Ollama.
- Adoption gate: the adapter is used only if it beats the base model on held-out RCAs in `backend/evals/` (sections present and in order, root cause code matches, cited incidents exist). Evals must pass on staging (vLLM) ([ADR 0023](0023-ollama-local-vllm-server.md)).
- QLoRA's 4-bit loading happens at training time. We still do not produce or ship in-house quantised models for serving ([ADR 0009](0009-rag-over-fine-tuning.md)).
- A person still reads and approves every draft ([ADR 0012](0012-human-review.md)).

## Alternatives considered
**RAG, prompts and structured output only (ADR 0009 as written).** Strengths: no training pipeline, nothing goes stale, simple to evaluate. Why it lost here: the team wants lower editing effort and shorter prompts, and does not yet have evidence either way, so the adapter is added behind an eval gate rather than assumed.

**Full fine-tuning of all weights.** Strengths: most capacity to change behaviour. Why it lost: needs far more GPU memory and time, produces a full-size model per run, and is harder to roll back.

**Fine-tuning to teach incident knowledge.** Strengths: no retrieval step. Why it lost: knowledge goes stale as incidents arrive and the model can invent incidents. RAG with citations stays the knowledge path.

**Hosted fine-tuning API.** Strengths: no GPU to run. Why it lost: ticket data would leave the network unless security approves (TODO).

**Training only on a laptop CPU.** Strengths: no extra hardware. Why it lost for the 8B model: not realistic in memory or time. It is kept for small-model smoke tests only.

## Consequences
Positive: drafts can follow the template and tone with less editing and shorter prompts; the adapter is small, versioned and removable; vLLM serves base and adapter together.

Negative: a training pipeline to maintain; training needs a GPU and approved data; the adapter must be retrained when the template or style changes; an adapter trained on one author group can copy their habits; metrics on held-out RCAs from the same template measure format, not correct root causes.

Obligations:
- Export approved RCAs to `rcas.jsonl` and map the historical spreadsheet columns (TODO: needs a copy of the spreadsheet).
- Add eval questions that compare base and base + adapter, and record results ([run-evals](../../.claude/skills/run-evals/SKILL.md)).
- Record adapter name, base model version and training data version with each run, and re-evaluate after any base model change ([ADR 0022](0022-model-routing.md)).
- Do not use unapproved or ticket-only text as `response` data.
- Update [models](../architecture/models.md) and [llm-serving](../architecture/llm-serving.md) when the first adapter ships.

## When to revisit
The adapter does not beat the base model on the evals; there are too few approved RCAs to train on (TODO: count); the template changes often; the base model is replaced; or security rejects training on ticket data.
