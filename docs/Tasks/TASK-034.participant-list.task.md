# TASK-034: Participant List - Generate participant list

## Task Definition
- **Task ID**: TASK-034
- **Name**: Participant List: Generate participant list
- **Priority**: p2
- **Feature File**: `specs/features/reports/participant_list.feature`

## Feature: Participant List
```gherkin
Feature: Participant List
  As a admin user
  I want to download participant lists
  So that review enrollment totals

  @p2 @needs-verification
  Scenario: Generate participant list
    Given I am authenticated as an admin user
    When I request the participant list report
    Then I should receive the participant list output
```

## Steps Requiring Implementation

### Step 1: "I request the participant list report"
- **Type**: When
- **Status**: NOT IMPLEMENTED
- **Expected Behavior**: Call the participant list report endpoint

### Step 2: "I should receive the participant list output"
- **Type**: Then
- **Status**: NOT IMPLEMENTED
- **Expected Behavior**: Verify the response contains participant list data

### Step 3: "I am authenticated as an admin user"
- **Type**: Given
- **Status**: Already implemented
- **Python Path**: `test/python/steps/admin_steps.py:92`

## Acceptance Criteria
- [ ] Scenario passes in Python BDD
- [ ] Scenario passes in TypeScript BDD
- [ ] Step registry is accurate and up-to-date
- [ ] `verify-alignment.ts` passes (0 orphan, 0 dead)
- [ ] `typecheck` passes
- [ ] `lint` passes
- [ ] Update IMPLEMENTATION_PLAN.md to mark TASK-034 as ✅ DONE
- [ ] Remove ACTIVE_TASK.md

## Notes
This task implements the participant list report functionality. Admin users can generate a list of all participants/enrolled users for review purposes.
