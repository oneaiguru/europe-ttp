# TASK-006: Portal Tabs - Render tabbed HTML

## Goal
Implement portal tab rendering BDD steps so the tab template scenario passes in both Python and TypeScript.

## Feature File
`specs/features/portal/tabs.feature`

## Failing Scenario
Scenario: Render tabbed HTML

## Steps Needing Implementation
- When I request a tab template page
  - Python: `test/python/steps/portal_steps.py`
  - TypeScript: `test/typescript/steps/portal_steps.ts`
- Then I should see the rendered tab content with user context
  - Python: `test/python/steps/portal_steps.py`
  - TypeScript: `test/typescript/steps/portal_steps.ts`

## Acceptance Criteria
- [ ] Scenario "Render tabbed HTML" passes in Python
- [ ] Scenario "Render tabbed HTML" passes in TypeScript
- [ ] `bun scripts/bdd/verify-alignment.ts` passes (no orphan/dead steps)
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes
- [ ] `docs/coverage_matrix.md` updated

## Files to Create/Modify
- [ ] `test/python/steps/portal_steps.py`
- [ ] `test/typescript/steps/portal_steps.ts`
- [ ] `test/bdd/step-registry.ts`
- [ ] `docs/coverage_matrix.md`
- [ ] `IMPLEMENTATION_PLAN.md`
- [ ] `docs/SESSION_HANDOFF.md`

## Test Commands
```bash
bun scripts/bdd/run-python.ts features/portal/tabs.feature
bun scripts/bdd/run-typescript.ts specs/features/portal/tabs.feature
bun scripts/bdd/verify-alignment.ts
bun run typecheck
bun run lint
```

## Blockers / Notes
- `bun scripts/bdd/run-python.ts specs/features/` fails because the runner expects paths under `features/` in `test/python`.
