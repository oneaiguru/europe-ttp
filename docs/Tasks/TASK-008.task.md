# TASK-008: Admin Permissions - Non-admin blocked

## Goal
Implement admin permissions BDD steps so the non-admin access scenario passes in both Python and TypeScript.

## Feature File
`specs/features/admin/permissions.feature`

## Failing Scenario
Scenario: Non-admin blocked

## Steps Needing Implementation
- Given I am authenticated as a non-admin user
  - Python: `test/python/steps/admin_steps.py`
  - TypeScript: `test/typescript/steps/admin_steps.ts`
- When I open an admin-only page
  - Python: `test/python/steps/admin_steps.py`
  - TypeScript: `test/typescript/steps/admin_steps.ts`
- Then I should see an unauthorized message
  - Python: `test/python/steps/admin_steps.py`
  - TypeScript: `test/typescript/steps/admin_steps.ts`

## Acceptance Criteria
- [ ] Scenario "Non-admin blocked" passes in Python
- [ ] Scenario "Non-admin blocked" passes in TypeScript
- [ ] `bun run bdd:verify` passes (no orphan/dead steps)
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes
- [ ] docs/coverage_matrix.md updated

## Files to Create/Modify
- [ ] `test/python/steps/admin_steps.py`
- [ ] `test/typescript/steps/admin_steps.ts`
- [ ] `test/bdd/step-registry.ts`
- [ ] `docs/coverage_matrix.md`
- [ ] `IMPLEMENTATION_PLAN.md`
- [ ] `docs/SESSION_HANDOFF.md`

## Test Commands
```bash
bun scripts/bdd/run-python.ts features/admin/permissions.feature
bun scripts/bdd/run-typescript.ts specs/features/admin/permissions.feature
bun scripts/bdd/verify-alignment.ts
bun run typecheck
bun run lint
```

## Blockers / Notes
- `bun scripts/bdd/run-python.ts specs/features/` fails because the runner expects paths under `features/` in `test/python`.
- TypeScript run shows undefined steps for this scenario; the admin step files appear to be skeletons.
