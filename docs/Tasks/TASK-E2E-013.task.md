# TASK-E2E-013: Course Eligibility by User Profile

## Task ID
TASK-E2E-013

## Name
Course Eligibility by User Profile: Eligibility shows required prerequisites

## Feature File
`specs/features/e2e/course_eligibility_by_profile.feature`

## Scenarios
1. Eligibility shows required prerequisites
2. Ineligible user gets "not available" message
3. Eligibility updates after completing prerequisite

## Steps Needing Implementation

### Python Steps (test/python/steps/)
All 10 steps are undefined in Python:

1. `When I view my course eligibility dashboard`
2. `Then I should see a list of available courses with prerequisites` (with data table)
3. `Given I have NOT completed the Happiness Program`
4. `When I attempt to access the DSN application form`
5. `Then I should see "not available" message`
6. `Then the message should explain the prerequisite: "Complete Happiness Program first"`
7. `Given the DSN form shows as "not available"`
8. `When I refresh the eligibility dashboard`
9. `Then the DSN form should show as "available"`
10. `Given I have NOT completed the Happiness Program` (duplicate)

### TypeScript Steps (test/typescript/steps/)
Same 10 steps need TypeScript implementation

## Acceptance Criteria
- [ ] All 3 scenarios pass in Python BDD tests
- [ ] All 3 scenarios pass in TypeScript BDD tests
- [ ] Step registry updated with new steps
- [ ] No orphan steps (verify-alignment.ts passes)
- [ ] No dead steps (verify-alignment.ts passes)

## Notes
- This task implements A7 from PRD Appendix A - eligibility dashboard
- Maps to form availability based on user profile and prerequisites
- Relates to TASK-E2E-012 (form prerequisites conditional) which is already done
- Need to check existing prerequisite tracking in form_prerequisites_steps.py
