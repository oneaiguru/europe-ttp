# TASK-E2E-011: Reporting Integrity Checks

## Task ID
TASK-E2E-011

## Task Name
Reporting Integrity Checks Implementation

## Feature File
`specs/features/e2e/reporting_integrity_checks.feature`

## Priority
p2 (Important - completes data quality feature area)

## Description
Implement BDD step definitions for the Reporting Integrity Checks feature, which allows administrators to identify and fix data quality issues including:
- Missing uploads (e.g., photos, documents)
- Incomplete forms (applications started but not submitted)
- Mismatched user IDs (evaluations submitted with wrong email)

## Scenarios

### Scenario 1: Integrity report flags missing uploads
**Steps needing implementation:**
1. `Given applicant has submitted TTC application` (new variant - without course parameter)
2. `But applicant has NOT uploaded required photo` (new step)
3. `Then "{string}" should be flagged for missing photo` (new step)
4. `And the integrity report should show the missing upload type` (new step)

### Scenario 2: Integrity report flags incomplete forms
**Steps needing implementation:**
1. `Given applicant has started TTC application but not submitted` (new step)
2. `Then "{string}" should be flagged for incomplete application` (new step)
3. `And the report should show the application status as "incomplete"` (new step)

### Scenario 3: Integrity report flags mismatched user IDs
**Steps needing implementation:**
1. `Given evaluation was submitted with email "{string}"` (new step)
2. `But applicant exists with email "{string}"` (new step)
3. `Then the evaluation should be flagged as unmatched` (new step)
4. `And the report should show the mismatched email` (new step)

### Scenario 4: Download integrity report as CSV
**Steps needing implementation:**
1. `When I download the integrity report as CSV` (new step)
2. `Then the CSV should contain columns: email, flags, missing_uploads, incomplete_forms, mismatches` (new step)
3. `And the CSV should be downloadable via admin dashboard` (new step)

## Existing Steps (Already in Registry)
- `And I run the user integrity report` → existing step from user_integrity.feature

## Acceptance Criteria
- [ ] All 4 scenarios pass in Python BDD tests
- [ ] All 4 scenarios pass in TypeScript BDD tests
- [ ] All new steps added to `test/bdd/step-registry.ts`
- [ ] `bun scripts/bdd/verify-alignment.ts` passes with 0 orphan steps, 0 dead steps

## Related PRD Section
PRD Appendix A, A8) Reporting integrity checks (P2)

## Notes
- This feature builds on the existing `user_integrity.feature` steps
- Focus on data quality flags for: missing uploads, incomplete forms, mismatched IDs
- CSV download functionality is key for admin workflows
