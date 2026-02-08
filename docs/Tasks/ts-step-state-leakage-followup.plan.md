# TASK-072: TypeScript Step State Leakage Followup - Implementation Plan

## Summary
Add missing property resets to the Before hook in `e2e_api_steps.ts` to prevent cross-scenario state leakage.

## Implementation Steps

### Step 1: Add Missing Property Resets to Before Hook
File: `test/typescript/steps/e2e_api_steps.ts`
Location: Lines 111-139 (Before hook)

Add the following property resets after line 138 (after `delete testContext.flaggedMissingFeedback;`):

```typescript
  // Reset E2ETestContext extended properties
  delete testContext.applicantUploads;
  delete testContext.currentApplicantEmail;
  delete testContext.currentApplicantSubmission;
  delete testContext.currentView;
  delete testContext.field_errors;
```

**Rationale:**
- `applicantUploads` - Lazy-initialized in evaluator workflow steps, needs reset
- `currentApplicantEmail` - Set when opening TTC evaluation form, needs reset
- `currentApplicantSubmission` - Set when opening TTC evaluation form, needs reset
- `currentView` - Set when viewing evaluation summary, needs reset
- `field_errors` - Set in validation_steps.ts, used across scenarios

All are optional properties on testContext, so using `delete` is the correct pattern (consistent with existing resets for optional properties like `currentEmail`, `currentRole`, etc.).

## Verification Commands

```bash
# 1. Verify step registry alignment
bun run bdd:verify

# 2. Run TypeScript BDD tests
bun run bdd:typescript

# 3. Type checking
bun run typecheck

# 4. Linting
bun run lint
```

## Expected Outcome
- All 5 missing properties are now reset between scenarios
- All existing BDD tests continue to pass
- No cross-scenario state leakage

## Risks / Rollback
- **Risk**: None - these are pure additions to the Before hook that delete properties. The properties are lazily re-initialized as needed in the step functions.
- **Rollback**: If issues arise, simply remove the 5 new delete statements from the Before hook.

## Notes
- The base `testContext.applicantSubmissions` (line 118 reset) and `E2ETestContext.applicantSubmissions` (line 907) are the same property, so no additional reset is needed.
- `flaggedMissingFeedback` is already properly deleted at line 137.
