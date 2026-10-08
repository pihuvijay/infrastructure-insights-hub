# GEV System Delivery: Engineering Foundation Prompt

## Before you run this (for you, not for Claude Code)

1. Create the folder `docs/context/source/` in your repo.
2. Paste every source note you have into it as separate files, **unedited**:
   - `readme-product.md` (the product README)
   - `scope-and-architecture-qa.md` (scope Q&A, high-level architecture Q&A, the "golden order" notes)
   - `vm-and-vllm-notes.md` (VM resource table, Ollama vs vLLM notes)
   - `on-prem-and-database-notes.md` (filing cabinet / robot explanation, SQLAlchemy, Alembic)
   - `websocket-notes.md` (WebSocket vs HTTP explanation)
   - `rate-limiter-notes.md` (token bucket, leaky bucket, ingress vs egress)
   - `engineering-strategy.md` (horizontal scaling, sync engine, circuit breakers, OpenTelemetry)
   - `agents-langgraph-rag-notes.md` (what an agent is, LangGraph, RAG, Ollama vs API models)
3. Commit them. They are the raw record. The prompt below tells Claude Code never to edit them.
4. Open Claude Code at the repo root and paste everything below the line.
5. If Claude Code runs out of room partway, start a new session and say: "Continue the foundation prompt from Phase N. Read docs/context/progress.md first."

---

# PROMPT START

You are setting up the engineering foundation (documentation, architecture decision records, skills and review agents) for the **GEV System Delivery** repository. This work must capture the full reasoning behind every decision so that a new engineer, or a future AI session, can understand not just *what* was decided but *why*, *what else was considered*, and *when to reconsider*. Thoroughness matters more than brevity here.

## Part A. Rules you must follow

### A1. Never destroy or overwrite existing information

- Before writing any file, check whether it already exists.
- If it exists: **read it completely**, then **add to it**. Never delete, shorten or reword existing content. Put new material under a clearly marked new heading such as `## Added by foundation setup (YYYY-MM-DD)`.
- If new content conflicts with existing content, **do not resolve the conflict yourself**. Keep both, add a `> CONFLICT:` note explaining the difference, and list it in the final report.
- Never move, rename or delete any existing file or folder. This includes `src/`, `docs/PRD.md`, `docs/checklists/`, `CLAUDE.md`, `AGENTS.md`, `.devin/skills/`, `.devin/agents/`.
- Never edit anything in `docs/context/source/`. Those are raw records.
- Work on a new branch called `docs/foundation`. Never commit to `main`.
- Commit after each phase with a message like `docs(foundation): phase 3 ADRs`.
- Keep a running log at `docs/context/progress.md`: which phases are done, which files were created or appended, open conflicts. Update it at the end of every phase.

### A1b. Protected files (these hold important frontend and product information)

These files already exist and contain information that must not be lost:
`docs/PRD.md`, `CLAUDE.md`, `AGENTS.md`, `README.md`, everything in `docs/checklists/`, everything in `.devin/`, everything in `src/`, `.env.example`, `package.json`.

Rules for them:

1. **`docs/PRD.md` is read-only.** It is the product specification and API contract. Never edit it. If backend work needs to record something about the API, write it in `docs/architecture/api.md` and link to the PRD section it relates to.
2. **`CLAUDE.md`, `AGENTS.md` and `README.md` are append-only.** Never use a whole-file write on them. Only add new content **at the end of the file**, under a heading `## <Section name> (added YYYY-MM-DD by foundation setup)`. Do not edit, reorder, reword or reformat any line above it, including whitespace and headings.
3. **`docs/checklists/`, `.devin/`, `src/`, `package.json`, `.env.example` are read-only** for this task. Read them for context only.
4. **Before touching any protected file**, record its current line count in `docs/context/progress.md`.
5. **After touching it**, run `git diff --numstat <file>`. The deletions column must be `0`. If it is not, revert your change to that file with `git checkout -- <file>` and append again correctly.
6. If you believe something in a protected file is wrong or outdated, **do not fix it**. Add it to `docs/context/corrections.md` as a suggestion for the developer.

### A2. Do not invent facts

- Only state facts that appear in Part C of this prompt, in `docs/context/source/`, or in existing repo files (README, PRD, CLAUDE.md, AGENTS.md, code).
- Where a fact is unknown, write `TODO: confirm with <who>` and add it to the open questions list. Do not fill gaps with plausible guesses.
- Where Part C and a source note disagree, Part C wins (Part C includes deliberate corrections, listed in C9). Record the disagreement in `docs/context/corrections.md`.
- When describing existing code, name the file you read. If you have not read it, do not describe it.

### A3. Write with full reasoning, not summaries

- Do not compress reasoning into one-liners. Each decision must explain the problem, the forces involved, the options, why each option won or lost, and the consequences.
- Use plain English. Short sentences. Define jargon the first time it appears in each file (for example: "SSE (Server-Sent Events): an HTTP response the server keeps open and keeps writing to").
- Use Mermaid for every diagram.
- Every architecture doc must link to its related ADRs near the top. Every ADR must link to the architecture docs it affects.
- Do not write application code. Folder skeletons, README placeholders, and short illustrative snippets inside docs are fine.

## Part B. Phases (do them in order)

0. Inventory the repo and save the context pack
1. Folder skeleton
2. Architecture and supporting docs
3. ADRs
4. Skills
5. Review agents
6. CLAUDE.md and AGENTS.md additions
7. Self-check and final report

Detailed instructions for each phase are in Part D, after the context.

---

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

## Part D. Phase instructions

### Phase 0. Inventory and context pack

1. Read, in full: `README.md`, `docs/PRD.md`, `CLAUDE.md`, `AGENTS.md`, everything in `docs/` (including `docs/checklists/`), everything in `.devin/skills/` and `.devin/agents/`, everything in `docs/context/source/` if it exists, `src/lib/api.ts`, the mock data and types in `src/lib/`, `package.json`, `.env.example`.
2. Write `docs/context/repo-inventory.md`: what exists, with file paths; what each existing skill/agent in `.devin/` does; which endpoints `api.ts` and the PRD define; the data types in `src/lib/`.
3. Write `docs/context/project-context.md` containing **all of Part C, verbatim**, under a heading noting it came from this prompt and its date. This file is the permanent memory of these decisions.
4. Write `docs/context/corrections.md` (C9 and C12 in full, plus any further conflicts you find between sources).
5. Write `docs/context/open-questions.md` (C10 and C13, plus any new unknowns you find).
6. Create `docs/context/progress.md`.

### Phase 1. Folder skeleton

Create the following only if they do not exist. Put a `README.md` in each describing what belongs there, what does not, and which doc or skill governs it.

```
backend/
  app/
    api/v1/        HTTP routes only; no business logic
    schemas/       Pydantic request/response and LLM output models
    models/        SQLAlchemy table classes
    services/      business logic; called by routes and workers
    agents/        LangGraph graph and one module per agent
    integrations/  ServiceNow and Box clients
    workers/       background job definitions
    core/          config, database engine/session, auth, logging
  alembic/
  tests/unit/
  tests/integration/
  evals/           AI evaluation questions, expected answers, results history
infra/
  nginx/
docs/
  architecture/agents/
  adr/
  context/
```

Do not move the existing Next.js app. Add to `docs/context/open-questions.md`: "Should the frontend move into `frontend/`? Decide later; moving it affects build config."

### Phase 2. Architecture and supporting docs

Each file starts with: purpose of the doc, a "Related ADRs" list with links, and "Last updated". Each must explain *how* the thing works in full detail. Reasoning about *why* belongs in ADRs, with links.

- `docs/requirements.md`: C2 in full, including the "why" column, plus functional requirements per page from C1.
- `docs/architecture/high-level.md`: Mermaid component diagram (Browser, Nginx, Next.js, FastAPI, worker, Postgres+pgvector, Redis, vLLM, ServiceNow, Box); table of which VM runs what (C3); request flow in steps; the three planes (presentation, reasoning, data) and why they are separated; data flow from sources through the five agents to Insights, Search and Create RCA.
- `docs/architecture/database.md`: C4 in full (mental model, connection string, engine, session, Alembic, Supabase comparison); Mermaid ER diagram of draft tables implied by the PRD and mock types (incidents, rcas, rca_corrective_actions, environments, snapshots, tools, tool_folders, users, uploads, connections, embeddings/chunks, clusters). Mark the schema as DRAFT. Explain the RCA status lifecycle (Needs RCA → Draft → Approved → Uploading → In Box, with Upload failed).
- `docs/architecture/flows.md`: Mermaid sequence diagrams with step explanations for (a) resolved incident → sync → Needs RCA → AI draft → human edits → approval → Word → queued Box upload with retries → In Box; (b) RCA Search with filters, retrieval and streamed answer; (c) ServiceNow sync job; (d) snapshot logged → manager notified; (e) chart click → agent sidebar with context.
- `docs/architecture/agents/README.md` plus `ingest.md`, `embed.md`, `cluster.md`, `impact.md`, `advisor.md`. Each must have: Purpose; Inputs (with Pydantic shape described); Outputs; Whether it uses the LLM and why; Model; Prompt location; State read and written; Failure handling and retries; How it is tested (unit tests and eval questions); Open questions.
- `docs/architecture/rag.md`: full RAG pipeline: chunking, embedding, storage, retrieval with SQL filters, prompt assembly, citations back to incidents, evaluation set, and why RAG not fine-tuning (link ADR 0009).
- `docs/architecture/llm-serving.md`: vLLM, OpenAI-compatible API, the docker command, GPU memory facts, quantisation, KV cache monitoring, model choice TODO, how to switch `base_url`.
- `docs/architecture/redis.md`: Redis's three jobs (queue, cache, agent state), for each: what is stored, key naming convention, TTL (TODO values), what happens if Redis restarts. State clearly that durable data never lives only in Redis.
- `docs/architecture/streaming.md`: what HTTP request/response, polling, WebSockets and SSE each are (include the postal service / telephone call analogies from the source notes, corrected); which app features use which; SSE endpoint pattern in FastAPI; frontend hook pattern; how Stop works (browser aborts the stream; server detects disconnect and cancels the agent run; optional cancel endpoint); Nginx settings required for SSE (buffering off, timeouts).
- `docs/architecture/background-jobs.md`: job queue, retries with backoff, idempotency, failed-job handling, how at-least-once Box upload is guaranteed, arq vs Celery TODO.
- `docs/architecture/integrations.md`: ServiceNow and Box: what is pulled and pushed, sync frequency TODO, credentials location, behaviour when a service is down, the historical spreadsheet import via Data sources.
- `docs/architecture/auth.md`: current state (no sign-in), requirements (company sign-in before real data; per-user storage replacing per-browser storage for widgets and bookmarks), method TODO.
- `docs/architecture/api.md`: `/api/v1` convention, error format, OpenAPI generation, TypeScript type generation, how `src/lib/api.ts` mock/live switching works (read the file), list of endpoints from the PRD (link, do not duplicate if long).
- `docs/architecture/frontend.md`: existing stack and structure (read `src/`), TanStack Query refetching, how pages map to endpoints.
- `docs/architecture/deployment.md`: Docker images, Docker Compose files for local and production, Nginx role, environments (local, staging, production), firewall and DNS needs, step outline with TODOs.
- `docs/architecture/observability.md`: structured logging format, `/health` checks, alerts, vLLM KV cache monitoring, what to look at during an incident.
- `docs/engineering-practices.md`: C8 in full.
- `docs/build-plan.md`: **this file is written by the developer as a checkbox to-do list. If it exists, do not rewrite it.** Read it, and only append a section `## Notes from foundation setup` listing anything in C7 or the docs that the plan does not yet cover. If it does not exist, create it from C7 as a checkbox list.
- `docs/testing.md`: testing pyramid, what each layer covers, how to run each, CI behaviour, AI evals.
- `docs/security.md`: secrets, credentials only on backend, data stays on-prem, auth, logging of who approved each RCA, security review before first real-data deploy.
- `docs/runbook.md`: deploy, roll back, restore backup, rotate secrets, common failures (ServiceNow down, Box upload failing, GPU out of memory, Redis restart). Use TODO where details are unknown.
- `docs/architecture/rate-limiting.md`: C11.6 in full: the four algorithms, both tiers, where each limit is configured, what the user sees when limited, how 429 and `Retry-After` are handled, why a shared Redis counter is needed with multiple processes.
- `docs/architecture/resilience.md`: C11.7 in full: timeouts, circuit breakers (states closed, open and half-open explained), retries with backoff, idempotency, graceful degradation per page (what each page shows when ServiceNow, Box, Redis or the GPU is down), agent safeguards.
- `docs/architecture/models.md`: C11.3 and C11.4 in full: the routing table per task, embedding consistency rules, Ollama locally vs vLLM on the server, how to change a model safely (re-embed, evals, ADR).
- `docs/architecture/scaling.md`: C11.8 in full: statelessness rules, the scaling path step by step, and what would trigger each step.
- `docs/architecture/ci-cd.md`: C11.10 in full: a Mermaid diagram of the pipeline from pull request to production; a table of every workflow file (`ci.yml`, `cd-staging.yml`, `cd-production.yml`, `evals.yml`), its trigger and its jobs; required status checks; environments and approvals; the self-hosted runner constraint; image tagging and promotion; rollback; secrets handling.
- In `docs/architecture/agents/README.md`, include C11.1 (what an agent is; nodes, edges, state; loop, branch, wait) and C11.5 (which agents run in the API and which in the worker).
- In `docs/architecture/rag.md`, include C11.2 (RAG before agents; continuous ingestion vs query time).
- In `docs/architecture/observability.md`, include C11.9 in full.
- In `docs/architecture/integrations.md`, include egress rate limiting, circuit breakers and C11.12.
- `docs/glossary.md`: every term used across the docs (ADR, SSE, WebSocket, RAG, embedding, vector, pgvector, LangGraph, node, state, vLLM, continuous batching, KV cache, quantisation, AWQ, GPTQ, Pydantic, SQLAlchemy, engine, session, Alembic, migration, OpenAPI, CI, staging, idempotency, at-least-once, eventual consistency, modular monolith, human-in-the-loop, and any others).

### Phase 3. ADRs

Create `docs/adr/README.md` explaining what ADRs are (format from Michael Nygard's 2011 "Documenting Architecture Decisions", extended here with alternatives and revisit triggers), the rule that ADRs are never edited after acceptance except to change status, and that a changed decision is a new ADR marked "Supersedes ADR NNNN". Include an index table.

Use this template for every ADR:

```
# ADR NNNN: Title
Status: Accepted | Proposed
Date: YYYY-MM-DD
Related docs: links

## Context
The problem, the requirements involved (cite docs/requirements.md), constraints.

## Decision
What we chose, stated precisely.

## Alternatives considered
For each alternative: what it is, its genuine strengths, and why it lost here.

## Consequences
Positive. Negative and costs we accept. What this obliges us to do.

## When to revisit
Concrete triggers that would reopen this decision.
```

Write each ADR in full using the reasoning below. Expand it into proper prose; do not shorten it.

**0001 Modular monolith over microservices.** Context: 200–1,000 internal users, read-heavy, one small team (likely one developer), January deadline. Decision: one FastAPI codebase with clear internal modules (api, services, agents, integrations, workers); the worker is a separate process from the same codebase. Alternatives: microservices (independent scaling and deploys, but network calls between services, distributed tracing, multiple pipelines, harder failure modes; unjustified at this scale). Consequences: faster delivery, one deploy; must keep module boundaries clean so a part (e.g. ingestion) could be extracted later. Revisit: 10× scale, multiple teams, a component needing independent scaling.

**0002 On-premises VMs over cloud hosting.** Context: critical infrastructure ticket data; company server room; IT allocates VMs. Alternatives: managed cloud (elastic, managed backups, but data leaves the network); Supabase + Vercel (the developer's familiar stack, but external hosting of ticket data); hosted LLM APIs (data leaves the network). Consequences: we own or coordinate backups, capacity requests go through IT, need internal DNS/IPs and firewall rules, GPU must be provisioned, not automatically faster. List the four VMs. "Sparse server" TODO. Revisit: company policy changes.

**0003 FastAPI for the backend.** Context: AI-heavy app that waits on LLM responses; Python AI ecosystem (LangGraph, vLLM clients). Alternatives: Django (batteries included but heavier, sync-first), Flask (no native async or validation), Next.js API routes in TypeScript (would split AI work away from the Python ecosystem). Consequences: async handling, Pydantic validation, auto OpenAPI enabling generated frontend types. Revisit: unlikely.

**0004 Server-Sent Events over WebSockets.** Context: the agent sidebar streams answers; snapshot alerts; data pages refresh. Explain HTTP, polling, WebSockets (full-duplex, persistent) and SSE (one-way server→client over a kept-open HTTP response). Feature-by-feature: sidebar is one-way, Stop is the browser closing the stream or one cancel request; alerts are one-way, and manager notification may be email/Teams (TODO); data pages use TanStack Query refetch every ~30 s. Alternatives: WebSockets (true two-way real-time; but needs Nginx upgrade config, stateful connections, custom reconnection, separate auth handling, harder testing; adds nothing our features need); polling only (simple, but cannot stream tokens smoothly). Note the corrected memory argument (C9.5). Consequences: plain HTTP means existing auth, Nginx, logging work; browser reconnects automatically; Nginx buffering must be off for SSE routes. Revisit: collaborative real-time editing of RCAs (TipTap collaboration uses WebSockets), user-to-user chat, or any genuine two-way real-time need.

**0005 PostgreSQL with pgvector over Pinecone.** Context: early note named Pinecone; VM plan named pgvector (record the conflict). Need relational data (incidents, RCA status) and semantic search. Alternatives: Pinecone (managed, scalable vector search, but SaaS, so data leaves the network, plus a second store to keep consistent); self-hosted vector DBs such as Qdrant or Weaviate (strong vector features, but another server to run). Explain the "polyglot storage" argument from the notes and why pgvector gives both in one database. Consequences: one database to back up and secure; vector search combined with normal SQL filters (date, project, status, resolver), which the Search page needs; HNSW index; one fewer system. Revisit: vector count or search latency outgrows pgvector.

**0006 Redis for job queue, cache and agent state.** Context: background jobs, slow reads, agent state between steps. Alternatives: Postgres-backed queue (fewer moving parts), RabbitMQ or Kafka (overkill at this scale), LangGraph Postgres checkpointer for state (TODO decide). Consequences: one more service; persistence must be configured if the queue must survive restarts; durable data never only in Redis; key naming and TTL rules in `redis.md`. Revisit: if Redis adds more operational burden than value, move queue/state to Postgres.

**0007 LangGraph for the agent pipeline.** Context: five cooperating agents, multi-step workflows, mandatory human review. Decision: each agent is a node; shared state passes between nodes; checkpointing allows resuming; interrupts support human-in-the-loop review. Alternatives: plain Python functions (simpler, but no state, recovery or interrupts), LangChain chains alone (less control over flow), CrewAI/AutoGen (less control, more opinionated). Include the design note that not every agent needs an LLM (C5). Consequences: one agent can be upgraded or swapped without rewriting the pipeline. Revisit: if the graph adds complexity without benefit for simple agents.

**0008 vLLM over Ollama for model serving.** Context: parallel agents plus multiple users. Ollama serves requests largely one at a time, so concurrent agents queue behind each other. vLLM uses continuous batching, merging tokens from many requests into shared GPU passes, and exposes an OpenAI-compatible API, so LangGraph code only changes `base_url`. Include GPU memory facts, KV cache monitoring, the docker command, model TODO, Hugging Face access TODO. State that dashboards do not depend on the LLM (C9.3). Alternatives: Ollama (easiest to start, poor concurrency), hosted APIs (data leaves the network unless approved), TGI or other servers (viable; vLLM chosen as the widely used default). Revisit: GPU capacity limits, or a better serving option.

**0009 RAG over fine-tuning; no in-house quantisation.** Context: the system needs the team's knowledge (incidents, RCAs, who fixed what), not new model behaviour. Explain the difference between RAG (gives knowledge at question time, updated as data syncs) and fine-tuning (changes behaviour; needs labelled data, GPU time, its own evaluation; knowledge goes stale). Template adherence via prompts, Pydantic structured output and example RCAs from Box. Quantisation: download pre-quantised AWQ/GPTQ models if memory requires. Evals of about 30 questions prove accuracy. Revisit: evals show repeated failures that prompting and retrieval cannot fix.

**0010 Background worker for sync and uploads.** Context: eventual consistency of 30–60 s is acceptable; at-least-once delivery to Box is required; external services can be down. Decision: worker process consuming jobs from Redis; sync jobs on a schedule; Box uploads as jobs with retries, exponential backoff and idempotency (so a retried upload does not create duplicates); failed jobs visible, not silently dropped; RCA saved in Postgres before upload is queued. Alternatives: calling ServiceNow/Box live on page load (slow, breaks the 500 ms target, fails when they are down); arq vs Celery (TODO). Revisit: job volume or scheduling needs grow.

**0011 Nginx for HTTPS, routing and rate limiting; no separate load balancer or API gateway.** Context: early diagram showed an "API Gateway" and the developer asked about load balancing. Decision: Nginx terminates HTTPS, routes `/` to Next.js and `/api` to FastAPI, applies rate limiting, has SSE-friendly settings; authentication happens in FastAPI. Alternatives: dedicated API gateway products (e.g. Kong; unnecessary features), Traefik (viable alternative), hand-built rate limiter (unnecessary). Consequences: one component handles the gateway role; Nginx can load balance if a second app server is added. Revisit: a second app server or GPU server.

**0012 Mandatory human review before any RCA upload.** Context: accuracy over speed; RCAs are permanent records. Decision: no RCA reaches Box without explicit approval by a signed-in engineer; record approver and time; mark which fields AI filled; implement with LangGraph interrupts and the existing Edit RCA flow. Alternatives: auto-upload of high-confidence drafts (rejected: one wrong record damages trust). Revisit: only if long-term evals show near-perfect drafts and the team asks.

**0013 Authentication method.** Status: Proposed. Context: no sign-in today; required before real data; per-browser storage must become per-user. Likely company SSO; method TODO with IT. Alternatives listed as TODO.

**0014 Keep the existing Next.js frontend with a mock/live API switch.** Context: UI built first as a prototype on mock data. Decision: keep it; all calls through `src/lib/api.ts`; switch endpoints to live one at a time; TanStack Query for data fetching and refetching. Record that the UI was built before the design, and why that is acceptable. Revisit: if the frontend moves into `frontend/` (open question).

**0015 Box remains the system of record for RCA documents.** Context: team already stores RCAs in Box; README states Box is not replaced. Decision: Postgres stores RCA content, status and metadata while drafting; the final Word document (html-to-docx) is uploaded to Box; existing Box RCAs are ingested for search and clustering. Word Online depends on the real Box connection. Revisit: company changes document platform.

**0016 Environments and Docker-based deployment.** Context: developer's previous experience was Vercel; now on-prem. Decision: local (Docker Compose), staging VM, production VM; Docker images for all services; first deploy early November to surface infrastructure problems while small. Alternatives: build everything first and containerise at the end (rejected: all unfamiliar problems arrive at once before the deadline). Revisit: if IT provides a container platform.

**0017 Testing and CI strategy.** Testing pyramid, CI blocking merges, Ruff, mypy, ESLint, Prettier, pre-commit, Playwright, AI evals. CI platform TODO. Revisit: never removed, only extended.

**0018 Documentation, skills and agents approach.** Decision: ADRs for why, architecture docs for how, skills for repeatable procedures (one per task, not per technology), two read-only review agents, CI for anything that must happen every time. Include the anti-hallucination rules from C8. Revisit: if the docs drift from code, add a CI check.

**Additions to earlier ADRs (include these in the ADRs above when writing them):**
- 0005: add FAISS-on-disk as an alternative and why it lost (C12.12).
- 0006 and 0010: add RabbitMQ and Temporal as alternatives. Temporal is a durable workflow engine with strong recovery, but it is another large system to run; Redis plus LangGraph checkpointing covers our needs at this scale.
- 0007: include C11.1 in full (agent definition; loop, branch, wait; interrupts for approval; recursion limits).
- 0008: reference ADR 0023 for Ollama in local development.
- 0011: reference ADR 0019 for the full rate limiting design.
- 0016 and 0017: reference ADR 0024 for CI/CD.

**New ADRs:**

**0019 Two-tier rate limiting.** Context: protect our app from overload and protect ServiceNow and Box quotas. Decision: C11.6 in full (ingress at Nginx plus stricter Redis-backed limits on AI endpoints; egress limiters in every integration client, with 429 and `Retry-After` handling and a shared Redis counter when several processes call the same service). Explain all four algorithms and why each tier uses its choice. Alternatives: ingress only (leaves the critical external-quota risk unaddressed); no limits (one runaway agent loop can get the service account blocked). Consequences: integration calls are slowed deliberately; limits must be tuned once quotas are known. Revisit: quotas change, or new integrations are added.

**0020 Circuit breakers, timeouts and graceful degradation.** Context: external systems and the GPU can fail; the dashboard must not degrade during incidents. Decision: C11.7 in full. Alternatives: retries only (can create retry storms and long hangs); calling external systems live (rejected in ADR 0010). Consequences: users sometimes see stale data with a clear "last synced" label. Revisit: unlikely.

**0021 Stateless backend; horizontal scaling deferred.** Context: the strategy notes proposed Kubernetes autoscaling and an L7 load balancer. Decision: keep instances stateless now; do not build the scaling infrastructure (C11.8). Alternatives: Kubernetes from day one (heavy operations burden, unjustified at 1,000 users, risks the January date). Consequences: one app server, a clear path if load grows. Revisit: sustained latency over target that caching cannot fix, or user growth well beyond 1,000.

**0022 Model routing by task, with a fixed embedding model.** Context and decision: C11.3 in full. Alternatives: one large model for everything (wasteful, slower); hosted APIs for all tasks (data leaves the network). Consequences: several models to serve and evaluate; embedding changes require full re-embedding. Revisit: eval results, GPU capacity, or a security decision on hosted APIs.

**0023 Ollama for local development, vLLM for staging and production.** Context and decision: C11.4 in full. Alternatives: vLLM on laptops (needs NVIDIA GPUs, heavy); Ollama in production (poor concurrency, ADR 0008). Consequences: evals must pass on staging, not only locally. Revisit: if model behaviour differs too much between the two.

**0024 CI/CD with GitHub Actions.** Context: the developer wants automated quality gates and deployment; the VMs are on a private network. Decision: C11.10 in full. Alternatives: manual deploys over SSH (error-prone, no audit trail); the company's own CI tool if GitHub is not allowed (TODO). Consequences: needs a self-hosted runner or IT deploy tool; branch protection slows merges slightly in exchange for safety. Status: Accepted, with runner and registry as TODOs. Revisit: if IT mandates a different CI/CD platform.

**0025 Observability with structured logs, OpenTelemetry and agent tracing.** Context and decision: C11.9 in full. Alternatives: logs only (cannot follow one request across API, agents and jobs); hosted observability SaaS (data leaves the network). Consequences: an extra self-hosted tool to run for agent tracing. Revisit: if the company provides a standard observability platform.

**0026 Interactive agents in the API, batch agents in the worker.** Context and decision: C11.5 in full. Alternatives: all agent work in the worker (no live streaming for users); all in the API (long jobs tie up request handling and die if the API restarts). Consequences: two execution paths to test. Revisit: after measuring RCA drafting time.

### Phase 4. Skills

Location: `.claude/skills/<name>/SKILL.md`. Each starts with frontmatter:

```
---
name: <name>
description: <one or two sentences saying exactly when to use it>
---
```

If a skill with overlapping purpose exists in `.devin/skills/`, read it, keep it, and reference it from the new skill rather than contradicting it. Record overlaps in `progress.md`.

Every skill body must contain these sections, written in full:
- **When to use** and **when not to use**
- **Read first:** exact files (docs, ADRs, existing code) to read before starting
- **Steps:** numbered, specific, including commands where known
- **Rules:** constraints from ADRs and engineering practices that apply
- **Definition of done:** tests written and passing, lint and type-check passing, docs updated (via `update-docs`), ADR written if a decision changed
- **Do not guess:** if information is missing, stop and ask

Skills to create:

1. **architecture-check:** read `docs/architecture/` and `docs/adr/`; compare a proposed change against them; list every ADR it touches; flag conflicts with file references; never override an ADR without writing a new one via `write-adr`.
2. **update-docs:** read the git diff; find every doc, agent doc and ADR link affected; update "how" docs; never edit accepted ADRs; update `docs/build-plan.md` status; report what changed and what still needs a human decision.
3. **write-adr:** find the next number; use the template; require Context, Decision, Alternatives (each with strengths and why it lost), Consequences, When to revisit; update the index; if replacing, mark the old one "Superseded by".
4. **new-endpoint:** Pydantic request/response schemas in `schemas/` → route in `api/v1/` (no business logic) → service in `services/` → unit and integration tests → consistent error format → regenerate OpenAPI and frontend TypeScript types → update `docs/architecture/api.md`.
5. **db-migration:** edit SQLAlchemy model → `alembic revision --autogenerate` → read and correct the generated migration by hand (autogenerate misses things) → test `upgrade head` and `downgrade -1` locally → integration test → update `docs/architecture/database.md` ER diagram.
6. **new-agent:** LangGraph node following the existing pattern; define state inputs and outputs with Pydantic; decide whether an LLM is needed and justify it; failure handling and retries; write the agent doc in `docs/architecture/agents/`; add eval questions to `backend/evals/`; run `run-evals`.
7. **new-background-job:** job function in `workers/`; idempotency key; retries with backoff; what happens on final failure (visible, not silent); unit test; document in `background-jobs.md`.
8. **new-streaming-endpoint:** FastAPI SSE route; detect client disconnect and cancel work; heartbeat if needed; frontend hook using the stream; Nginx buffering note; tests; update `streaming.md`.
9. **add-cache:** confirm the read is actually slow (measure first); cache-aside in Redis following `redis.md` key and TTL rules; invalidation on writes; test; never cache per-user data under a shared key.
10. **connect-frontend-endpoint:** pick one call in `src/lib/api.ts`; confirm the backend endpoint exists and matches generated types; switch it to live; run the page; check loading and error states; keep mock mode working.
11. **new-integration:** client in `integrations/`; credentials from settings only; timeouts and retries; sync job via `new-background-job`; behaviour when the service is down; document in `integrations.md`.
12. **run-evals:** run the evaluation set; compare with the last stored result; report accuracy and any regressions question by question; never mark an AI change done if accuracy dropped without a written reason.
13. **write-tests:** choose the right layer of the pyramid; unit tests for services, integration tests against Postgres in Docker, Playwright for key journeys; naming conventions; no tests that call the real LLM except evals.
14. **deploy-staging:** build images, push or transfer, deploy to staging VM, run migrations, check `/health`, smoke-test key pages; roll back steps; TODOs where VM details are unknown; update `runbook.md` with anything learned.
15. **security-check:** quick self-check before opening a pull request: secrets, auth on new routes, input validation, logging of sensitive data. The full review is the `security-reviewer` agent.

16. **ci-cd-change:** add or change a GitHub Actions workflow following `docs/architecture/ci-cd.md`; never put secrets in workflow files; pin action versions; test on a pull request branch before relying on it; keep required status checks in sync with branch protection; update `ci-cd.md`.
17. **add-rate-limit:** decide ingress or egress; for ingress, an Nginx rule or a FastAPI limit on an expensive endpoint; for egress, wrap the integration client calls in the shared Redis limiter; handle 429 and `Retry-After`; test that limits trigger and recover; update `rate-limiting.md`.
18. **harden-integration:** add timeouts, a circuit breaker, egress rate limiting, retries with backoff and idempotency to an integration client; define what the UI shows when it is down; test each failure mode with mocked responses; update `resilience.md` and `integrations.md`.
19. **add-observability:** for a new component, add structured logs with request ID, OpenTelemetry spans, metrics, and agent tracing if it calls a model; confirm no sensitive ticket content is logged where it shouldn't be; update `observability.md`.
20. **rag-add-source:** add a new data source to the RAG pipeline: loader → chunking → embedding job using the fixed embedding model → store with model name and version → retrieval filters → eval questions for the new source → run evals.
21. **change-model:** switch an LLM or embedding model: write an ADR first; for embeddings, plan full re-embedding; run evals before and after; compare per task; roll back if accuracy drops.

### Phase 5. Review agents

Location: `.claude/agents/<name>.md`, with frontmatter `name`, `description`, `tools`. Tools must be read-only (e.g. Read, Grep, Glob, and Bash only for running tests/lint if needed). Check `.devin/agents/` first and do not contradict existing ones.

1. **code-reviewer.** Reviews a diff or pull request with fresh eyes. Reads `CLAUDE.md`, `AGENTS.md`, `docs/PRD.md`, `docs/engineering-practices.md` and every ADR the change touches. Checks: correctness, matches the PRD, follows ADRs, module boundaries (no business logic in routes), migrations present for model changes, tests present and meaningful, docs updated, no invented APIs or fields. Every finding cites file and line, is labelled Blocker / Should fix / Suggestion, and explains why. Never edits code. If unsure, says so rather than guessing.
2. **security-reviewer.** Reviews before any deploy with real data and on any change touching auth, integrations, uploads or AI prompts. Checks: secrets in code or logs, auth on every route, input validation, injection (SQL, prompt injection via ticket text or uploaded files), file upload handling, data leaving the network, credentials only on backend. Every finding cites file and line with severity. Never edits code.

Additional checks for **code-reviewer**: every external call has a timeout and goes through the egress limiter and circuit breaker; writes are idempotent; no local state on the app server; LangGraph graphs set a recursion limit; the embedding model is not changed without an ADR; workflow files contain no secrets and pin action versions; protected files (A1b) only gained lines, never lost them.

Additional checks for **security-reviewer**: GitHub Actions permissions are minimal; secrets come only from Environment secrets or the vault; no ticket data is sent to any hosted API unless an ADR records approval; logs and traces do not leak credentials.

### Phase 6. CLAUDE.md and AGENTS.md

Read both fully. **Append only**, under `## Architecture rules (added YYYY-MM-DD)`:

- One line per accepted ADR stating the rule and linking the ADR (e.g. "Streaming uses SSE, not WebSockets. See docs/adr/0004.").
- "Before changing design, read `docs/architecture/` and `docs/adr/`. If something is not documented, ask; do not guess."
- "Every claim about the codebase must cite a file. If you cannot point to one, do not state it."
- "Use the skills in `.claude/skills/` for these tasks: (list)."
- "Every database change goes through Alembic. Every pull request needs tests, passing CI, and updated docs."
- "Never commit to main."
- "Protected files: `docs/PRD.md` is read-only. `CLAUDE.md`, `AGENTS.md` and `README.md` are append-only: add new sections at the end under a dated heading; never edit, reorder or remove existing lines. After changing any of them, `git diff --numstat` must show 0 deletions."
- "Every external call needs a timeout, egress rate limiting and a circuit breaker. See docs/adr/0019 and 0020."
- "Use the same embedding model everywhere; changing it needs an ADR and full re-embedding. See docs/adr/0022."
- "Interactive agents run in the API and stream over SSE; batch agents run in the worker. See docs/adr/0026."
- "CI must pass before merge. Production deploys promote the same image that passed staging. See docs/adr/0024."

If either file already contains a conflicting rule, keep it, add a `> CONFLICT:` note, and report it.

### Phase 7. Self-check and final report

1. Check every item below exists and is linked correctly. For each ADR 0001–0026, confirm it has all five sections with real reasoning (not one-line placeholders). For each skill, confirm all required sections.
2. Search all new files for statements not backed by Part C, source notes or repo files. Convert any such statement to a TODO.
3. Confirm no existing file lost content: run `git diff --numstat main` and check that every pre-existing file shows `0` in the deletions column. Confirm `docs/PRD.md` does not appear in the diff at all. Compare line counts of protected files with those recorded in `progress.md`; every count must be equal or higher. Report the result of this check explicitly.
4. Update `docs/context/progress.md` to complete.
5. Reply with:
   - every file created
   - every existing file appended to (and what was added)
   - every conflict found
   - every TODO, grouped by who must answer it
   - anything you could not do and why

# PROMPT END
