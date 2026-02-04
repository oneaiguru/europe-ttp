# TASK-031: User Integrity Report Implementation

## Task ID
TASK-031

## Feature File
`specs/features/reports/user_integrity.feature`

## Priority
p1 (Critical path - blocks basic functionality)

## Scenarios to Implement

### Scenario 1: Load user integrity (p1)
```gherkin
Given I am authenticated as an admin user
When I run the user integrity report load job
Then a user integrity file should be generated
```

### Scenario 2: Get user integrity by user (p2)
```gherkin
Given I am authenticated as an admin user
When I request the user integrity report by user
Then I should receive the user integrity data
```

### Scenario 3: Run user integrity postload (p2)
```gherkin
Given I am authenticated as an admin user
When I run the user integrity postload job
Then an applicant enrolled list should be generated
```

## Steps Needing Implementation

### TypeScript Steps (test/typescript/steps/reports_steps.ts)
The following step definitions are MISSING in TypeScript:

1. `When I run the user integrity report load job` - Line 9
2. `Then a user integrity file should be generated` - Line 10
3. `When I request the user integrity report by user` - Line 15
4. `Then I should receive the user integrity data` - Line 16
5. `When I run the user integrity postload job` - Line 21
6. `Then an applicant enrolled list should be generated` - Line 22

### Python Steps (test/python/steps/reports_steps.py)
Check if Python implementation exists.

## Acceptance Criteria

- [ ] All 3 scenarios pass in Python BDD tests
- [ ] All 3 scenarios pass in TypeScript BDD tests
- [ ] Step registry updated with correct line numbers
- [ ] `bun run bdd:verify` passes (0 orphan, 0 dead)
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes

## Current Status

According to step registry, these steps are mapped to:
- Python: `test/python/steps/reports_steps.py:1`
- TypeScript: `test/typescript/steps/reports_steps.ts:1`

However, the TypeScript file only contains user summary report steps, not user integrity steps.

## Notes

- The step registry entries for these steps point to line 1, which is incorrect
- Need to verify Python implementation exists first
- Need to add missing TypeScript step implementations
- Need to update step registry with correct line numbers after implementation
