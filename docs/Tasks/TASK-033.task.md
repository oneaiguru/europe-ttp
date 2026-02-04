# TASK-033: Print Form Feature

## Task Information
- **Task ID**: TASK-033
- **Priority**: p3 (Nice to have - can defer)
- **Feature File**: `specs/features/reports/print_form.feature`
- **Status**: 🔴 FAILED - Steps not implemented

## Feature Description
As a admin user, I want to print a form, So that review printable form output

## Scenario: Print a form
```gherkin
Given I am authenticated as an admin user
When I open a printable form page
Then I should see a printable form view
```

## Current Status

### Python BDD
- **Status**: ❌ FAILED
- **Output**:
  - 1 step passed ("I open a printable form page")
  - 2 steps undefined:
    - `Given I am authenticated as an admin user` (exists in registry but implementation issue)
    - `Then I should see a printable form view` (NOT IMPLEMENTED)
- **Error**:
  ```
  @then(u'I should see a printable form view')
  def step_impl(context):
      raise NotImplementedError(u'STEP: Then I should see a printable form view')
  ```

### TypeScript BDD
- **Status**: ⚠️ UNKNOWN (module resolution issues prevent running)

### Step Registry
- **Entry**: `test/bdd/step-registry.ts:368-373`
- **Pattern**: `/^I\ should\ see\ a\ printable\ form view$/`
- **Python Path**: `test/python/steps/reports_steps.py:1` (INCORRECT - should point to actual line)
- **TypeScript Path**: `test/typescript/steps/reports_steps.ts:1` (INCORRECT - should point to actual line)

## Steps Needing Implementation

1. **Python Step Definition**:
   - **File**: `test/python/steps/reports_steps.py`
   - **Step**: `Then I should see a printable form view`
   - **Line**: Not implemented

2. **TypeScript Step Definition**:
   - **File**: `test/typescript/steps/reports_steps.ts`
   - **Step**: `Then I should see a printable form view`
   - **Line**: Not implemented

3. **Step Registry Update**:
   - Correct line numbers for both Python and TypeScript implementations

## Acceptance Criteria
- [ ] Python step implemented in `test/python/steps/reports_steps.py`
- [ ] TypeScript step implemented in `test/typescript/steps/reports_steps.ts`
- [ ] Step registry updated with correct line numbers
- [ ] Python BDD tests pass for `specs/features/reports/print_form.feature`
- [ ] TypeScript BDD tests pass for `specs/features/reports/print_form.feature`
- [ ] `verify-alignment.ts` passes (0 orphan, 0 dead steps)

## Related Tasks
- TASK-032: user_report.feature (similar reporting feature)
- TASK-031: user_integrity.feature (similar reporting feature)
- TASK-030: user_summary.feature (similar reporting feature)
