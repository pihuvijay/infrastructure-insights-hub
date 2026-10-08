# ADR 0024: CI/CD with GitHub Actions
Status: Accepted (runner and registry are TODO with IT)
Date: 2026-10-08
Related docs: [ci-cd](../architecture/ci-cd.md), [deployment](../architecture/deployment.md), [runbook](../runbook.md), [ADR 0016](0016-environments-docker.md), [ADR 0017](0017-testing-ci.md)

## Context
The developer wants automated quality gates and automated deployment. The VMs are on a private network, and GitHub's hosted runners cannot reach internal VMs. TODO: confirm the repo is on GitHub (or GitHub Enterprise) and that Actions and self-hosted runners are allowed.

## Decision
**CI** runs on every pull request and push: frontend (`npm ci`, lint, type-check, build, unit tests); backend (Ruff lint and format check, mypy, pytest unit tests, integration tests with Postgres (pgvector image) and Redis as service containers, `alembic upgrade head` on an empty database, `alembic check`); contract (regenerate TypeScript types from OpenAPI and fail if they differ); Docker (build all images, not pushed on pull requests); security (`pip-audit`, `npm audit`, gitleaks, optionally CodeQL). These are required status checks; `main` is protected and needs a reviewed pull request. Dependabot keeps dependencies updated.

**CD** after merge: build images tagged with the git commit SHA, push to the registry (TODO: GitHub Container Registry or internal), deploy to staging, run migrations, smoke tests, then Playwright end-to-end tests. Production uses a separate workflow with a GitHub Environment with required reviewers (manual approval) and promotes **the same image SHA** that passed staging; images are never rebuilt for production. Rollback is redeploying the previous SHA. An **evals workflow** runs manually and on pull requests labelled `ai` (likely a self-hosted runner). Secrets live in GitHub Environment secrets or the company vault, never in workflow files.

On-prem constraint: deployment needs either a **self-hosted runner inside the company network** or an IT-managed tool that pulls the images.

## Alternatives considered
**Manual deploys over SSH.** Strengths: no pipeline setup. Why it lost: error-prone, with no audit trail.

**The company's own CI tool if GitHub is not allowed.** Strengths: possibly mandated and already integrated. Status: TODO; the same pipeline stages would apply.

## Consequences
Positive: every change is checked; deploys are repeatable and recorded; production runs what staging proved.
Negative: needs a self-hosted runner or IT deploy tool; branch protection slows merges slightly in exchange for safety.
Obligations: keep required status checks in sync with branch protection; pin action versions; minimal permissions (skill `ci-cd-change`).

## When to revisit
If IT mandates a different CI/CD platform.
