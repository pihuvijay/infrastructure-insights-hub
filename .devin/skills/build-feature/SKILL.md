---
name: build-feature
description: Step-by-step recipe for building or changing any screen or feature so that EVERY requirement in the spec/PRD is implemented. Creates a checklist from the spec, builds against it, verifies each item, then hands off to tester and reviewer subagents. Use for any feature or UI work when a spec, PRD or requirements doc exists.
---

# Build a Feature (spec-complete)

Goal: **nothing in the spec gets skipped.** Turn the spec section into a checklist, build against it, and you are not done until every item is ticked and verified.

## Step 0 - Scope
- Identify exactly one screen/feature for this session. List the others under "Next steps".
- If the project has a design-system skill or doc, read it.

## Step 1 - Read only the relevant spec
- Find the spec (e.g. `docs/PRD.md`, `SPEC.md`, README). If none exists, ask the human for requirements.
- Read the section for this feature plus any global rules (navigation, design rules, data model, safety/privacy).

## Step 2 - Create the checklist
Create `docs/checklists/<feature>.md` (continue it if it exists):

```markdown
# Checklist: <Feature>
Spec section: <heading>
Status: in progress

## From the spec (copied bullet by bullet)
- [ ] <requirement>

## Hidden requirements
- [ ] Follows design tokens / existing components
- [ ] Loading, empty and error states
- [ ] Works at target screen sizes and themes
- [ ] Accessible tap targets and labels
- [ ] Real data with correct permissions

## Open questions
## Blocked
```

Rules: copy every requirement; split compound bullets; keep exact numbers, labels and timings; include behaviours and "if nothing" cases; never merge, reword or drop items.

## Step 3 - Short plan (max ~15 lines)
Components to reuse or create, data/queries needed, build order, open questions. Wait for approval unless told to proceed.

## Step 4 - Build order
Data first, layout skeleton, hero element, remaining sections one at a time, sheets/dialogs, behaviours (timers, pagination, gestures), loading/empty/error states, theme check. Update the checklist after each item.

## Step 5 - Ticking rules
- Tick only when you have SEEN it working in the running app.
- Partly done: leave unticked with a note.
- Cannot be done: move to Blocked with a reason. Never delete items.

## Step 6 - Self-check
All items ticked or Blocked, then run the `test-before-pr` skill.

## Step 7 - Hand off (once)
- `tester` subagent: feature name, checklist path, how to open it.
- `reviewer` subagent: checklist path, spec section, changed files.
- Fix what they report; re-verify small fixes yourself.

## Step 8 - Finish
Set Status to done/blocked and reply with: what was built, `X / Y items done`, blocked items, screenshots, next steps.
