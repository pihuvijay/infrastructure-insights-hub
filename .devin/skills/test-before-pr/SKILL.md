---
name: test-before-pr
description: Checks to run before opening any pull request - install, lint, type-check, build, tests, run the app, click through changed flows, check the console, and take screenshots. Use before every PR and whenever asked to verify that something works.
---

# Test Before PR

A PR is only opened when everything below passes, or when each failure is explained in the PR description. Test what changed plus a quick smoke test of the rest; don't re-test everything for a one-line fix.

## Step 1 - Automated checks
Use the project's own scripts (check `package.json`, Makefile or README). Run in order and fix failures:
1. Install dependencies (only if they changed)
2. Lint - zero errors; fix new warnings you introduced
3. Type-check (e.g. `npx tsc --noEmit`)
4. Build - must succeed
5. Tests - all must pass. If you changed logic with clear rules (calculations, validation, date/time handling, permissions), add or update a unit test.

## Step 2 - Run the app
- Start the dev server using the project's script.
- Use the project's primary viewport first (phone size for mobile apps, desktop for web apps).
- Sign in with seeded or test users for each role the change affects. Make sure seed data is loaded.

## Step 3 - Click through the changed flows
- Open each changed screen the way a user would reach it.
- Try every button, input and gesture that changed.
- Try edge cases: empty data, loading (slow network), error (offline), long text.
- If a checklist or spec exists, spot-check its ticked items.
- Smoke test: open every other main screen once.

## Step 4 - Console and network
- No new console errors or warnings.
- No failed network requests (except ones caused on purpose).
- No sensitive data sent where it should not be.

## Step 5 - Layout and theme
- Check each supported theme and screen size.
- No overflow or hidden content. Tap targets large enough (44px on touch).

## Step 6 - Screenshots
Screenshot each changed screen and attach to the PR.

## Step 7 - PR description
```
## What changed
<1-3 lines>

## Spec / checklist
<path> - X / Y done. Blocked: <items + reason>

## Checks
- Lint / Types / Build / Tests: pass|fail
- Manual: pass
- Console: clean

## Screenshots
<images>
```
