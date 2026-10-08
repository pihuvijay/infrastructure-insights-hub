# ADR 0016: Environments and Docker-based deployment
Status: Accepted
Date: 2026-10-08
Related docs: [deployment](../architecture/deployment.md), [ci-cd](../architecture/ci-cd.md), [runbook](../runbook.md), [ADR 0024](0024-cicd-github-actions.md), [ADR 0017](0017-testing-ci.md)

## Context
The developer's previous deployment experience was Vercel; now the target is on-prem VMs ([ADR 0002](0002-on-premises-vms.md)). The deadline is January 2027. Unfamiliar problems (firewalls, DNS, env vars, registries) take time to surface and fix.

## Decision
Three environments: local (Docker Compose with Postgres + pgvector and Redis on a developer laptop), staging (a test VM) and production. All services are packaged as Docker images. Docker is packaging, not a deployment step: it makes the app run the same on a laptop and on a VM. IT helps place containers onto the assigned VMs. Changes are tested on staging before production. The first deploy is early (target early November 2026) with a tiny backbone, to surface infrastructure problems while the system is small (walking skeleton, `docs/build-plan.md`).

## Alternatives considered
**Build everything first and containerise at the end.** Strengths: focus on features first. Why it lost: all unfamiliar infrastructure problems would arrive at once just before the deadline.

**Run directly on the VM without Docker.** Strengths: fewer concepts. Why it lost: laptop and server would differ, causing "works on my machine" problems.

## Consequences
Positive: dev/prod parity (same Postgres and Redis versions); repeatable deploys; images tested in CI are the ones that run.
Negative: Docker knowledge required; image registry needed (TODO); IT involvement for placement.
Obligations: write every manual step into `docs/runbook.md`; production is a deploy of the same image, not a rebuild ([ADR 0024](0024-cicd-github-actions.md)).

## When to revisit
If IT provides a container platform.
