# ADR 0013: Authentication method
Status: Proposed
Date: 2026-10-08
Related docs: [auth](../architecture/auth.md), [security](../security.md), [database](../architecture/database.md)

## Context
There is no sign-in today. It is required before real data is on a server (build plan 5.6) and for approval accountability ([ADR 0012](0012-human-review.md)). Per-browser storage of homepage widgets and bookmarks must become per-user. Likely company SSO, for example Microsoft Entra ID (build plan 0.1 says "probably"). The method is not confirmed with IT.

## Decision
Proposed: use the company's single sign-on, with sign-in enforced by FastAPI middleware on every route except `/health`. The exact method, library and app registration are TODO: confirm with IT.

## Alternatives considered
TODO. Candidate alternatives to evaluate once IT answers: company SSO via Entra ID (OIDC or SAML); local username/password accounts (simple, but a second credential store to secure and manage); a reverse-proxy SSO layer in front of Nginx. Strengths and weaknesses are not stated here because no source note covers them; do not guess.

## Consequences
To be completed when decided. Known obligations: every API route requires sign-in; per-user tables for widgets and bookmarks; no secrets in the browser; sessions or tokens kept stateless ([ADR 0021](0021-stateless-backend.md)).

## When to revisit
When IT confirms the method, supersede or accept this ADR with a new one if details change.
