# Project context pack (verbatim Part C)

> Source: Part C of `docs/gev-foundation-prompt (1).md`, copied verbatim on 2026-10-08 by foundation setup. This file is the permanent memory of these decisions. Do not edit the copied text; add corrections to `docs/context/corrections.md`.

## Part C. Context pack (source of truth)

### C1. What the product is

GEV System Delivery is a web app for a service delivery team that looks after critical infrastructure. It:

- Replaces about 30 browser bookmarks (leave, HR, ServiceNow, Jira, Slack, Box, Datadog, Splunk and others) with one place to work from.
- Tracks which snapshot is applied to each environment (PD1, PD2, MPR1, MPR2), who applied it, when, and notifies the line manager.
- Uses AI agents to turn ServiceNow (SNOW) incidents into root cause analyses (RCAs) and to spot recurring root causes across incidents.

**Problem 1: fragmentation.** Tools live as Chrome bookmarks; onboarding means sharing a bookmarks HTML file; Box is used like SharePoint; simple facts (e.g. when an environment was last restored from snapshot) are tracked nowhere; the line manager wants to be told when a snapshot is applied.

**Problem 2: missing RCAs and unseen patterns.** Incidents are SNOW tickets; on resolution engineers add comments and time taken. Not every incident has an RCA, though all should. Several years of historical incidents exist in a large spreadsheet with comments and have never been analysed. Existing RCAs are Word documents in a Box folder, all following one template. Different people resolve different tickets, so tickets with the same root cause are never recognised as the same issue; nobody knows how many hours repeated problems cost. Existing tooling does not pull from Box or ServiceNow automatically.

**Current status.** The Next.js front end is built and runs on sample (mock) data. The FastAPI backend, agents, and real ServiceNow and Box connections are not built.

**Pages** (all exist in the UI): Homepage `/` (configurable widgets stored in the browser), Environments `/environments`, Tools `/tools` (folders, search, Chrome bookmark export), RCA Insights `/rca/insights` (summary figures, agent pipeline strip, clusters, interactive charts that open the agent sidebar with context), Create RCA `/rca/create` and `/rca/create/[number]` (incident list with combinable filters; Edit RCA info side panel pre-filled from SNOW; View Word; Edit Word with TipTap; Download .docx; Upload to Box), RCA Search `/rca` (directed AI search with modes: similar incidents, who resolved, root causes, suggest a fix; filters; follow-up chat), Data sources `/rca/upload` (file upload; one-click ServiceNow and Box connect, sync, disconnect), Settings `/admin` (line manager, notification toggles), and the Agent sidebar on every page (tagged context, suggested questions, streamed answers, stop button).

**RCA template** (sections are never renamed, reordered or added to):
1. Root Cause Analysis (RCA) Report: Problem Number, Problem Statement (title)
2. Problem Statement: Problem Statement, Business Impact
3. Investigation: Timeline, Investigation, Service Restoration, Next Steps
4. Root Cause: Root Cause Code (from ServiceNow), Root Cause Details (5 Whys; a trigger such as capacity is not the root cause)
5. Mitigation: preventive actions, plan if in progress, workaround, or why there is no solution
6. Corrective Actions: table of Number, Action, Owner, Due Date, State (6 rows)

**The RCA story:** an incident is resolved in ServiceNow → it appears in Create RCA as "Needs RCA" → the agent pre-fills what SNOW can answer → the engineer adds what only they know → reviews the Word document → uploads to Box → Box feeds Insights and Search.

**Frontend stack (exists):** Next.js 15 App Router, React 19, TypeScript, Tailwind v4, shadcn/ui, TanStack Query, Recharts, TipTap, html-to-docx. All network calls go through `src/lib/api.ts`, where `NEXT_PUBLIC_API_MODE=mock | live` switches between sample data and the real backend, so the UI does not change when the backend arrives. The endpoint list the backend must provide is in `docs/PRD.md`.

**Known gaps:** no sign-in; bookmarks and homepage widgets are stored per browser; desktop-first; AI drafts are currently rule-based; agent answers are scripted; no database, no real Box upload, no Word Online.

**Product Q&A already decided:** Box stays the store of record for RCA documents (the app reads and writes it, does not replace it). The agent drafts, the engineer completes and approves before upload. Credentials live on the backend, never in the browser.

### C2. Non-functional requirements (with reasoning)

| Requirement | Target | Why |
|---|---|---|
| Users | 200–1,000 internal | Focused internal team tool, not public traffic. Drives the choice to avoid distributed architecture. |
| Load shape | Heavily read-heavy | Engineers mostly view dashboards and search past incidents. Writes are rare but complex (AI reasoning, multi-step document generation). |
| Consistency | Eventual; 30–60 s delay from ServiceNow/Box is acceptable | Operational workflow does not need instant sync. Allows background sync instead of live calls on each page load. |
| Latency | Dashboard responses under 500 ms | The app must feel like a launchpad, and must not degrade during active incidents, which is when it is most needed. Applies to non-AI reads. |
| Durability | High; at-least-once delivery for RCA uploads to Box | RCAs are critical historical records and must never be lost in transit. |
| AI quality | Accuracy (precision) over speed | Wrong RCAs are worse than slow RCAs. Every AI-drafted RCA requires human review (human-in-the-loop). |
| Architecture style | Modular monolith, not "NASA-grade" distributed | Higher velocity, lower maintenance; engineering effort goes into agent intelligence rather than infrastructure scaling. |
| Deadline | Deployed and hosted by January 2027 | Drives build order: deploy a thin slice early, defer the hardest infrastructure (GPU) until the basics work. |

### C3. Hosting and infrastructure

- **On-premises.** The app runs on the company's internal network, on virtual machines (VMs) allocated by the IT infrastructure team, in a company server room. Capacity is requested from IT; it is not "click a button for more".
- **Requested resources:**

| Resource | Purpose |
|---|---|
| VM 1: Application server | Runs Nginx, the Next.js frontend, the FastAPI backend and the background worker (as Docker containers). |
| VM 2: Database server | PostgreSQL with the pgvector extension. |
| VM 3: Redis server | Job queue, cache and LangGraph agent state. |
| VM 4: AI model server | GPU machine running vLLM to host the private LLM (and the embedding model, TODO confirm). |
| Internal IP/DNS | Static internal addresses so the app can always find the database and other servers. |
| Firewall rules | App server may talk to DB, Redis, GPU server, and external tools (ServiceNow, Box). |

- **"Sparse server":** the manager used this phrase. Its meaning is unknown. TODO: confirm with manager whether this means one dedicated VM or the four above.
- **Environments:** local (developer laptop with Docker Compose running Postgres + pgvector and Redis), staging (test VM), production. Changes are tested on staging before production.
- **Deployment model:** code is packaged as Docker images. Docker is packaging, not a deployment step: it makes the app run the same on a laptop and on a VM. IT helps place containers onto the assigned VMs.
- **Backups:** previously handled by Supabase; now someone must own them. TODO: confirm backup owner and schedule with IT.

### C4. How the backend talks to the database (developer's mental model, keep this in docs)

- The database runs on its own server (VM 2). PostgreSQL stores tables as binary files on that server's disk; only PostgreSQL can read them. FastAPI runs on a different server and knows only the database's network address.
- **Connection string** (in `.env`, never in Git): address, port, database name, username, password.
- **SQLAlchemy** translates Python classes and objects into SQL.
- **Engine:** a connection pool, a set of open "phone lines" to the database, reused for speed.
- **Session:** one unit of work. Open, do the work (e.g. save an RCA), `commit()`, close.
- **Alembic migrations** live in Git and define every table change. A new engineer runs `alembic upgrade head` and gets the full schema. Every schema change goes through a migration; nobody edits tables by hand.
- **Comparison with the developer's previous stack:** Supabase was also Postgres on a remote server reached by a URL in `.env`. The differences now: the server is internal, Python uses SQLAlchemy instead of the Supabase JS client, Supabase migrations become Alembic migrations, and backups are no longer automatic.

### C5. Backend architecture

**Request flow:** Browser → Nginx (HTTPS, routing, rate limiting) → Next.js (pages) and FastAPI `/api/v1` (data) → services → Postgres / Redis / vLLM. Background worker processes jobs from Redis: ServiceNow sync, Box sync, Box uploads, embedding.

**Agents (LangGraph, each a node in a graph, state passed between them):**
- **Ingest:** pulls ServiceNow tickets, Box RCA documents, and uploaded files (historical spreadsheet, logs, post-mortems).
- **Embed:** chunks text and converts chunks to vectors with an embedding model; stores them in pgvector.
- **Cluster:** groups incidents by root cause.
- **Impact:** estimates hours spent per cluster and hours a permanent fix would save.
- **Advisor:** answers questions, powers Search, drafts RCAs.

Design note to record: not every "agent" needs an LLM. Embed is an embedding model call; Cluster can be a clustering algorithm over vectors (algorithm TODO) with the LLM only naming clusters; Impact is mainly arithmetic over recorded hours. Using the LLM only where reasoning is needed improves accuracy, speed and GPU load. Document this in each agent doc.

**RAG (retrieval-augmented generation):** chunk incidents and RCAs → embed → store in pgvector → for each question, retrieve the most relevant chunks (filtered by date, project, status etc. using normal SQL) → put them in the prompt → the model answers citing those incidents.

**Structured output:** the RCA template is defined as a Pydantic model; the LLM is required to return every section in that shape, so drafts cannot skip or rename sections.

**Pydantic** is used for: API request/response validation (FastAPI rejects bad data and generates OpenAPI docs), LLM structured output, and settings (reading `.env` and failing at startup if something is missing).

**Inference:** vLLM, OpenAI-compatible API at `http://<internal-ip>:8000/v1`. Example from notes: `docker run --gpus all -p 8000:8000 vllm/vllm-openai:latest --model meta-llama/Llama-3.1-8B-Instruct`. Model choice is TODO.

**Memory facts for the GPU:** an 8B-parameter model needs roughly 16 GB of GPU memory at full (16-bit) precision; roughly 5–6 GB when 4-bit quantised. Extra memory is needed for the KV cache, which grows with the number of concurrent requests and context length. Parallel agents do not multiply model memory, but they do need KV cache headroom. Monitor vLLM KV cache utilisation in production. Typical GPUs: NVIDIA L4 (24 GB), A100 (40 or 80 GB). TODO: confirm GPU with IT.

**Quantisation:** not done by us. Download a model already quantised (AWQ or GPTQ versions on Hugging Face) if memory requires it. Note: the GPU server is on-prem, so model weights must be downloaded or transferred in. TODO: confirm with IT whether the server can reach Hugging Face.

**Evaluation:** a set of about 30 real questions with known answers from past incidents, kept in `backend/evals/`, run after every change to a prompt, chunking strategy, embedding model or LLM. This is how accuracy is proven rather than assumed.

**Streaming:** the agent sidebar streams answers over SSE. Data pages use normal HTTP with TanStack Query refetching about every 30 seconds.

### C6. Decisions and full reasoning (feeds Part D phase 3)

The ADR list and reasoning are in Part D, phase 3. Use all of it.

### C7. Build order (agreed)

**The current order is the developer's `docs/build-plan.md`, which uses a walking skeleton:** a tiny end-to-end backbone first (Docker Postgres and Redis, FastAPI `/health`, frontend showing system status), then CI, then deploying the backbone to staging and production, then throwaway risk experiments (ServiceNow fetch, Box upload, local-model RAG over 10 incidents), then features one vertical slice at a time, then AI features, then hardening, then launch. Tests are written one at a time alongside each piece of code. The pipeline starts minimal and gains checks as the app grows. Where the list below differs, the build plan wins. The list is kept for the reasoning it contains.

1. **Local foundation:** Docker Compose with Postgres + pgvector and Redis; bare FastAPI with `/health` that checks both; pytest; CI pipeline running lint, type-check and tests on every pull request.
2. **Database:** SQLAlchemy models and Alembic migrations for incidents, RCAs, environments, snapshots, tools, users, embeddings, derived from `docs/PRD.md`. Tests per endpoint as built.
3. **Connect the frontend:** switch `src/lib/api.ts` to live mode one endpoint at a time, starting with non-AI pages (Environments, Tools, Settings).
4. **Auth:** company sign-in (method TODO with IT). Must exist before real data is on a server.
5. **First deploy (target early November 2026):** Docker images on the VM, Nginx in front, staging environment. Doing this early protects the January date because unfamiliar problems (firewalls, DNS, env vars) surface while the system is small.
6. **ServiceNow and Box:** background worker on the Redis queue; Box uploads with retries for at-least-once delivery.
7. **Agents:** LangGraph pipeline; real open model on vLLM (or, only if policy allows, a hosted API during development with the same code and a different `base_url`).
8. **Streaming:** SSE for the agent sidebar.
9. **Hardening (December 2026):** caching where reads are slow, monitoring, backups, load test against the 500 ms target.

Design phase is capped at about one week. The existing UI is treated as a prototype that helped discover requirements.

### C8. Engineering practices (agreed)

- **References:** The Twelve-Factor App (12factor.net); the official Full Stack FastAPI Template (github.com/fastapi/full-stack-fastapi-template) as the model for backend layout and habits.
- **Git:** never commit to `main`; every change is a branch and a pull request, reviewed before merge (the `code-reviewer` agent can review).
- **CI:** runs lint, type-check and tests on every pull request; merges are blocked if anything fails. Platform TODO (GitHub Actions or company equivalent).
- **Tooling:** Ruff and mypy for Python; ESLint and Prettier for TypeScript; pre-commit hooks run them before each commit.
- **API contract:** FastAPI generates OpenAPI from Pydantic models; frontend TypeScript types are generated from it (e.g. openapi-typescript) so frontend and backend cannot silently disagree. Routes under `/api/v1`. One consistent error format everywhere.
- **Secrets:** never in Git. `.env.example` lists names only. Production secrets wherever IT keeps them (TODO).
- **Testing pyramid:** many unit tests, fewer integration tests (against real Postgres in Docker), a handful of Playwright end-to-end tests, plus AI evals.
- **Observability:** structured logs, `/health` endpoint, error alerts.
- **Rule of thumb:** if something must happen every time, automate it with CI. If it needs judgement, use an agent. If people need to read it, write a document.
- **Skills vs docs:** a skill is made per repeatable *task*, not per technology. Conventions for a technology (e.g. how Redis keys are named) go in a doc; repeatable procedures (e.g. "add a background job") become skills.
- **Skills vs agents:** a skill is instructions loaded into the current session (procedures). A subagent runs in a fresh context (independent review). Only reviewers are agents, because the session that wrote code should not mark its own work.
- **Preventing AI hallucination in development:** one source of truth (`docs/`, PRD); instructions say "read these files first"; claims must cite file and line; "if it is not documented, ask, do not guess"; tests and CI catch invented code; the human reviews every pull request.
- **Three things that matter most:** CI that blocks bad merges, migrations for every database change, and a staging environment.

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

### C10. Open questions (all become TODOs; collect in docs/context/open-questions.md)

| Question | Who |
|---|---|
| Auth method (likely Microsoft Entra ID / SSO) | IT |
| Meaning of "sparse server"; number of VMs | Manager / IT |
| GPU model and memory | IT |
| Can the GPU server download from Hugging Face? | IT |
| LLM choice and size | You, after evals |
| Embedding model choice; served by vLLM or separately | You |
| Clustering algorithm | You |
| CI platform | IT / team |
| Backup owner and schedule | IT |
| Where production secrets are stored | IT |
| Is any external AI API allowed during development? | Manager / security |
| ServiceNow and Box API access, credentials, rate limits | ServiceNow / Box admins |
| Sync interval for ServiceNow and Box | You (within 30–60 s consistency target) |
| arq vs Celery for the job queue | You |
| LangGraph state in Redis or Postgres checkpointer | You |
| Redis persistence (AOF/RDB) settings | You / IT |
| Is collaborative RCA editing wanted? (would change ADR 0004) | Team |
| How the line manager is notified (email, Teams, in-app) | Manager |

---

### C11. Additional context (agents, models, rate limiting, resilience, scaling, CI/CD)

#### C11.1 What an agent is in this system

An agent does not just answer once; it loops until a task is complete. LangGraph models this as a directed graph:

- **Nodes:** functions (the agents or steps).
- **Edges:** paths between nodes, including conditional paths.
- **State:** shared memory, like a whiteboard, that moves with the work from node to node. One agent writes to it; the next reads from it.

Real work is not linear, and the graph allows three things a simple input → AI → output chain cannot:

- **Loop back:** "the data looks wrong, research again."
- **Branch:** "if urgent, route one way; if routine, another."
- **Wait:** "pause until the user clicks Approve" (LangGraph interrupts). This is how mandatory human review of RCAs (ADR 0012) is implemented.

Writing this as plain if/else code becomes unmanageable quickly. LangGraph tracks where the work is, what has already been done and what comes next, and with a checkpointer it can resume after a failure rather than start again. The handoff pattern Research → Approval → Execution maps directly onto the RCA flow: Draft → Human review → Upload to Box.

#### C11.2 RAG is built before agents

Every agent depends on retrieval, so the RAG layer (load → chunk → embed → store → search) is built and tested on its own first, with eval questions measuring whether the right incidents come back. Only then are agents built on top.

Ingestion and querying are separate. Ingestion is a **background job that runs continuously**, because ServiceNow and Box keep changing; it is not a one-off script. At question time, only the question is embedded; the stored vectors are searched in pgvector. (A source note used FAISS saved to a local folder with OpenAI embeddings; this is not used. See C12.)

#### C11.3 Choosing models by task (model routing)

Different tasks need different models:

| Task | Needs | Model approach |
|---|---|---|
| Embeddings | Consistency, not intelligence | Local embedding model. Candidate: `nomic-embed-text` (TODO: choose after evals) |
| Simple tasks: categorise, summarise, name clusters | Moderate quality | A smaller local model may be enough |
| Reasoning: planner deciding the workflow, RCA drafting, 5 Whys suggestions, Advisor answers | Highest reasoning quality | The strongest model available. A hosted "premium" API was suggested for the planner; allowed only if security approves sending ticket data externally (TODO). Otherwise the largest model the GPU can serve |

Embedding rules: the **same embedding model must be used for ingestion and for queries, in every environment**. Vectors from different models cannot be compared. Changing the embedding model means re-embedding all data. Store the model name and version with every vector. Every routing choice is validated with evals per task.

#### C11.4 Ollama and vLLM reconciled

- **Ollama on the developer laptop** for local development: easy to install, OpenAI-compatible endpoint.
- **vLLM on the GPU server** for staging and production, for concurrency (ADR 0008).
- The code uses an OpenAI-compatible client with `base_url` and model name from settings, so switching is configuration only.
- Model builds can differ slightly between Ollama and vLLM, so **evals must pass against staging (vLLM)** before release.
- The embedding model is identical everywhere (C11.3).

#### C11.5 Where agents run

- **Interactive work runs in the API process and streams over SSE:** Advisor answers in the sidebar and Search, and a single RCA draft when the user clicks.
- **Long or batch work runs in the background worker from the queue:** Ingest, Embed, Cluster, Impact, and bulk drafting for historical incidents.
- The strategy notes proposed sending every RCA flow to a queue. Interactive flows stay in the API so the user sees streaming. If drafting proves too slow, it moves to the worker with progress streamed. TODO: decide after measuring.

#### C11.6 Rate limiting: two tiers

**Algorithms (explain in the docs):**
- **Token bucket:** a bucket of N tokens refilling at a steady rate; each request takes one; empty means rejected. Allows short bursts.
- **Fixed window:** N requests per minute, resetting each minute. Simple but choppy: all N can arrive in one second, then nothing for 59.
- **Leaky bucket:** requests flow out at a fixed, steady rate whatever the arrival speed. Smooth.
- **Sliding window:** a smoother version of fixed window.

**Tier 1, ingress (protects our app from overload):**
- Nginx `limit_req` per user or IP. Nginx implements a leaky bucket with a burst allowance, which tolerates short bursts such as a manager refreshing dashboards during a major incident.
- Stricter per-user limits on expensive AI endpoints in FastAPI, stored in Redis (library TODO: fastapi-limiter or slowapi), so one user cannot saturate the GPU.

**Tier 2, egress (protects ServiceNow and Box, and our access to them). This is the more critical tier:**
- Every ServiceNow and Box call goes through a limiter set below that service's quota (quotas TODO from admins). A steady, leaky-bucket style outflow suits background sync.
- Handle HTTP 429 responses and honour `Retry-After`.
- If more than one process calls the same service, the counter must be shared in Redis; otherwise each process counts separately and traffic multiplies.
- **Why it matters:** an agent loop or retry storm could exceed ServiceNow's limits and get the service account blocked, leaving the app blind until IT unblocks it. Agent loops and retries are therefore also capped (C11.7).
- Only ServiceNow and Box are API integrations; the ~30 team tools are links (C12).

#### C11.7 Resilience patterns

- **Sync engine:** pages read from Postgres and Redis, never live from external systems (ADR 0010).
- **Timeouts** on every external call.
- **Circuit breakers** on each integration: after repeated failures, stop calling for a cool-down period, serve the last synced data with "last synced X ago" shown in the UI, then probe before resuming.
- **Idempotency** on every write and write-back, so retries never create duplicates.
- **Graceful degradation:** the dashboard keeps working when ServiceNow, Box or the GPU server is down. AI features show a clear "AI unavailable" state; non-AI pages are unaffected.
- **Fail fast:** clear feedback in the UI, never an endless loading spinner.
- **Agent safeguards:** maximum iterations (LangGraph recursion limit), a timeout per node, bounded retries, checkpointing so a failed run resumes, and de-duplication so the same RCA task is never processed twice at once.

#### C11.8 Statelessness and the scaling path

- Backend instances keep **no local state**: sessions, tokens and temporary state live in Redis or Postgres. Uploaded files are not stored on the app VM's local disk (storage location TODO). This costs little now and is required before a second instance can ever be added.
- Scaling path, **not built now** (ADR 0001): second app VM behind Nginx upstream load balancing → container orchestration (e.g. Kubernetes) with autoscaling and a layer-7 load balancer → splitting services. The strategy notes proposed Kubernetes, autoscaling and an L7 load balancer from the start; this is deferred (C12).

#### C11.9 Observability

- Structured JSON logs with a request ID on every line.
- OpenTelemetry tracing across API → services → agents → integrations, with trace IDs passed into background jobs.
- LLM and agent tracing: each node's inputs, outputs, token counts and latency. Candidate: self-hosted Langfuse (TODO). It must be self-hosted to keep data on-prem.
- Metrics: request latency (p95 against 500 ms), queue depth, failed jobs, circuit breaker state per integration, GPU memory and KV cache use.

#### C11.10 CI/CD with GitHub Actions

**CI: runs on every pull request and every push.**
- Frontend: `npm ci`, lint, type-check, build, unit tests.
- Backend: Ruff lint, Ruff format check, mypy, pytest unit tests; integration tests with Postgres (pgvector image) and Redis as **service containers**; `alembic upgrade head` on an empty database; `alembic check` to catch model changes without a migration.
- Contract: regenerate the TypeScript types from OpenAPI and fail if they differ from the committed ones.
- Docker: build all images (not pushed on pull requests).
- Security: dependency audit (`pip-audit`, `npm audit`), secret scanning (gitleaks), optionally CodeQL.
- These jobs are **required status checks**; `main` is protected and needs a reviewed pull request.
- Dependabot keeps dependencies updated.

**CD: runs after merge.**
- On merge to `main`: build images tagged with the git commit SHA, push to the container registry (TODO: GitHub Container Registry or an internal registry), deploy to staging, run migrations, smoke tests, then Playwright end-to-end tests against staging.
- Production: a separate workflow using a GitHub **Environment with required reviewers** (manual approval). It promotes **the same image SHA** that passed staging; images are never rebuilt for production. Then migrations and smoke tests.
- Rollback: redeploy the previous SHA.
- **On-prem constraint:** GitHub's hosted runners cannot reach internal VMs. Deployment needs either a **self-hosted runner inside the company network** or an IT-managed tool that pulls the images. TODO with IT.

**Evals workflow:** manual trigger, and on pull requests labelled `ai`. It needs model access, so it likely runs on a self-hosted runner. Results are stored and compared with the previous run.

**Secrets:** in GitHub Environment secrets or the company vault, never in workflow files.

TODO: confirm the repo is on GitHub (or GitHub Enterprise) and that Actions and self-hosted runners are allowed.

#### C11.11 Build order note

A source note says to build the backend first because a UI with no backend is "hollow". The UI already exists. The agreed approach is vertical slices (one feature through every layer), which delivers real backend value without leaving the UI disconnected.

#### C11.12 Possible extra integrations

The strategy notes mention Smartsheet, Outlook, WFH rosters and "20+ services". The README scope is ServiceNow and Box only. TODO: confirm scope with the manager. Do not design for the extras until confirmed; the `new-integration` skill makes adding them later straightforward.

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

### C13. Additional open questions (append to docs/context/open-questions.md after C10)

| Question | Who |
|---|---|
| Are Smartsheet, Outlook or WFH rosters in scope? | Manager |
| Is the repo on GitHub or GitHub Enterprise? Are Actions and self-hosted runners allowed? | IT |
| Container registry: GitHub Container Registry or internal? | IT |
| Where are uploaded files stored (not the app VM's disk)? | You / IT |
| Self-hosted agent tracing tool (Langfuse or other) | You |
| Embedding model (nomic-embed-text candidate) | You, after evals |
| Ingress limiter library: fastapi-limiter or slowapi | You |
| Egress limits per integration | You, once quotas are known |
| Interactive RCA drafting in the API or the worker | You, after measuring |
| Is a hosted API allowed for the planner model? | Security |
