---
name: deploy-staging
description: Deploy to the staging VM and verify it. Use for manual staging deploys and to improve the runbook.
---

# deploy-staging

## When to use
When deploying the app to staging by hand, or when the automated staging deploy has failed and needs diagnosing.

## When not to use
Production deploys (they promote the image that passed staging, with approval; see `ci-cd-change` and `docs/architecture/ci-cd.md`).

## Read first
- `docs/runbook.md`
- `docs/architecture/deployment.md`, `docs/architecture/ci-cd.md`
- ADR 0016, ADR 0024
- `docs/commands.md`

## Steps
1. Build the images (`docker build -t gev-backend:<tag> backend`, `docker build -t gev-frontend:<tag> .`).
2. Push or transfer the images and compose file to the staging VM (method TODO with IT).
3. Set secrets on the VM; never in Git.
4. Start: `docker compose -f infra/docker-compose.prod.yml up -d`.
5. Run migrations: `docker compose -f infra/docker-compose.prod.yml exec backend alembic upgrade head`.
6. Check `curl https://<staging-address>/health` and smoke-test the key pages.
7. If it fails, roll back by redeploying the previous image tag.
8. Write anything learned into `docs/runbook.md`.

## Rules
- Never put secrets in Git or workflow files.
- Staging first, always.
- Where VM details are unknown, write TODO and ask; do not guess addresses.

## Definition of done
- Tests written and passing (`write-tests`).
- Lint and type-check passing (`uv run ruff check .`, `uv run mypy app`, `npm run lint`, `npm run typecheck` as applicable).
- Docs updated via the `update-docs` skill.
- An ADR written via `write-adr` if a decision changed.

## Do not guess
If information is missing (a decision, a name, an address, a quota), stop and ask the user. Do not invent it. If it is not documented, ask. Record unknowns as `TODO: confirm with <who>` and add them to `docs/context/open-questions.md`.
