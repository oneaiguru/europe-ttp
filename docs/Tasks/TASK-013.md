# TASK-013: TTC Evaluation - Open TTC evaluation

## Task Information
- **ID**: TASK-013
- **Name**: TTC Evaluation: Open TTC evaluation
- **Priority**: p2
- **Feature File**: `specs/features/forms/ttc_evaluation.feature`

## Scenario
```gherkin
Scenario: Open TTC evaluation
  Given I am authenticated as an evaluator
  When I open the TTC evaluation form
  Then I should see the TTC evaluation questions
```

## Steps Needing Implementation

All three steps need to be implemented:

1. **Given I am authenticated as an evaluator**
   - Status: In step registry but Python path points to line 1 (not implemented)
   - Registry shows: `test/python/steps/forms_steps.py:1`
   - TypeScript path: `test/typescript/steps/forms_steps.ts:1`

2. **When I open the TTC evaluation form**
   - Status: In step registry but Python path points to line 1 (not implemented)
   - Registry shows: `test/python/steps/forms_steps.py:1`
   - TypeScript path: `test/typescript/steps/forms_steps.ts:1`

3. **Then I should see the TTC evaluation questions**
   - Status: In step registry but Python path points to line 1 (not implemented)
   - Registry shows: `test/python/steps/forms_steps.py:1`
   - TypeScript path: `test/typescript/steps/forms_steps.ts:1`

## Acceptance Criteria
- [ ] Python step definitions exist and pass
- [ ] TypeScript step definitions exist and pass
- [ ] All BDD scenarios in `ttc_evaluation.feature` pass in both Python and TypeScript
- [ ] Step registry updated with correct line numbers
- [ ] Alignment verification passes (0 orphan, 0 dead steps)

## Notes
- This is a basic "I open X → I see Y" scenario (Phase 1)
- Similar to other form-opening scenarios that are already complete
- Should follow patterns from completed form steps like `ttc_application_us.feature`
