# TASK-E2E-013: Course Eligibility by User Profile

## Task Information

- **Task ID**: TASK-E2E-013
- **Name**: Course Eligibility by User Profile
- **Feature File**: `specs/features/e2e/course_eligibility_by_profile.feature`
- **Priority**: p2 (Important)
- **Status**: PARTIAL → IN PROGRESS

## Current State

### Python Tests
- ✅ Step implementations exist: `test/python/steps/eligibility_dashboard_steps.py` (241 lines)
- ✅ Steps defined: 8 step functions for eligibility dashboard
- ❌ Step registry entries: MISSING

### TypeScript Tests
- ❌ Step implementations: MISSING
- ❌ Step registry entries: MISSING

### Step Registry Status
The following steps are "dead" (in features but not in registry):
1. `I view my course eligibility dashboard`
2. `I should see a list of available courses with prerequisites:`
3. `I attempt to access the DSN application form`
4. `I should see "not available" message`
5. `the message should explain the prerequisite: "{string}"`
6. `the DSN form shows as "not available"`
7. `I refresh the eligibility dashboard`
8. `the DSN form should show as "available"`

## Scenarios

### Scenario 1: Eligibility shows required prerequisites
- Feature: `specs/features/e2e/course_eligibility_by_profile.feature:6`
- Steps: 1 Given, 1 When, 1 Then with data table

### Scenario 2: Ineligible user gets "not available" message
- Feature: `specs/features/e2e/course_eligibility_by_profile.feature:17`
- Steps: 1 Given, 1 When, 2 Then

### Scenario 3: Eligibility updates after completing prerequisite
- Feature: `specs/features/e2e/course_eligibility_by_profile.feature:24`
- Steps: 2 Given, 1 When, 1 Then

## Acceptance Criteria

1. All 8 steps added to step registry with Python and TypeScript paths
2. Python tests pass (3 scenarios)
3. TypeScript step implementation created
4. TypeScript tests pass (3 scenarios)
5. `verify-alignment.ts` passes (0 orphan, 0 dead)

## Implementation Notes

### Python Steps (existing, in `test/python/steps/eligibility_dashboard_steps.py`)
- `@when('I view my course eligibility dashboard')` - Line 116
- `@then('I should see a list of available courses with prerequisites:')` - Line 125
- `@when('I attempt to access the DSN application form')` - Line 156
- `@then('I should see "not available" message')` - Line 182
- `@then('the message should explain the prerequisite: "{explanation}"')` - Line 196
- `@given('the DSN form shows as "not available"')` / `@then(...)` - Line 211
- `@when('I refresh the eligibility dashboard')` - Line 223
- `@then('the DSN form should show as "available"')` - Line 233

### TypeScript Steps (to create in `test/typescript/steps/eligibility_dashboard_steps.ts`)
- Mirror the Python implementations
- Use similar context management pattern

## Next Steps

Research phase: Verify Python step implementations work correctly and understand the eligibility context model.
