# TASK-007: Admin Access - Admin accesses admin dashboard

## Goal
Implement admin access BDD steps so the admin dashboard scenario passes in both Python and TypeScript.

## Feature File
`specs/features/admin/access.feature`

## Failing Scenario
Scenario: Admin accesses admin dashboard

## Steps Needing Implementation
- Given I am authenticated as an admin user
  - Python: `test/python/steps/admin_steps.py`
  - TypeScript: `test/typescript/steps/admin_steps.ts`
- When I open the admin dashboard page
  - Python: `test/python/steps/admin_steps.py`
  - TypeScript: `test/typescript/steps/admin_steps.ts`
- Then I should see the admin dashboard content
  - Python: `test/python/steps/admin_steps.py`
  - TypeScript: `test/typescript/steps/admin_steps.ts`

## Acceptance Criteria
- [ ] Scenario "Admin accesses admin dashboard" passes in Python
- [ ] Scenario "Admin accesses admin dashboard" passes in TypeScript
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
bun scripts/bdd/run-python.ts features/admin/access.feature
bun scripts/bdd/run-typescript.ts specs/features/admin/access.feature
bun scripts/bdd/verify-alignment.ts
bun run typecheck
bun run lint
```

## Blockers / Notes
- `bun scripts/bdd/run-python.ts specs/features/` fails because the runner expects paths under `features/` in `test/python`.
- `bun scripts/bdd/run-python.ts features/` reports this scenario as failing with unimplemented steps; admin-related step files are skeletons.
