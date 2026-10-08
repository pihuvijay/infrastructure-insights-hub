---
name: security-check
description: Quick self-check for security issues before opening a pull request.
---

# security-check

## When to use
Before every pull request, especially when adding routes, config, uploads or prompts.

## When not to use
A full review of auth, integrations, uploads or AI prompts (use the `security-reviewer` agent).

## Read first
- `docs/security.md`
- ADR 0012, ADR 0013
- The diff (`git diff main...HEAD`)

## Steps
1. Search the diff for secrets, keys, tokens and passwords; confirm none are present and `.env.example` has names only.
2. Confirm every new route requires sign-in (except `/health`) and validates input.
3. Confirm no ticket content or credentials are logged.
4. Confirm no ticket data is sent to a hosted API.
5. Check uploads, SQL and prompts for injection risks.
6. Run the dependency and secret scans available (`uv run pip-audit`, `npm audit`, `gitleaks detect`).
7. If anything touches auth, integrations, uploads or AI prompts, request the `security-reviewer` agent.

## Rules
- Credentials live only on the backend.
- `NEXT_PUBLIC_` values reach the browser; never put secrets in them.
- Do not weaken any security setting to make CI pass; ask the user.

## Definition of done
- Tests written and passing (`write-tests`).
- Lint and type-check passing (`uv run ruff check .`, `uv run mypy app`, `npm run lint`, `npm run typecheck` as applicable).
- Docs updated via the `update-docs` skill.
- An ADR written via `write-adr` if a decision changed.

## Do not guess
If information is missing (a decision, a name, an address, a quota), stop and ask the user. Do not invent it. If it is not documented, ask. Record unknowns as `TODO: confirm with <who>` and add them to `docs/context/open-questions.md`.
