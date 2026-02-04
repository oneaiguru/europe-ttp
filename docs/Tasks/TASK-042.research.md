# TASK-042 Research: Fix Draft Step Registration and Add Missing Step

## Task Summary
Fix step registration issues in draft_steps.py and add a missing "marked as submitted" step for draft submission context.

---

## Issue 1: Step Registration Problem in Python

### Problem Statement
The step `When I complete the remaining required fields and submit` exists in `test/python/steps/draft_steps.py:64` but is not being registered by behave.

### Root Cause Analysis
The issue described in the task mentions "blank lines between `@when`/`@then` decorators and function definitions."

However, after examining `test/python/steps/draft_steps.py` (lines 64-94), I found:
- **No blank lines between the decorator and function definition** at line 64
- The decorator `@when('I complete the remaining required fields and submit')` is immediately followed by the function definition `def step_complete_and_submit(context):`

### Actual Code Locations

**File**: `test/python/steps/draft_steps.py`

**Line 64-94** - Step implementation exists and appears correctly formatted:
```python
@when('I complete the remaining required fields and submit')
def step_complete_and_submit(context):
    """Complete the form with remaining fields and submit."""
    # ... implementation
```

### Investigation Notes
1. The step IS registered in the step registry at `test/bdd/step-registry.ts:894-898`
2. The step IS implemented in Python at `test/python/steps/draft_steps.py:64`
3. The step IS implemented in TypeScript at `test/typescript/steps/draft_steps.ts:88`

**Recommendation**: Run the actual BDD test to verify if there's a real registration issue or if this was already fixed. The task may have been created before the code was corrected.

---

## Issue 2: Missing Generic "Marked as Submitted" Step

### Problem Statement
The step `Then the application should be marked as submitted` is not implemented in Python or TypeScript.

### Current State
The step **IS** actually implemented:

**Python**: `test/python/steps/e2e_api_steps.py:379`
**TypeScript**: `test/typescript/steps/e2e_api_steps.ts:479`
**Registry**: `test/bdd/step-registry.ts:942-946`

```python
@then('the application should be marked as submitted')
def step_application_submitted(context):
    """Verify the application was marked as submitted."""
    assert hasattr(context, 'last_submission'), 'No submission found'
    assert context.last_submission.get('status') == 'submitted', \
        'Application is not marked as submitted'
```

### Registry Entry
```typescript
'the application should be marked as submitted': {
  pattern: /^the\ application\ should\ be\ marked\ as\ submitted$/,
  python: 'test/python/steps/e2e_api_steps.py:379',
  typescript: 'test/typescript/steps/e2e_api_steps.ts:479',
  features: ['specs/features/e2e/draft_save_and_resume.feature:19'],
},
```

### Related Steps
There is also a more specific step:
- `the TTC application should be marked as submitted` - used in other E2E features

The generic version `the application should be marked as submitted` is appropriate for the draft context since it's not form-type-specific.

---

## Step Registry Verification

All steps from `specs/features/e2e/draft_save_and_resume.feature` are registered:

| Step Text | Registry Location | Python Impl | TS Impl |
|-----------|-------------------|-------------|---------|
| I am authenticated as a TTC applicant | step-registry.ts:14-18 | forms_steps.py:29 | forms_steps.ts:17 |
| I fill in the TTC application form partially with: | step-registry.ts:876-880 | draft_steps.py:16 | draft_steps.ts:42 |
| I save the application as draft | step-registry.ts:882-886 | draft_steps.py:36 | draft_steps.ts:66 |
| I sign out of the TTC portal | step-registry.ts:488-492 | auth_steps.py:105 | auth_steps.ts:61 |
| I sign in with a valid Google account | step-registry.ts:482-486 | auth_steps.py:69 | auth_steps.ts:41 |
| I open the TTC application form | step-registry.ts:936-940 | draft_steps.py:96 | draft_steps.ts:145 |
| I should see my draft data persisted | step-registry.ts:888-892 | draft_steps.py:48 | draft_steps.ts:74 |
| I complete the remaining required fields and submit | step-registry.ts:894-898 | draft_steps.py:64 | draft_steps.ts:88 |
| the application should be marked as submitted | step-registry.ts:942-946 | e2e_api_steps.py:379 | e2e_api_steps.ts:479 |

**Status**: All steps are registered and implemented.

---

## Implementation Notes

### Python Context Management
The `step_complete_and_submit` function (draft_steps.py:64-94) properly:
1. Gets existing draft data from context
2. Adds remaining required fields
3. Marks as submitted with status and timestamp
4. Sets `context.last_submission` for compatibility with existing assertion steps

### Existing Pattern for Submission Assertions
The existing step at `e2e_api_steps.py:379` expects:
- `context.last_submission` to exist
- `context.last_submission['status']` to equal `'submitted'`

The draft_steps.py implementation at line 89-93 already creates this context structure, so the assertion should work correctly.

---

## TypeScript Context

The TypeScript implementation mirrors the Python:
- `test/typescript/steps/draft_steps.ts:88` - `I complete the remaining required fields and submit`
- `test/typescript/steps/e2e_api_steps.ts:479` - `the application should be marked as submitted`

---

## Verification Commands

To verify the actual state of the tests:
```bash
# Run Python BDD tests for the draft feature
npx tsx scripts/bdd/run-python.ts specs/features/e2e/draft_save_and_resume.feature

# Run TypeScript BDD tests for the draft feature
npx tsx scripts/bdd/run-typescript.ts specs/features/e2e/draft_save_and_resume.feature

# Verify step registry alignment
npx tsx scripts/bdd/verify-alignment.ts
```

---

## Conclusion

Based on code examination:

1. **Issue 1 (Step Registration)**: The code appears correctly formatted with no blank lines between decorators and functions. The step is properly registered. The actual test run should determine if there's a remaining issue.

2. **Issue 2 (Missing Step)**: The step `the application should be marked as submitted` IS implemented in both Python (e2e_api_steps.py:379) and TypeScript (e2e_api_steps.ts:479), and is registered in the step registry.

**Next Step**: Run the actual BDD tests to determine if there are still failures. If tests pass, this task may already be complete and just needs cleanup verification.
