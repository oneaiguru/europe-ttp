# TASK-017: Post-TTC Feedback

## Task Information
- **ID**: TASK-017
- **Name**: Post-TTC Feedback
- **Priority**: p2
- **Feature File**: `specs/features/forms/post_ttc_feedback.feature`
- **Status**: 🔴 TODO

## Feature File Location
`specs/features/forms/post_ttc_feedback.feature`

## Scenario
```gherkin
Feature: Post-TTC Feedback
  As a TTC graduate
  I want to submit post-TTC feedback
  So that provide feedback on the course

  @p2 @needs-verification
  Scenario: Open post-TTC feedback
    Given I am authenticated as a TTC graduate
    When I open the post-TTC feedback form
    Then I should see the post-TTC feedback questions
```

## Steps Needing Implementation

### Step 1: "I am authenticated as a TTC graduate"
- **Type**: Given
- **Status**: ✅ Already implemented in both Python and TypeScript
- **Python**: `test/python/steps/forms_steps.py:178`
- **TypeScript**: `test/typescript/steps/forms_steps.ts:238`

### Step 2: "I open the post-TTC feedback form"
- **Type**: When
- **Status**: ❌ NOT IMPLEMENTED
- **Python**: Needs implementation in `test/python/steps/forms_steps.py`
- **TypeScript**: Needs implementation in `test/typescript/steps/forms_steps.ts`

### Step 3: "I should see the post-TTC feedback questions"
- **Type**: Then
- **Status**: ❌ NOT IMPLEMENTED
- **Python**: Needs implementation in `test/python/steps/forms_steps.py`
- **TypeScript**: Needs implementation in `test/typescript/steps/forms_steps.ts`

## Current Step Registry Status
The steps are in the registry but have placeholder paths:
- `I open the post-TTC feedback form`: python: `:1`, typescript: `:1` (NEEDS UPDATE)
- `I should see the post-TTC feedback questions`: python: `:1`, typescript: `:1` (NEEDS UPDATE)

## Acceptance Criteria
- [ ] Python step definition for "I open the post-TTC feedback form" passes
- [ ] Python step definition for "I should see the post-TTC feedback questions" passes
- [ ] TypeScript step definition for "I open the post-TTC feedback form" passes
- [ ] TypeScript step definition for "I should see the post-TTC feedback questions" passes
- [ ] Step registry updated with correct line numbers
- [ ] BDD alignment check passes (0 orphan, 0 dead steps)

## Notes
- Follow the same pattern as other post-TTC forms (post_ttc_self_evaluation, post_sahaj_ttc_feedback, post_sahaj_ttc_self_evaluation)
- Use fallback HTML pattern for TypeScript implementation
- Ensure form title contains "Post-TTC feedback" or similar
- Ensure form contains a div with id like "post-ttc-feedback-form"
