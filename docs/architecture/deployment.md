# Deployment

**Purpose:** how the app is packaged, which environments exist, and what is needed to deploy on-prem.

**Related ADRs:** [0002 on-premises VMs](../adr/0002-on-premises-vms.md), [0011 Nginx](../adr/0011-nginx.md), [0016 environments and Docker](../adr/0016-environments-docker.md), [0024 CI/CD](../adr/0024-cicd-github-actions.md), [0021 stateless backend](../adr/0021-stateless-backend.md)

Last updated: 2026-10-08. Nothing here exists yet (no Dockerfiles, no `infra/` files); `vercel.json` exists at the repo root from the earlier hosting.

## Docker images

Docker is **packaging, not a deployment step**: it makes the app run the same on a laptop and on a VM. Images: frontend (root `Dockerfile`), backend (`backend/Dockerfile`). The same image tested in CI is the one that runs on the servers; production promotes the image that passed staging, never a rebuild ([ci-cd.md](ci-cd.md)). IT helps place containers onto the assigned VMs.

## Compose files

| File | Contents | Used for |
|---|---|---|
| `infra/docker-compose.yml` | Postgres (`pgvector/pgvector:pg16`) and Redis (`redis:7`) with named volumes, plus the worker once it exists | Local development (dev/prod parity of versions) |
| `infra/docker-compose.prod.yml` | Nginx, frontend, backend, worker, Postgres and Redis | The production setup on a laptop; on VMs, each service runs on its assigned VM |

(Image names come from `docs/build-plan.md` stages 1.2 and 3.2.) On the real VMs the database and Redis are on VM 2 and VM 3 ([high-level.md](high-level.md)), so the compose file for VM 1 will not run them. TODO: confirm layout with IT.

## Nginx's role

Terminates HTTPS, routes `/` to the frontend and `/api` and `/health` to the backend, applies rate limiting, has SSE-friendly settings. Config in `infra/nginx/`. See [ADR 0011](../adr/0011-nginx.md), [rate-limiting.md](rate-limiting.md), [streaming.md](streaming.md).

## Environments

| Environment | Where | Purpose |
|---|---|---|
| local | developer laptop, Docker Compose (Postgres + pgvector, Redis), Ollama | Development |
| staging | test VM | Changes are tested here before production; evals run against staging (vLLM) |
| production | production VM | Real use |

An `ENVIRONMENT` setting (`development`, `staging`, `production`) selects behaviour; the same code runs everywhere and only settings change (build plan 1.4). Settings come from environment variables, never from Git.

## Firewall and DNS needs

App server to DB, Redis, GPU server, ServiceNow and Box; static internal IPs or DNS names. TODO: confirm with IT.

## Step outline (TODO details)

1. Build images in CI (SHA tags).
2. Push to the container registry (TODO: GitHub Container Registry or internal).
3. Deploy to staging via self-hosted runner or IT's tool (TODO).
4. Run migrations (`alembic upgrade head`), smoke tests, Playwright against staging.
5. Approve production; deploy the same SHA; migrations; smoke tests.
6. Roll back by redeploying the previous SHA.

The first deploy (target early November 2026) is deliberately early to surface firewall, DNS and env-var problems while the app is small ([ADR 0016](../adr/0016-environments-docker.md)). The manual procedure is written in [runbook.md](../runbook.md).

## Optional temporary host

Build plan 3.3: sample data only on an outside host (Vercel in mock mode, or a Docker host) if the manager agrees. Never real ServiceNow or Box data.
