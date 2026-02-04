# TASK-042 Plan: Fix Draft Step Registration and Add Missing Step

## Summary
Fix BDD step registration issues for draft save and resume feature by correcting step text mismatches between feature file and step definitions.

## Problem Analysis

### Issue 1: Step Text Mismatch for "fill in partially with"
**Location**: `specs/features/e2e/draft_save_and_resume.feature:8`
**Current**: `When I fill in the TTC application form partially with:`
**Python Step**: `@when('I fill in the TTC application form partially with:')` at `draft_steps.py:16`
**Status**: Step IS implemented and registered, but behave reports it as undefined

**Root Cause**: The step pattern matching may be failing due to:
1. Colon at end of step text (table parameter steps end with `:` in feature files)
2. Behave version 1.2.6 may have issues with table parameter step matching
3. The step signature uses `def step_fill_partial_form(context, doc):` where `doc` is the table parameter

**Verification**: Running `behave --steps-catalog` shows the step IS loaded, but running the actual feature shows it as undefined.

### Issue 2: Missing Generic "application should be marked as submitted" Step
**Location**: `specs/features/e2e/draft_save_and_resume.feature:19`
**Current Feature Text**: `Then the application should be marked as submitted`
**Existing Step**: `Then the TTC application should be marked as submitted` at `e2e_api_steps.py:379`

**Root Cause**: The feature file uses generic "application" but the step definition expects "TTC application".

**Solution Options**:
1. **Option A**: Update feature file to use "TTC application" (simple, maintains consistency)
2. **Option B**: Add a new generic step "the application should be marked as submitted" (more flexible)
3. **Option C**: Make existing step more flexible with regex pattern

**Recommendation**: **Option A** - Update feature file to match existing step, since:
- The draft is specifically for TTC application
- Existing step is already implemented and tested
- Maintains consistency with other E2E scenarios
- Avoids code duplication

## Implementation Plan

### Step 1: Update Feature File (Option A)
**File**: `specs/features/e2e/draft_save_and_resume.feature`
**Line 19**: Change `Then the application should be marked as submitted`
**To**: `Then the TTC application should be marked as submitted`

**Rationale**: Matches existing step at `e2e_api_steps.py:379` which is already implemented and tested.

### Step 2: Verify Table Parameter Step Matching
**File**: `test/python/steps/draft_steps.py`
**Line 16**: Verify step signature correctly handles table parameter

**Current code**:
```python
@when('I fill in the TTC application form partially with:')
def step_fill_partial_form(context, doc):
```

**Note**: The `doc` parameter is the table data. This should work with behave 1.2.6.

**Investigation needed**:
- Check if behave requires table parameter steps to have specific naming
- Verify table parameter is correctly passed to the function
- May need to use `context.table` instead of `doc` parameter in behave 1.2.6

### Step 3: Update Step Registry (if needed)
**File**: `test/bdd/step-registry.ts`

The registry currently has:
```typescript
'I fill in the TTC application form partially with:': {
  pattern: /^I\ fill\ in\ the\ TTC\ application\ form\ partially\ with:$/,
  python: 'test/python/steps/draft_steps.py:16',
  typescript: 'test/typescript/steps/draft_steps.ts:42',
  features: ['specs/features/e2e/draft_save_and_resume.feature:8'],
}
```

This is correct. No changes needed unless we modify the feature file.

### Step 4: Test and Verify
Run Python BDD tests:
```bash
cd /workspace/test/python
behave features/e2e/draft_save_and_resume.feature
```

Expected result: All steps should be defined and scenario should pass (or fail on business logic, not step registration).

## Acceptance Criteria

1. [ ] Feature file updated with correct step text
2. [ ] Python BDD tests run without "undefined step" errors
3. [ ] Scenario 1 passes or fails on business logic (not step registration)
4. [ ] Step registry remains accurate
5. [ ] TypeScript step definitions remain in sync

## Verification Commands

```bash
# Verify step registry alignment
bun scripts/bdd/verify-alignment.ts

# Run Python BDD tests
cd /workspace/test/python
behave features/e2e/draft_save_and_resume.feature

# Run TypeScript BDD tests (after Python passes)
bun scripts/bdd/run-typescript.ts specs/features/e2e/draft_save_and_resume.feature

# Type check
bun run typecheck

# Lint
bun run lint
```

## Files to Modify

1. `specs/features/e2e/draft_save_and_resume.feature` - Update line 19
2. `test/bdd/step-registry.ts` - Only if step patterns change
3. `test/python/steps/draft_steps.py` - Only if table parameter handling needs fix
4. `test/typescript/steps/draft_steps.ts` - Mirror Python changes

## Notes

- Behave 1.2.6 is the version available with Python 2.7
- Table parameter steps end with `:` in feature files
- The `doc` parameter in step function receives the table data
- May need to use `context.table` instead of named parameter for table data
- Research suggests behave 1.2.6 has some quirks with table parameter matching

## Next Steps

1. Update feature file line 19 to use "TTC application"
2. Test to see if table parameter step still shows as undefined
3. If still undefined, investigate table parameter handling in behave 1.2.6
4. Consider alternative step patterns if needed
