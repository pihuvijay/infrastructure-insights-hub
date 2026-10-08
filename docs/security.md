# Security

**Purpose:** security rules and checks for the system.

**Related ADRs:** [0002 on-premises VMs](adr/0002-on-premises-vms.md), [0012 human review](adr/0012-human-review.md), [0013 authentication](adr/0013-authentication.md), [0019 rate limiting](adr/0019-rate-limiting.md), [0022 model routing](adr/0022-model-routing.md), [0024 CI/CD](adr/0024-cicd-github-actions.md)

Last updated: 2026-10-08. Nothing real is connected yet (README); the rules below apply from the first real-data deploy.

## Secrets

- Never in Git. `.env.example` lists names only (it currently has `NEXT_PUBLIC_API_MODE` and `API_URL`).
- Production secrets live where IT keeps them (TODO).
- CI secrets come only from GitHub Environment secrets or the company vault, never workflow files.
- Secret scanning in CI (gitleaks).
- Nothing starting with `NEXT_PUBLIC_` may be a secret (those values reach the browser).

## Credentials only on the backend

ServiceNow and Box credentials live on the backend, never in the browser (README, C1).

## Data stays on the company network

Ticket data stays on-prem (VMs, local models). No ticket data is sent to any hosted API unless an ADR records approval by security (TODO: Is any external AI API allowed? Manager/security). The outside-host demo (build plan 3.3) uses sample data only.

## Authentication

Required before real data is on a server; every route except `/health` ([auth.md](architecture/auth.md)).

## Accountability

Every RCA approval records who approved it and when ([ADR 0012](adr/0012-human-review.md)). Logs must not leak credentials or unnecessary ticket content ([observability.md](architecture/observability.md)).

## Input risks

- SQL injection: use SQLAlchemy parameters, never string-built SQL.
- Prompt injection through ticket text or uploaded files that end up in prompts.
- File uploads: size and type limits, processed in the worker, not stored on the app VM's disk (location TODO).
- Dependency vulnerabilities: `pip-audit`, `npm audit`, Dependabot.

## Reviews

- Quick self-check before each pull request: skill `security-check`.
- Full review: the `security-reviewer` agent (`.claude/agents/`), on changes touching auth, integrations, uploads or AI prompts, and a **security review before the first real-data deploy** (build plan 5.6, 5.11, 6.5, 7.4).
- GitHub Actions permissions are minimal.
