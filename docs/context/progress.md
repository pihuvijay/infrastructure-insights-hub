# Foundation setup progress

Branch: `docs/foundation`. Started 2026-10-08.

## Protected file line counts (before any change)
| File | Lines before |
|---|---|
| docs/PRD.md | 129 |
| CLAUDE.md | 34 |
| AGENTS.md | 9 |
| README.md | 153 |
| .env.example | 4 |
| package.json | 91 |
| docs/commands.md (untracked, developer-written; not edited) | 146 |
| docs/build-plan.md (untracked, developer-written; append-only) | 838 |

Note: `docs/build-plan.md`, `docs/commands.md` and the foundation prompt are untracked in git, so `git diff --numstat` cannot be used for them. Their line counts are the check.

## Phases
- [x] Phase 0: context pack (`repo-inventory.md`, `project-context.md`, `corrections.md`, `open-questions.md`, this file)
- [x] Phase 1: folder skeleton (READMEs in backend/*, infra/*, docs/adr, docs/architecture/agents)
- [x] Phase 2: architecture and supporting docs (requirements, engineering-practices, testing, security, runbook, glossary, 17 architecture docs, 5 agent docs; `docs/build-plan.md` appended with a Notes section, 838 to 860 lines)
- [ ] Phase 3: ADRs
- [ ] Phase 4: skills
- [ ] Phase 5: review agents
- [ ] Phase 6: CLAUDE.md and AGENTS.md additions
- [ ] Phase 7: self-check and final report

## Files created or appended
Phase 0: all five files in `docs/context/` created.

## Open conflicts
See `docs/context/corrections.md` items 22-28.

## Skill and agent overlaps with `.devin/`
(filled in Phases 4-5)
