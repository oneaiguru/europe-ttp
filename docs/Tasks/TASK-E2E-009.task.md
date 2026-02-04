# TASK-E2E-009: Full Evaluator Workflow

## Task Details
- **ID**: TASK-E2E-009
- **Name**: Full Evaluator Workflow
- **Feature File**: `specs/features/e2e/full_evaluator_workflow.feature`
- **Priority**: p2
- **Estimated Hours**: 3

## Scenarios
1. Evaluator views and evaluates applicant
2. Role-based visibility - evaluator cannot see other evaluators' submissions
3. Evaluator can only evaluate assigned applicants

## Steps Requiring Implementation

### Scenario 1: Evaluator views and evaluates applicant
1. `applicant "Test Applicant" has submitted TTC application for "test_us_future"` - NEW
2. `applicant has uploaded photo and required documents` - NEW
3. `I am authenticated as evaluator with email "test.evaluator1@example.com"` - EXISTS (line 749-753)
4. `I open the TTC evaluation form for "test.applicant@example.com"` - NEW
5. `I should see the applicant's submitted application data` - NEW
6. `I should see the applicant's uploaded photo` - NEW
7. `I should see the applicant's uploaded documents` - NEW
8. `I submit the evaluation with:` - NEW (table parameter)
9. `the evaluation status should update to "submitted"` - NEW
10. `the applicant should see the evaluation in their portal` - NEW

### Scenario 2: Role-based visibility
1. `evaluator A has submitted an evaluation for applicant` - NEW
2. `I am authenticated as evaluator B` - NEW
3. `I view the applicant's evaluation summary` - NEW
4. `I should NOT see evaluator A's private evaluation notes` - NEW
5. `I should see that an evaluation was submitted` - NEW

### Scenario 3: Evaluator can only evaluate assigned applicants
1. `I am authenticated as evaluator with email "test.evaluator1@example.com"` - EXISTS
2. `I attempt to access evaluation for unassigned applicant` - NEW
3. `I should see "not authorized" or "not assigned" error` - NEW

## Acceptance Criteria
- All 3 scenarios pass in Python
- All 3 scenarios pass in TypeScript
- Step registry updated with all new steps
- No orphan steps or dead steps after implementation
- Typecheck passes
- Lint passes

## Related PRD Section
Maps to PRD Appendix A4 - Evaluator workflow (teacher review)
- Given evaluator authenticated
- When they open assigned applicant
- Then they can see submitted application + uploads
- When they fill evaluation and submit
- Then evaluation status updates
- And applicant/admin sees evaluation recorded (role-based visibility)
