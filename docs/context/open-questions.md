# Open questions

> C10 and C13 copied verbatim from the foundation prompt (2026-10-08). Answers are recorded here as they arrive.

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

## Added by foundation setup (2026-10-08)

| Question | Who |
|---|---|
| Should the frontend move into `frontend/`? Decide later; moving it affects build config. | You |
| Source of Build Release Progress tickets (`/build-release`) for the live backend | Manager |
| Should `GET /rca/reports/{number}/word-url` be added to PRD §7? | You |
| Map backend RCA lifecycle (Needs RCA / Draft / Approved / Uploading / In Box / Upload failed) to frontend `RcaStatus` | You |
| `docs/context/source/` source notes were not present when foundation setup ran. Part C of the prompt was used as the source of truth. Add the notes if they exist. | You |
