# TASK-080: tighten-ts-bdd-step-assertions - Implementation Plan

## Overview
Add meaningful assertions to TypeScript BDD steps that currently lack proper validation or have tautological/weak assertions.

## Issues to Fix

### 1. `uploads_steps.ts` - Tautological Length Check (Low Priority)
**Location**: Lines 48-49, 73-74

**Problem**: After checking `!this.uploadKey` (which catches empty string), checking `length === 0` is unreachable dead code.

**Fix**: Remove the redundant length checks in both:
- `Then('I should receive a signed URL and upload key for the photo'...)` (line 48-49)
- `Then('I should receive a signed URL and upload key for the document'...)` (line 73-74)

### 2. `form_prerequisites_steps.ts` - Missing India Options Verification (Medium Priority)
**Location**: Lines 280-286

**Problem**: The step `India-specific TTC options should become available` only checks country is 'IN', but doesn't verify India-specific forms exist.

**Fix**: Add verification that `ttc_application_in` exists in `available_forms` after country is set to 'IN'. This requires modifying `updateAvailableForms()` to add India-specific forms when `home_country === 'IN'`.

### 3. `api_steps.ts` - Ignored Parameters (Medium Priority)
**Location**: Lines 227-233

**Problem**: Step accepts `key` and `value` parameters but ignores them entirely.

**Fix**: Since this is a body size check scenario and the route doesn't return body JSON, clarify the step name and remove unused parameters, OR store response body for validation. Simpler approach: rename step to reflect what it actually validates.

### 4. `e2e_api_steps.ts` - Weak Fuzzy Matching Assertions (Medium Priority)
**Location**: Lines 710-713, 716-719

**Problem**: Steps only verify evaluations array is non-empty, not that specific matching mechanisms were used.

**Fix**: Add proper assertions:
- For name fallback: verify evaluation was matched via name (not email)
- For fuzzy email: verify email normalization happened

**Note**: This requires the test context to store metadata about which matching method was used. May require changes to how evaluations are recorded in test context.

## Implementation Steps

### Step 1: Fix `uploads_steps.ts` tautological checks
1. Remove line 48-49 (redundant length check in photo step)
2. Remove line 73-74 (redundant length check in document step)

### Step 2: Fix `form_prerequisites_steps.ts` India options
1. Modify `updateAvailableForms()` to add India-specific forms when `home_country === 'IN'`:
   - Add `ttc_application_in` to forms list
2. Update `Then('India-specific TTC options should become available'...)` to verify `ttc_application_in` exists in `available_forms`

### Step 3: Fix `api_steps.ts` ignored parameters
1. Clarify the step purpose by renaming or documenting actual behavior
2. Option A: Remove unused parameters and rename to `the API response should indicate success or payload too large`
3. Option B: Store response body and validate key/value pair

**Decision**: Option A is simpler and more honest about what the step does.

### Step 4: Fix `e2e_api_steps.ts` fuzzy matching assertions
1. First, check how evaluations are recorded in test context (read earlier in file)
2. Add metadata to test context about matching method
3. Update assertions to verify the specific matching method was used

## Files to Modify

| File | Lines | Change |
|------|-------|--------|
| `test/typescript/steps/uploads_steps.ts` | 48-49, 73-74 | Remove redundant length checks |
| `test/typescript/steps/form_prerequisites_steps.ts` | 60-88, 280-286 | Add India form logic + verify |
| `test/typescript/steps/api_steps.ts` | 227-233 | Rename/refactor for clarity |
| `test/typescript/steps/e2e_api_steps.ts` | 710-713, 716-719 | Add proper fuzzy matching verification |

## Test Commands

```bash
# Verify step registry remains aligned
bun run bdd:verify

# Run TypeScript BDD tests for affected features
bun run bdd:typescript specs/features/uploads/*.feature
bun run bdd:typescript specs/features/e2e/*.feature

# Type checking
bun run typecheck

# Linting
bun run lint
```

## Risks

1. **Breaking existing features**: The India form change affects `updateAvailableForms()` which is called by multiple steps. Need to ensure existing tests still pass.

2. **e2e_api_steps.ts complexity**: Adding proper fuzzy matching verification may require broader changes to how evaluations are tracked. Consider deferring if too complex.

3. **Step registry**: Any step name changes in `api_steps.ts` will require updating feature files.

## Rollback Plan

If tests fail after changes:
1. Revert each file independently to identify the problematic change
2. For e2e_api_steps.ts, if metadata tracking is too invasive, document as technical debt instead

## Acceptance Verification

- [ ] All `Then` steps in referenced files have meaningful assertions
- [ ] No steps merely set state without validating expected conditions
- [ ] Error messages are validated where applicable
- [ ] `bun run bdd:verify` passes (no orphan steps)
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes
