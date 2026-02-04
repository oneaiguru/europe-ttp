# TASK-015: TTC Evaluator Profile Form

## Task Information
- **Task ID**: TASK-015
- **Priority**: p2
- **Status**: TODO
- **Feature File**: `specs/features/forms/ttc_evaluator_profile.feature`

## Scenario to Implement

```gherkin
Scenario: Open TTC evaluator profile
  Given I am authenticated as an evaluator
  When I open the TTC evaluator profile form
  Then I should see the TTC evaluator profile questions
```

## Step Definitions Needed

### Step 1: "I am authenticated as an evaluator"
- **Status**: ✅ EXISTS in `test/python/steps/forms_steps.py:123`
- **Registry**: ✅ MAPPED
- **Notes**: Already implemented for TTC evaluation feature

### Step 2: "I open the TTC evaluator profile form"
- **Status**: ❌ MISSING
- **Registry Entry**: `test/python/steps/forms_steps.py:1` (placeholder)
- **Implementation**: Needs to be created

### Step 3: "I should see the TTC evaluator profile questions"
- **Status**: ❌ MISSING
- **Registry Entry**: `test/python/steps/forms_steps.py:1` (placeholder)
- **Implementation**: Needs to be created

## Acceptance Criteria

The following scenarios must pass in BOTH Python and TypeScript:

1. ✅ "Open TTC evaluator profile" - Single scenario in feature file

## Implementation Notes

- This is a basic form access scenario (no submission logic)
- Similar pattern to other form access steps (TTC application, TTC evaluation, etc.)
- Need to verify the evaluator profile form exists in legacy code
- Should return form schema/structure questions

## Related Tasks

- TASK-004: TTC Evaluation (depends on evaluator profile)
- TASK-E2E-002: Evaluation matching workflows

## Registry Updates Needed

1. Update step registry entries for:
   - `I open the TTC evaluator profile form` → actual line numbers
   - `I should see the TTC evaluator profile questions` → actual line numbers
