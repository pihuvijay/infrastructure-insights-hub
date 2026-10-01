# AGENTS.md

Read `CLAUDE.md` (rules, stack, structure, style) and `docs/PRD.md` (spec) before any change. They are authoritative.

- Stack: Next.js App Router + FastAPI backend (not built yet; UI runs on mock data).
- Skills: `.devin/skills/build-feature`, `.devin/skills/test-before-pr`.
- Agents: `.devin/agents/reviewer`, `.devin/agents/tester`.
- Verify with `npm run lint && npm run typecheck && npm run build`.
- Don't rewrite pushed git history.
