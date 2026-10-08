# Runbook

**Purpose:** how to deploy, roll back, restore and recover. It starts mostly as TODOs and is filled in by doing each step by hand once (build plan 3.4).

**Related ADRs:** [0016 environments and Docker](adr/0016-environments-docker.md), [0020 resilience](adr/0020-resilience.md), [0024 CI/CD](adr/0024-cicd-github-actions.md)

Last updated: 2026-10-08. Commands that already exist are in `docs/commands.md`.

## Deploy (manual, staging then production)

1. Build images (`docker build -t gev-backend:<tag> backend`, `docker build -t gev-frontend:<tag> .`).
2. Copy or push images and the compose file to the VM. TODO: method depends on what IT allows.
3. Set secrets on the VM, never in Git. TODO: where.
4. `docker compose -f infra/docker-compose.prod.yml up -d`.
5. Run migrations: `docker compose -f infra/docker-compose.prod.yml exec backend alembic upgrade head`.
6. Check `curl https://<address>/health` and open the app.
Staging first; production uses the same image. Write what you learn here after each deploy. Skill: `deploy-staging`.

## Roll back

Redeploy the previous image tag (the previous git SHA). Database migrations: only `alembic downgrade -1` if the migration is reversible; otherwise restore a backup. TODO: write the policy.

## Restore a backup

Back up: `pg_dump -h <db-address> -U <user> -Fc <db> > backup.dump`. Restore into a fresh database: `pg_restore -h <db-address> -U <user> -d <new-db> backup.dump`. Backup owner and schedule: TODO (IT). A backup you have not restored is not a backup (build plan 7.3).

## Rotate secrets

TODO: depends on where IT stores secrets. Generic steps: create the new secret, update the store, redeploy, revoke the old one.

## Common failures

| Symptom | Likely cause | What to do |
|---|---|---|
| ServiceNow data looks old, "last synced X ago" | ServiceNow down, circuit breaker open, or credentials/quota issue | Check breaker state and worker logs; wait for the probe; contact ServiceNow admins if the account is blocked |
| Box upload failing, RCA shows Uploading or Upload failed | Box down, auth or quota | Check worker logs; jobs retry with backoff; fix cause and re-queue; the RCA is safe in Postgres |
| AI says unavailable / slow | vLLM down, or GPU out of memory (KV cache full) | Check `curl http://<gpu-address>:8000/v1/models`, vLLM logs and KV cache use; reduce load or context; TODO: restart procedure |
| Queued jobs missing after a Redis restart | Redis without persistence | Re-queue from database status; TODO: configure persistence |
| `/health` shows Redis or Postgres down | Container or VM down, firewall change | `docker compose ... ps`, logs, TODO IT contact |
| Migration fails on deploy | Model/migration mismatch | Roll back the deploy; fix migration; `alembic check` in CI should have caught it |

TODO: add on-call or escalation contacts (manager / IT).
