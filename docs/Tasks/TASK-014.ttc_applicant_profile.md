# TASK-014: TTC Applicant Profile Form

## Task ID
TASK-014

## Feature File
`specs/features/forms/ttc_applicant_profile.feature`

## Scenario
**Open TTC applicant profile** (Line 7)

## Steps Needing Implementation

### Python (test/python/steps/forms_steps.py)
- `When I open the TTC applicant profile form` - NEW
- `Then I should see the TTC applicant profile questions` - NEW

### TypeScript (test/typescript/steps/forms_steps.ts)
- `When I open the TTC applicant profile form` - NEW
- `Then I should see the TTC applicant profile questions` - NEW

## Current Status
- Step `Given I am authenticated as a TTC applicant` - ✅ Already implemented (forms_steps.py:29)
- Step `When I open the TTC applicant profile form` - ❌ Not implemented
- Step `Then I should see the TTC applicant profile questions` - ❌ Not implemented

## Acceptance Criteria
- [ ] Python steps implemented and passing
- [ ] TypeScript steps implemented and passing
- [ ] BDD scenario passes in both Python and TypeScript
- [ ] Step registry updated with correct file paths
- [ ] `verify-alignment.ts` passes (0 orphan, 0 dead)

## Notes
This is a basic "I open X → I see Y" scenario for the TTC applicant profile form.
The form should display profile-related questions to authenticated TTC applicants.

## Priority
p2
