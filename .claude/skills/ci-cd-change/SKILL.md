---
name: ci-cd-change
description: Add or change a GitHub Actions workflow safely.
---

# ci-cd-change

## When to use
Any change under `.github/workflows/` or to branch protection and required checks.

## When not to use
Application code changes.

## Read first
- `docs/architecture/ci-cd.md`
- ADR 0024, ADR 0017
- `docs/build-plan.md` ('When each check joins the pipeline')
- `docs/security.md`

## Steps
1. Decide the workflow (`ci.yml`, `cd-staging.yml`, `cd-production.yml` or `evals.yml`) and its trigger.
2. Use minimal permissions and pin action versions.
3. Never put secrets in workflow files; use GitHub Environment secrets or the company vault.
4. Test on a pull request branch before relying on it (`gh pr checks --watch`).
5. Keep required status checks in sync with branch protection.
6. Production workflow must use an Environment with required reviewers and promote the same image SHA that passed staging.
7. Update `docs/architecture/ci-cd.md`.

## Rules
- GitHub-hosted runners cannot reach internal VMs; deployment needs a self-hosted runner or IT tool (TODO with IT).
- Do not change security policies to get CI green; ask the user.

## Definition of done
- Tests written and passing (`write-tests`).
- Lint and type-check passing (`uv run ruff check .`, `uv run mypy app`, `npm run lint`, `npm run typecheck` as applicable).
- Docs updated via the `update-docs` skill.
- An ADR written via `write-adr` if a decision changed.

## Do not guess
If information is missing (a decision, a name, an address, a quota), stop and ask the user. Do not invent it. If it is not documented, ask. Record unknowns as `TODO: confirm with <who>` and add them to `docs/context/open-questions.md`.
