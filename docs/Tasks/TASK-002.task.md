# TASK-002: Logout from portal

## Goal
Implement logout flow steps so authenticated users can sign out and land on the TTC portal login page.

## Feature File
`specs/features/auth/logout.feature`

## Scenario
Logout from portal

## Step Definitions Required
- `Given I am authenticated on the TTC portal`
- `When I sign out of the TTC portal`
- `Then I should be redirected to the TTC portal login page`

## Legacy Reference
- TBD in research phase

## Acceptance Criteria
- [ ] Scenario "Logout from portal" passes in Python
- [ ] Scenario "Logout from portal" passes in TypeScript
- [ ] `bun run bdd:verify` passes (no orphan steps)
- [ ] `bun run typecheck` passes
- [ ] docs/coverage_matrix.md updated

## Files to Create/Modify
- [ ] `test/python/steps/auth_steps.py`
- [ ] `test/typescript/steps/auth_steps.ts`
- [ ] `test/bdd/step-registry.ts` (line numbers after implementation)

## Test Commands
```bash
bun scripts/bdd/run-python.ts specs/features/auth/logout.feature
bun scripts/bdd/run-typescript.ts specs/features/auth/logout.feature
bun scripts/bdd/verify-alignment.ts
bun run typecheck
bun run lint
```
