# ADR 0017: Testing and CI strategy
Status: Accepted
Date: 2026-10-08
Related docs: [testing](../testing.md), [engineering-practices](../engineering-practices.md), [ci-cd](../architecture/ci-cd.md), [ADR 0024](0024-cicd-github-actions.md)

## Context
One developer plus AI assistants will write a lot of code quickly. AI-generated code can contain invented APIs and fields. Wrong RCAs are worse than slow RCAs. "If something must happen every time, automate it with CI."

## Decision
- **Testing pyramid:** many unit tests, fewer integration tests against real Postgres in Docker, a handful of Playwright end-to-end tests, plus AI evals.
- **CI** runs lint, type-check and tests on every pull request; merges are blocked if anything fails. Platform TODO (GitHub Actions or company equivalent; see [ADR 0024](0024-cicd-github-actions.md)).
- **Tooling:** Ruff and mypy for Python; ESLint and Prettier for TypeScript; pre-commit hooks run them before each commit.
- Tests are written one at a time alongside code, never "code now, tests later".
- The pipeline starts minimal and gains checks as the app grows (table at the end of `docs/build-plan.md`).

## Alternatives considered
**Manual testing only.** Strengths: no setup. Why it lost: does not scale and cannot catch regressions in AI-written code.

**Only end-to-end tests.** Strengths: realistic. Why it lost: slow, brittle and poor at pinpointing failures; the pyramid gives fast feedback.

**Tests after features are built.** Strengths: faster at first. Why it lost: tests become an afterthought and the backbone breaks.

## Consequences
Positive: invented code is caught; refactors are safer; merges are gated.
Negative: initial setup time and a slower merge in exchange for safety.
Obligations: no PR without tests, passing CI and updated docs; evals run after prompt, chunking, embedding or model changes.

## When to revisit
Never removed, only extended.
