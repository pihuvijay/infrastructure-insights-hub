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
- [x] Phase 3: ADRs 0001-0026 plus `docs/adr/README.md` index (ADR 0013 is Proposed)
- [x] Phase 4: 21 skills in `.claude/skills/`
- [x] Phase 5: `.claude/agents/code-reviewer.md`, `security-reviewer.md`
- [x] Phase 6: CLAUDE.md (34 to 68 lines) and AGENTS.md (9 to 43 lines) appended; `git diff --numstat` shows 0 deletions for both
- [x] Phase 7: self-check. Links all resolve; 26 ADRs with all five sections (0013 is short because it is Proposed with TODO alternatives); 21 skills with all required sections; PRD.md, README.md, package.json, .env.example, src/, .devin/, docs/checklists/ show no diff vs main. Final line counts: PRD 129, CLAUDE 68, AGENTS 43, README 153, .env.example 4, package.json 91, commands.md 146, build-plan.md 860 (all equal or higher).

## Files created or appended
Phase 0: all five files in `docs/context/` created.

## Open conflicts
See `docs/context/corrections.md` items 22-29. No conflicts were found inside CLAUDE.md or AGENTS.md.

## Skill and agent overlaps with `.devin/`
- `.devin/agents/reviewer` (spec completeness, design, RLS) overlaps in purpose with the new `code-reviewer`. Kept both. `code-reviewer` references the `.devin` reviewer as complementary. The `.devin` reviewer mentions RLS (Supabase), which does not apply to this stack; suggestion only, see `corrections.md`.
- `.devin/agents/tester` has no new equivalent; kept as is.
- `.devin/skills/build-feature` and `test-before-pr` have no overlap with the 21 new skills. `connect-frontend-endpoint` and `docs/testing.md` reference them instead of repeating them.
- `.devin/agents/reviewer` has no `security-reviewer` counterpart; the new one is additive.
