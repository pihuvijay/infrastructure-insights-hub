# ADR 0018: Documentation, skills and agents approach
Status: Accepted
Date: 2026-10-08
Related docs: [engineering-practices](../engineering-practices.md), [README for ADRs](README.md), `.claude/skills/`, `.claude/agents/`, `.devin/skills/`, `.devin/agents/`

## Context
A new engineer or a future AI session must understand not just what was decided but why, what else was considered, and when to reconsider. AI assistants can hallucinate APIs, fields and file contents unless anchored to written sources.

## Decision
- **ADRs** record why. **Architecture docs** record how. **Skills** hold repeatable procedures, one per task, not per technology. **Two read-only review agents** (`code-reviewer`, `security-reviewer`) provide independent review because the session that wrote the code should not mark its own work. **CI** handles anything that must happen every time.
- Conventions for a technology (for example Redis key naming) go in a doc; repeatable procedures (for example "add a background job") become skills.
- **Anti-hallucination rules:** one source of truth (`docs/`, the PRD); instructions say "read these files first"; claims must cite file and line; "if it is not documented, ask, do not guess"; tests and CI catch invented code; the human reviews every pull request.
- Protected files: `docs/PRD.md` is read-only; `CLAUDE.md`, `AGENTS.md` and `README.md` are append-only.

## Alternatives considered
**One skill per technology.** Strengths: easy to name. Why it lost: skills get long and vague; tasks are what people repeat.

**More agents (for example an agent per feature).** Strengths: more automation. Why it lost: only independent reviewers benefit from a fresh context; procedures are cheaper as skills.

**Docs only, no skills or agents.** Strengths: less to maintain. Why it lost: procedures are forgotten and reviews are not independent.

## Consequences
Positive: consistent procedures; reasoning preserved; fewer invented facts.
Negative: docs can drift from the code; skills need maintenance.
Obligations: the `update-docs` skill runs on every change; existing skills and agents in `.devin/` are kept and referenced, not contradicted.

## When to revisit
If the docs drift from the code, add a CI check.
