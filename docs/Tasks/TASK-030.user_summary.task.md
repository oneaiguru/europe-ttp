# TASK-030: User Summary Report

## Task Information
- **Task ID**: TASK-030
- **Name**: User Summary Report
- **Priority**: P1 (Critical path)
- **Feature File**: `specs/features/reports/user_summary.feature`
- **Status**: 🟡 IN PROGRESS

## Feature File

```gherkin
Feature: User Summary Report
  As a admin user
  I want to generate and view the user summary
  So that review applicant status

  @p1 @needs-verification
  Scenario: Load user summary
    Given I am authenticated as an admin user
    When I run the user summary report load job
    Then a user summary file should be generated

  @p2 @needs-verification
  Scenario: Get user summary by user
    Given I am authenticated as an admin user
    When I request the user summary report by user
    Then I should receive the user summary data
```

## Failing Steps

All steps need implementation in both Python and TypeScript:

### Scenario 1: Load user summary (3 undefined steps)
- `When I run the user summary report load job`
- `Then a user summary file should be generated`

### Scenario 2: Get user summary by user (2 undefined steps)
- `When I request the user summary report by user`
- `Then I should receive the user summary data`

Note: `Given I am authenticated as an admin user` is already implemented in `test/python/steps/admin_steps.py:92`

## Acceptance Criteria

- [ ] Scenario 1 passes in Python: Load user summary generates a file
- [ ] Scenario 2 passes in Python: Get user summary by user returns data
- [ ] Scenario 1 passes in TypeScript
- [ ] Scenario 2 passes in TypeScript
- [ ] Step registry updated with all new steps
- [ ] `verify-alignment.ts` passes (0 orphan, 0 dead)

## Implementation Notes

This requires implementing user summary report functionality:
1. **Report load job**: Background job that generates summary data for all users
2. **Get by user**: API endpoint to retrieve summary for a specific user

The legacy Python code should have the report generation logic that needs to be replicated.
