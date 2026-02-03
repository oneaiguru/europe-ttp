# TASK-004: Portal Home - View portal home

## Goal
Implement portal home BDD steps so the portal home scenario passes in both Python and TypeScript.

## Feature File
`specs/features/portal/home.feature`

## Failing Scenario
Scenario: View portal home

## Steps Needing Implementation
- When I open the TTC portal home
  - Python: `test/python/steps/portal_steps.py`
  - TypeScript: `test/typescript/steps/portal_steps.ts`
- Then I should see my profile details and available reports
  - Python: `test/python/steps/portal_steps.py`
  - TypeScript: `test/typescript/steps/portal_steps.ts`

## Acceptance Criteria
- [ ] Scenario "View portal home" passes in Python
- [ ] Scenario "View portal home" passes in TypeScript
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
bun scripts/bdd/run-python.ts features/portal/home.feature
bun scripts/bdd/run-typescript.ts specs/features/portal/home.feature
bun scripts/bdd/verify-alignment.ts
bun run typecheck
bun run lint
```

## Blockers / Notes
- `bun scripts/bdd/run-python.ts specs/features/` fails because the runner expects paths under `features/` in `test/python`.
- `test/python/steps/portal_steps.py` and `test/typescript/steps/portal_steps.ts` are currently skeletons with no step definitions.
