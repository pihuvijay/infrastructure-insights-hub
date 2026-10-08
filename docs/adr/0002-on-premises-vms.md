# ADR 0002: On-premises VMs over cloud hosting
Status: Accepted
Date: 2026-10-08
Related docs: [requirements](../requirements.md), [high-level](../architecture/high-level.md), [deployment](../architecture/deployment.md), [database](../architecture/database.md), [llm-serving](../architecture/llm-serving.md), [security](../security.md)

## Context
The data is ServiceNow incident and RCA information about critical infrastructure. The app runs on the company's internal network, on virtual machines (VMs) allocated by the IT infrastructure team in a company server room. Capacity is requested from IT; it is not "click a button for more". The developer's earlier experience was Supabase and Vercel (external hosting), and a Pinecone/hosted-API style of architecture appeared in early notes.

## Decision
Host on-premises on four VMs, with Docker packaging the services:

| Resource | Purpose |
|---|---|
| VM 1: Application server | Nginx, Next.js frontend, FastAPI backend and background worker (Docker containers) |
| VM 2: Database server | PostgreSQL with pgvector |
| VM 3: Redis server | Job queue, cache and LangGraph agent state |
| VM 4: AI model server | GPU machine running vLLM for the private LLM (and the embedding model, TODO confirm) |

Plus static internal IP/DNS names and firewall rules so the app server can reach the DB, Redis, GPU server and the external tools (ServiceNow, Box). Environments: local, staging, production.

"Sparse server": the manager used this phrase and its meaning is unknown. TODO: confirm with manager whether it means one dedicated VM or the four above.

## Alternatives considered
**Managed cloud.** Strengths: elastic capacity, managed backups, easy GPU rental, no server room dependence. Why it lost: data leaves the company network.

**Supabase + Vercel** (the developer's familiar stack). Strengths: very fast to start, automatic backups, no servers to run. Why it lost: ticket data would be hosted externally. (Vercel may still be used for a temporary sample-data demo only, with manager approval; see the build plan 3.3.)

**Hosted LLM APIs.** Strengths: best models with no GPU to run. Why it lost: ticket data would leave the network unless security approves (TODO).

## Consequences
Positive: ticket data stays on the company network ("safer" in that sense; it is not inherently faster and is less elastic, see [corrections](../context/corrections.md) item 4).
Negative and accepted: we own or coordinate backups (previously automatic under Supabase; owner TODO with IT); capacity requests go through IT and may take weeks; internal DNS/IPs and firewall rules are needed; a GPU must be provisioned; CI cannot reach the VMs without a self-hosted runner or IT tooling ([ADR 0024](0024-cicd-github-actions.md)).
Obligations: send the IT questions early (build plan 0.1).

## When to revisit
Company policy changes (for example approval of cloud or hosted AI), or IT provides a container platform.
