# TASK-E2E-010: Certificate Generation Gated by Completion

## Task Information
- **Task ID**: TASK-E2E-010
- **Name**: Certificate Generation Gated by Completion
- **Priority**: p1 (Critical path - blocks basic functionality)
- **Estimated Hours**: 4
- **Status**: TODO
- **Feature File**: `specs/features/e2e/certificate_gating.feature`

## Scenarios
1. Generate certificate when all requirements complete
2. Certificate blocked when evaluations missing
3. Certificate blocked when post-TTC feedback missing

## Steps Requiring Implementation

### Scenario 1: Generate certificate when all requirements complete
- `Given applicant has completed all TTC requirements:` (with table)
- `And I am authenticated as admin`
- `When I request a certificate PDF for "test.applicant@example.com"`
- `Then a certificate PDF should be generated`
- `And the certificate should include the applicant's name`
- `And the certificate should include the TTC completion date`

### Scenario 2: Certificate blocked when evaluations missing
- `Given applicant has submitted TTC application`
- `But applicant has only 1 evaluation (requires 2)`
- `And I am authenticated as admin`
- `When I request a certificate PDF for "test.applicant@example.com"`
- `Then certificate generation should be blocked`
- `And I should see the reason: "Missing evaluations (1/2 required)"`

### Scenario 3: Certificate blocked when post-TTC feedback missing
- `Given applicant has completed TTC and evaluations`
- `But post-TTC co-teacher feedback is missing`
- `When I request a certificate PDF for "test.applicant@example.com"`
- `Then certificate generation should be blocked`
- `And I should see the reason: "Missing co-teacher feedback"`

## Acceptance Criteria
- All 3 scenarios pass in Python
- All 3 scenarios pass in TypeScript
- Step registry updated with all new steps
- No orphan or dead steps in alignment check

## Related Files
- Feature: `specs/features/e2e/certificate_gating.feature`
- Python steps: `test/python/steps/certificate_steps.py` (to be created)
- TypeScript steps: `test/typescript/steps/certificate_steps.ts` (to be created)
- Legacy code: `reporting/certificate.py` (reference for implementation)

## Notes from PRD (Appendix A6)
When admin generates certificate:
- Certificate exists only if required forms complete + pass criteria met
- Else show reason (missing evaluation, missing self-eval, etc)
