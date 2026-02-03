# TASK-001: Login with Google account

## Goal
Implement login BDD steps so the Google sign-in scenario passes in both Python and TypeScript.

## Feature File
`specs/features/auth/login.feature`

## Failing Scenario
Scenario: Login with Google account

## Steps Needing Implementation
- Given I am on the TTC portal login page
  - Python: `test/python/steps/auth_steps.py`
  - TypeScript: `test/typescript/steps/auth_steps.ts`
- When I sign in with a valid Google account
  - Python: `test/python/steps/auth_steps.py`
  - TypeScript: `test/typescript/steps/auth_steps.ts`
- Then I should be redirected to the TTC portal home
  - Python: `test/python/steps/auth_steps.py`
  - TypeScript: `test/typescript/steps/auth_steps.ts`

## Acceptance Criteria
- [ ] Scenario "Login with Google account" passes in Python
- [ ] Scenario "Login with Google account" passes in TypeScript
- [ ] `bun run bdd:verify` passes (no orphan/dead steps)
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes
- [ ] docs/coverage_matrix.md updated

## Files to Create/Modify
- [ ] `test/python/steps/auth_steps.py`
- [ ] `test/typescript/steps/auth_steps.ts`
- [ ] `test/bdd/step-registry.ts`
- [ ] `docs/coverage_matrix.md`
- [ ] `IMPLEMENTATION_PLAN.md`
- [ ] `docs/SESSION_HANDOFF.md`

## Test Commands
```bash
bun scripts/bdd/run-python.ts features/auth/login.feature
bun scripts/bdd/run-typescript.ts specs/features/auth/login.feature
bun scripts/bdd/verify-alignment.ts
bun run typecheck
bun run lint
```

## Blockers / Notes
- Python BDD currently fails to start due to a Python 2.7 `SyntaxError` in `test/python/steps/e2e_api_steps.py:60` (f-strings). This must be fixed before any Python BDD scenario can run.
