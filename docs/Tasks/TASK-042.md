# TASK-042: Fix Draft Step Registration and Add Missing Step

## Metadata
- **Task ID**: TASK-042
- **Name**: Fix Draft Step Registration and Add Missing Step
- **Feature File**: `specs/features/e2e/draft_save_and_resume.feature`
- **Priority**: P1 (Blocking E2E scenarios)

## Scenario
**Scenario**: Save partial application and resume after logout (line 6)

## Failing Steps

### Step 1: Fix Step Registration in Python
- **Step**: `When I complete the remaining required fields and submit`
- **Issue**: Step exists in `test/python/steps/draft_steps.py:64` but is not registered by behave
- **Root Cause**: Blank lines between `@when`/`@then` decorators and function definitions
- **Files to Modify**: `test/python/steps/draft_steps.py`

### Step 2: Add Missing "Marked as Submitted" Step
- **Step**: `Then the application should be marked as submitted`
- **Issue**: Step not implemented in Python or TypeScript
- **Similar Steps**: "the TTC application should be marked as submitted" exists in `e2e_api_steps.py:379`
- **Note**: This is a generic version for draft submission context

## Acceptance Criteria

1. Python BDD tests pass for `specs/features/e2e/draft_save_and_resume.feature:6`
2. All steps in the scenario are properly registered
3. Step registry is updated with any new step definitions
4. TypeScript implementation follows (after Python passes)

## Related Files
- `test/python/steps/draft_steps.py` - Fix registration issues
- `test/typescript/steps/draft_steps.ts` - Ensure TypeScript mirrors Python
- `test/bdd/step-registry.ts` - Update if needed

## Notes
- Behave requires decorators to be immediately adjacent to function definitions (no blank lines)
- Multiple blank lines found in `draft_steps.py` before step decorators
- Generic "application should be marked as submitted" step is needed for draft context
