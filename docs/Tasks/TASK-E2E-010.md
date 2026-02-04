# TASK-E2E-010: Certificate Generation Gated by Completion

## Task Definition

**Task ID**: TASK-E2E-010
**Name**: Certificate Generation Gated by Completion
**Priority**: p1 (Critical)
**Feature File**: `specs/features/e2e/certificate_gating.feature`

## Scenarios

1. **Generate certificate when all requirements complete**
   - Given applicant has completed all TTC requirements
   - And I am authenticated as admin
   - When I request a certificate PDF for "test.applicant@example.com"
   - Then a certificate PDF should be generated
   - And the certificate should include the applicant's name
   - And the certificate should include the TTC completion date

2. **Certificate blocked when evaluations missing**
   - Given applicant has submitted TTC application
   - But applicant has only 1 evaluation (requires 2)
   - And I am authenticated as admin
   - When I request a certificate PDF for "test.applicant@example.com"
   - Then certificate generation should be blocked
   - And I should see the reason: "Missing evaluations (1/2 required)"

3. **Certificate blocked when post-TTC feedback missing**
   - Given applicant has completed TTC and evaluations
   - But post-TTC co-teacher feedback is missing
   - When I request a certificate PDF for "test.applicant@example.com"
   - Then certificate generation should be blocked
   - And I should see the reason: "Missing co-teacher feedback"

## Current Status

According to step registry, steps are defined in:
- Python: `test/python/steps/certificate_steps.py`
- TypeScript: `test/typescript/steps/certificate_steps.ts`

## Implementation Status

### Step Definitions - ✅ COMPLETE
- Python: `test/python/steps/certificate_steps.py` (260 lines, 12 steps)
- TypeScript: `test/typescript/steps/certificate_steps.ts` (350 lines, 12 steps)
- All 17 feature steps have matching step definitions

### Step Registry - ✅ COMPLETE
- All steps registered in `test/bdd/step-registry.ts`
- Registry entries reference correct file locations

### Verification Status - ✅ COMPLETE
All BDD tests pass and alignment verified:

**Python BDD Tests:**
```
1 feature passed, 0 failed, 0 skipped
3 scenarios passed, 0 failed, 0 skipped
17 steps passed, 0 failed, 0 skipped, 0 undefined
Took 0m0.026s
```

**TypeScript BDD Tests:**
```
3 scenarios (3 passed)
17 steps (17 passed)
0m00.069s (executing steps: 0m00.007s)
```

**Alignment Check:**
- ✓ 190 steps defined in registry
- ✓ 0 orphan steps for certificate_gating.feature
- ✓ 0 dead steps for certificate_gating.feature
- All certificate_gating steps properly registered and implemented

## Acceptance Criteria

- [x] All 3 scenarios pass in Python BDD tests
- [x] All 3 scenarios pass in TypeScript BDD tests
- [x] Step registry alignment verified (0 orphan, 0 dead steps)
- [x] Implementation follows legacy behavior

## Task Status: ✅ COMPLETE

All acceptance criteria met. TASK-E2E-010 is complete and verified.
