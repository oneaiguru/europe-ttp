# TASK-005: Disabled Page - View disabled page

## Goal
Implement disabled page BDD steps so the disabled notice scenario passes in both Python and TypeScript.

## Feature File
`specs/features/portal/disabled.feature`

## Failing Scenario
Scenario: View disabled page

## Steps Needing Implementation
- Given the TTC portal is in disabled mode
  - Python: `test/python/steps/portal_steps.py`
  - TypeScript: `test/typescript/steps/portal_steps.ts`
- When I visit the disabled page
  - Python: `test/python/steps/portal_steps.py`
  - TypeScript: `test/typescript/steps/portal_steps.ts`
- Then I should see the disabled notice
  - Python: `test/python/steps/portal_steps.py`
  - TypeScript: `test/typescript/steps/portal_steps.ts`

## Acceptance Criteria
- [ ] Scenario "View disabled page" passes in Python
- [ ] Scenario "View disabled page" passes in TypeScript
- [ ] `bun run bdd:verify` passes (no orphan/dead steps)
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes
- [ ] docs/coverage_matrix.md updated

## Files to Create/Modify
- [ ] `test/python/steps/portal_steps.py`
- [ ] `test/typescript/steps/portal_steps.ts`
- [ ] `test/bdd/step-registry.ts`
- [ ] `docs/coverage_matrix.md`
- [ ] `IMPLEMENTATION_PLAN.md`
- [ ] `docs/SESSION_HANDOFF.md`

## Test Commands
```bash
bun scripts/bdd/run-python.ts features/portal/disabled.feature
bun scripts/bdd/run-typescript.ts specs/features/portal/disabled.feature
bun scripts/bdd/verify-alignment.ts
bun run typecheck
bun run lint
```

## Blockers / Notes
- `bun scripts/bdd/run-python.ts specs/features/` fails because the runner expects paths under `features/` in `test/python`.
