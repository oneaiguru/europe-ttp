# TASK-E2E-010B: Implement Missing Generic Authentication Step

## Summary
Add the missing step definition `I am authenticated as {string}` to support parameterized authentication by email only in E2E scenarios.

## Feature File
- **Path**: `specs/features/e2e/home_country_changes_available_ttcs.feature`
- **Scenario**: "User from each country sees correct TTC options" (lines 34-44)

## Failing Step
```gherkin
Given I am authenticated as "<email>"
```

## Step Pattern
```gherkin
I am authenticated as {string}
```

## Acceptance Criteria
1. Python step definition exists in `test/python/steps/e2e_api_steps.py`
2. TypeScript step definition exists in `test/typescript/steps/e2e_api_steps.ts`
3. Step registry entry exists in `test/bdd/step-registry.ts`
4. Scenario passes in both Python and TypeScript BDD tests

## Context
The feature file `home_country_changes_available_ttcs.feature` uses a Scenario Outline with an `email` parameter. The existing steps use `I am authenticated as {string} with email {string}` pattern, but the feature needs a simpler pattern that just takes an email and infers the role.

The step should:
1. Accept an email string
2. Look up the user from test fixtures
3. Set the current user context with the inferred role from the user data

## Related Files
- `specs/features/e2e/home_country_changes_available_ttcs.feature`
- `test/python/steps/e2e_api_steps.py`
- `test/typescript/steps/e2e_api_steps.ts`
- `test/bdd/step-registry.ts`
