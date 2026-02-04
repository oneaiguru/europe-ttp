# TASK-E2E-012: Form Prerequisites and Conditional Availability

## Task ID
TASK-E2E-012

## Name
Form Prerequisites and Conditional Availability

## Feature File
`specs/features/e2e/form_prerequisites_conditional.feature`

## Priority
p2 (Important - completes a feature area)

## PRD Mapping
PRD Appendix A7 - DSN + Silence / Happiness / Part 1 / Part 2 conditional logic (domain-based)

## Scenarios
1. DSN form available after Happiness Program completion
2. YES++ form requires Part 1 and Part 2 completion
3. Part 1 availability requires Happiness Program
4. Part 2 availability requires Part 1 completion
5. Form eligibility changes based on home country

## Current Status
🔴 TODO - No step implementations exist

## Steps Needing Implementation

### Scenario 1: DSN form available after Happiness Program completion
- `Given I am authenticated as applicant with email "test.applicant@example.com"` (EXISTS in e2e_api_steps)
- `When I have NOT completed the Happiness Program` (NEW)
- `Then the DSN application form should NOT be available` (NEW)
- `When I complete the Happiness Program` (NEW)
- `Then the DSN application form should become available` (NEW)

### Scenario 2: YES++ form requires Part 1 and Part 2 completion
- `Given I am authenticated as applicant with email "test.applicant@example.com"` (EXISTS)
- `When I have completed Part 1 but NOT Part 2` (NEW)
- `Then the YES+ application form should NOT be available` (NEW)
- `When I complete Part 2` (NEW)
- `Then the YES+ application form should become available` (NEW)

### Scenario 3: Part 1 availability requires Happiness Program
- `Given I am authenticated as applicant with email "test.applicant@example.com"` (EXISTS)
- `When I have NOT completed the Happiness Program` (NEW - reuse from scenario 1)
- `Then the Part 1 course application should NOT be available` (NEW)
- `When I complete the Happiness Program` (NEW - reuse from scenario 1)
- `Then the Part 1 course application should become available` (NEW)

### Scenario 4: Part 2 availability requires Part 1 completion
- `Given I am authenticated as applicant with email "test.applicant@example.com"` (EXISTS)
- `When I have NOT completed Part 1` (NEW)
- `Then the Part 2 course application should NOT be available` (NEW)
- `When I complete Part 1` (NEW)
- `Then the Part 2 course application should become available` (NEW)

### Scenario 5: Form eligibility changes based on home country
- `Given I am authenticated as applicant with email "test.applicant@example.com"` (EXISTS)
- `When my home country is "US"` (NEW or reuse from home_country_changes)
- `Then US-specific TTC options should be available` (NEW)
- `And India-specific TTC options should NOT be available` (NEW)
- `When I update my home country to "IN"` (EXISTS in home_country_changes)
- `Then India-specific TTC options should become available` (NEW)

## Acceptance Criteria
- All 5 scenarios pass in Python BDD tests
- All 5 scenarios pass in TypeScript BDD tests
- Step registry updated with all new steps
- No orphan or dead steps in alignment check
- `typecheck` passes
- `lint` passes

## Estimated Hours
3

## Dependencies
None (depends on TASK-E2E-005 for home country context)

## Notes
This task implements conditional form availability based on:
1. Course completion prerequisites (Happiness Program → Part 1 → Part 2)
2. Home country filtering (US vs India)
3. Domain-specific business logic for form eligibility

The steps should integrate with existing user profile and form availability systems.
