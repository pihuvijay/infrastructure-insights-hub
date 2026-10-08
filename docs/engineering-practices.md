# Engineering practices

**Purpose:** the agreed way of working. These rules apply to people and to AI assistants.

**Related ADRs:** [0017 testing and CI](adr/0017-testing-ci.md), [0018 docs, skills and agents](adr/0018-docs-skills-agents.md), [0024 CI/CD](adr/0024-cicd-github-actions.md), [0003 FastAPI](adr/0003-fastapi.md)

Last updated: 2026-10-08

- **References:** The Twelve-Factor App (12factor.net); the official Full Stack FastAPI Template (github.com/fastapi/full-stack-fastapi-template) as the model for backend layout and habits.
- **Git:** never commit to `main`; every change is a branch and a pull request, reviewed before merge (the `code-reviewer` agent can review).
- **CI:** runs lint, type-check and tests on every pull request; merges are blocked if anything fails. Platform TODO (GitHub Actions or company equivalent). See [ci-cd.md](architecture/ci-cd.md).
- **Tooling:** Ruff and mypy for Python; ESLint and Prettier for TypeScript; pre-commit hooks run them before each commit.
- **API contract:** FastAPI generates OpenAPI from Pydantic models; frontend TypeScript types are generated from it (for example openapi-typescript) so frontend and backend cannot silently disagree. Routes under `/api/v1`. One consistent error format everywhere. See [api.md](architecture/api.md).
- **Secrets:** never in Git. `.env.example` lists names only. Production secrets wherever IT keeps them (TODO).
- **Testing pyramid:** many unit tests, fewer integration tests (against real Postgres in Docker), a handful of Playwright end-to-end tests, plus AI evals. See [testing.md](testing.md).
- **Observability:** structured logs, `/health` endpoint, error alerts. See [observability.md](architecture/observability.md).
- **Rule of thumb:** if something must happen every time, automate it with CI. If it needs judgement, use an agent. If people need to read it, write a document.
- **Skills vs docs:** a skill is made per repeatable *task*, not per technology. Conventions for a technology (for example how Redis keys are named) go in a doc; repeatable procedures (for example "add a background job") become skills.
- **Skills vs agents:** a skill is instructions loaded into the current session (procedures). A subagent runs in a fresh context (independent review). Only reviewers are agents, because the session that wrote code should not mark its own work.
- **Preventing AI hallucination in development:** one source of truth (`docs/`, PRD); instructions say "read these files first"; claims must cite file and line; "if it is not documented, ask, do not guess"; tests and CI catch invented code; the human reviews every pull request.
- **Three things that matter most:** CI that blocks bad merges, migrations for every database change, and a staging environment.

## Additional rules from the repo (CLAUDE.md, build plan)

- Tests are written one at a time alongside the code, in the same step. Never "code now, tests later" (`docs/build-plan.md`).
- Never break the backbone: after every step the app runs and tests pass (`docs/build-plan.md`).
- Compact code, no comments unless asked, no `any`, no leftover `console.log` (CLAUDE.md).
- Protected files: `docs/PRD.md` is read-only; `CLAUDE.md`, `AGENTS.md`, `README.md` are append-only.
- Commands live in `docs/commands.md`.
