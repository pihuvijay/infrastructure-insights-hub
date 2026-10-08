# ADR 0009: RAG over fine-tuning; no in-house quantisation
Status: Accepted
Date: 2026-10-08
Related docs: [rag](../architecture/rag.md), [models](../architecture/models.md), [testing](../testing.md), [agents/advisor](../architecture/agents/advisor.md)

## Context
The system needs the team's knowledge: past incidents, RCAs, who fixed what. It does not need the model to learn a new behaviour. The RCA template must be followed exactly. Accuracy matters more than speed ([requirements](../requirements.md)). Early notes treated fine-tuning and quantisation as required steps ([corrections](../context/corrections.md) item 11).

**RAG (retrieval-augmented generation)** gives the model knowledge at question time: chunk incidents and RCAs, embed, store in pgvector, retrieve the most relevant chunks, put them in the prompt, and have the model answer citing those incidents. Knowledge updates as data syncs. **Fine-tuning** changes behaviour: it needs labelled data, GPU time and its own evaluation, and the knowledge goes stale as new incidents arrive.

## Decision
Use RAG for knowledge. Enforce the RCA template with prompts, Pydantic structured output (the template is a Pydantic model, so every section is returned in order) and example RCAs from Box. Do not fine-tune. Do not quantise in-house; if memory requires it, download a model already quantised (AWQ or GPTQ). Prove accuracy with about 30 eval questions.

## Alternatives considered
**Fine-tuning.** Strengths: can bake in style and format and reduce prompt length. Why it lost: heavy cost, labelled data needs, stale knowledge, and the same template adherence is achievable with structured output.

**Prompt-only with no retrieval.** Strengths: simplest. Why it lost: the model does not know our incidents and would invent answers.

**In-house quantisation.** Strengths: custom fit to GPU memory. Why it lost: pre-quantised models already exist and the work is not core.

## Consequences
Positive: knowledge stays current; no training pipeline; cheaper and easier to evaluate; citations back to real incidents reduce invented answers.
Negative: answer quality depends on retrieval quality (chunking, embedding, filters); prompts get long.
Obligations: the evals in `backend/evals/` run after every change to prompts, chunking, embedding model or LLM; retrieval is built and tested before agents.

## When to revisit
Evals show repeated failures that prompting and retrieval cannot fix.
