# Corrections to earlier notes

> Part C wins over source notes (rule A2). Items 1-11 are C9 and items 12-21 are C12, copied verbatim from the foundation prompt (2026-10-08).

### C9. Corrections to earlier notes (record all in docs/context/corrections.md)

1. **Pinecone vs pgvector:** an early architecture note names Pinecone; the VM plan names pgvector. Decision: Postgres + pgvector (ADR 0005).
2. **"8B model takes ~6 GB VRAM":** that is the 4-bit quantised size. At 16-bit precision it is about 16 GB.
3. **"vLLM maintains sub-500 ms dashboard responses":** dashboards must not depend on the LLM at all. The 500 ms target applies to non-AI reads served from Postgres/Redis. vLLM's benefit is concurrency for AI features.
4. **"On-prem is safer and faster than the cloud":** safer in the sense that ticket data stays on the company network; not inherently faster, and less elastic.
5. **"Use WebSockets for the agent sidebar and real-time notifications":** both needs are one-way, server to browser, which SSE handles. Decision: SSE (ADR 0004). Also, the WebSocket "memory overhead" argument applies equally to SSE (both hold an open connection); at 1,000 users this cost is small either way.
6. **"API Gateway" box in the diagram:** fulfilled by Nginx (routing, TLS, rate limiting) plus FastAPI authentication middleware. No separate gateway product.
7. **Load balancer:** not needed with one app server. Nginx can load balance if a second app server is added.
8. **"Redis state lets workflows survive failures":** only if Redis persistence is configured (TODO). Durable records (RCAs, incidents) always live in Postgres; Redis holds only things that can be rebuilt or retried.
9. **"3 agents running in parallel":** the pipeline has five agents. Concurrency means several agent calls and several users hitting vLLM at once.
10. **"Sparse server":** not a standard term; meaning unconfirmed.
11. **Fine-tuning and quantisation as required steps:** neither is required. RAG supplies knowledge; prompts and structured output enforce the template; pre-quantised models are downloaded if needed (ADR 0009).

### C12. Additional corrections (append to docs/context/corrections.md after C9)

12. **FAISS saved to a local folder with OpenAI embeddings:** not used. pgvector in Postgres with a local embedding model. A FAISS file lives on one machine, isn't shared between servers, and isn't backed up with the database.
13. **"Run the ingestion script once":** ingestion is a continuous background job, because ServiceNow and Box keep changing.
14. **"Move to Ollama":** Ollama for local development only; vLLM for staging and production (ADR 0008, ADR 0023).
15. **"Premium hosted API for the planner":** only if security approves sending ticket data externally.
16. **"30+ external tools with API limits":** only ServiceNow and Box are API integrations. The other tools are links.
17. **"Horizontal scaling with Kubernetes autoscaling and an L7 load balancer":** deferred. The stateless design keeps that path open.
18. **"RabbitMQ or Temporal":** Redis-backed queue chosen (ADR 0006, ADR 0010). Temporal is recorded as an alternative.
19. **"Sub-millisecond response times":** cache lookups are fast, but whole page responses are realistically tens of milliseconds. The target is under 500 ms.
20. **"fastapi-limiter, in-memory":** it stores counts in Redis, and it limits requests coming *into* our API (ingress). Calls going *out* to ServiceNow and Box need their own limiter in the integration clients (egress).
21. **"Build the backend first, UI first is hollow":** vertical slices instead, since the UI already exists.

## Added by foundation setup (2026-10-08): conflicts found in the repo

22. **Build Release Progress page is missing from the foundation prompt.** `docs/PRD.md` §5.10 defines `/build-release` and `/build-release/[env]` (PD1, PD2, MPR1 ticket progress) and the endpoint `GET /release/environments`; `src/app/(app)/build-release/` and `src/lib/api.ts` (`releaseEnvs`) implement it on mock data. Prompt C1 does not list it. Treated as in scope because the PRD is the product specification. Backend data source for tickets is TODO: confirm with manager (Jira? ServiceNow?).
23. **`GET /rca/reports/{number}/word-url` is used by `src/lib/api.ts` (`wordOnlineUrl`) but is not in the PRD §7 table.** `docs/PRD.md` is read-only, so it is recorded in `docs/architecture/api.md` and listed here as a suggested PRD addition for the developer.
24. **RCA status vocabulary differs.** Prompt C-lifecycle (database.md instructions): Needs RCA → Draft → Approved → Uploading → In Box (plus Upload failed). `src/lib/types.ts` has `RcaStatus = "none" | "draft" | "published"`, and the UI labels are Needs RCA / Draft / In Box. The backend lifecycle is a superset; the API must map it to the frontend values (or the types must be extended together with the PRD). Not resolved here.
25. **PRD §5.9 and §5.10 are numbered out of order** (Build Release Progress is 5.10 but appears before Admin 5.9). Cosmetic. Suggestion only.
26. **`next.config.ts` rewrites only `/api/v1/*`, and only when `API_URL` is set.** Build plan 1.5 also needs `/health` forwarded. Suggestion for the developer (protected file `next.config.ts` was not edited).
27. **`API_URL` and `NEXT_PUBLIC_API_MODE` are the only names in `.env.example`.** Backend settings names (database URL, Redis URL, model `base_url`, etc.) do not exist yet and are TODO when the backend is built.
28. **`docs/build-plan.md` says the foundation prompt creates skills including `code-reviewer`, `security-reviewer` as agents and mentions `docs/adr/README.md` listing 26 ADRs.** Consistent with this prompt; no conflict. `docs/commands.md` says the eval command is set in "step 6.2" while `build-plan.md` creates evals in step 6.1. Suggestion: fix the step number in `docs/commands.md`.
