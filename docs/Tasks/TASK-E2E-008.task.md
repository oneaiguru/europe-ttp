# TASK-E2E-008: Validation Errors (A3)

## Task Information
- **Task ID**: TASK-E2E-008
- **Name**: Validation Errors
- **Priority**: p1 (Critical path)
- **Feature File**: `specs/features/e2e/validation_errors.feature` (TO BE CREATED)
- **Status**: Research needed

## Description
Implement BDD scenarios and step definitions for field-level validation errors when users submit incomplete or invalid forms. This ensures clear error feedback to users.

## Feature File Specification

The feature file needs to be created with the following scenarios:

```gherkin
Feature: Validation Errors
  As a TTC applicant
  I want to see clear field-level errors when I submit incomplete forms
  So that I know exactly what needs to be fixed

  Scenario: Submit with missing required fields
    Given I am authenticated as a TTC applicant
    When I submit the TTC application form with missing required fields:
      | missing_field | error_message |
      | i_fname | First name is required |
      | i_lname | Last name is required |
      | i_email | Email is required |
    Then I should see field-level errors
    And the submission should be blocked
    And my draft data should remain intact

  Scenario: Submit with invalid email format
    Given I am authenticated as a TTC applicant
    When I submit the TTC application with an invalid email format
    Then I should see an email format validation error
    And the submission should be blocked

  Scenario: Submit past deadline shows deadline error
    Given test mode is disabled (real deadline enforcement)
    And TTC option has display_until in the past
    And I am authenticated as a TTC applicant
    When I attempt to submit the TTC application
    Then I should see "deadline expired" error message
    And the form should not be marked as submitted
```

## Steps Requiring Implementation

1. **Given I am authenticated as a TTC applicant** - Already exists in e2e_api_steps
2. **When I submit the TTC application form with missing required fields** - NEW
3. **Then I should see field-level errors** - NEW
4. **And the submission should be blocked** - NEW
5. **And my draft data should remain intact** - NEW
6. **When I submit the TTC application with an invalid email format** - NEW
7. **Then I should see an email format validation error** - NEW
8. **Given test mode is disabled (real deadline enforcement)** - Already exists
9. **And TTC option has display_until in the past** - NEW
10. **When I attempt to submit the TTC application** - NEW (reuse existing)
11. **Then I should see {string} error message** - NEW
12. **And the form should not be marked as submitted** - NEW

## Acceptance Criteria
- [ ] Feature file created at `specs/features/e2e/validation_errors.feature`
- [ ] All step definitions implemented in Python (`test/python/steps/validation_steps.py` - NEW FILE)
- [ ] All step definitions implemented in TypeScript (`test/typescript/steps/validation_steps.ts` - NEW FILE)
- [ ] Step registry updated with all new steps
- [ ] Python BDD tests pass for all 3 scenarios
- [ ] TypeScript BDD tests pass for all 3 scenarios
- [ ] `verify-alignment.ts` passes (0 orphan, 0 dead)

## Legacy Context
The legacy Python code (form.py, ttc_portal.py) handles validation through:
- Form field validation in `FormHandler.validate()` method
- Required field checks
- Email format validation
- Deadline enforcement logic

## Notes
- This task implements PRD Appendix A, requirement A3
- Field-level validation errors are critical for user experience
- Draft preservation on failed submission prevents data loss
