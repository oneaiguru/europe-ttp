# TASK-012: TTC Application (Non-US)

## Task Information
- **Task ID**: TASK-012
- **Name**: TTC Application (Non-US)
- **Priority**: p2
- **Feature File**: `specs/features/forms/ttc_application_non_us.feature`

## Scenario Details

### Scenario: Open TTC application (non-US)
```gherkin
@p2 @needs-verification
Scenario: Open TTC application (non-US)
    Given I am authenticated as a TTC applicant
    When I open the TTC application form for a non-US country
    Then I should see the TTC application questions for that country
```

## Current Status
- **Python**: ❌ Undefined steps (2 steps missing)
- **TypeScript**: ❌ Not yet implemented

## Steps Requiring Implementation

### Python Steps (Undefined)
1. `When I open the TTC application form for a non-US country`
   - Location: `test/python/steps/forms_steps.py`
   - Status: Not implemented

2. `Then I should see the TTC application questions for that country`
   - Location: `test/python/steps/forms_steps.py`
   - Status: Not implemented

### TypeScript Steps (To be implemented)
1. `I open the TTC application form for a non-US country`
   - Location: `test/typescript/steps/forms_steps.ts`
   - Status: Not implemented

2. `I should see the TTC application questions for that country`
   - Location: `test/typescript/steps/forms_steps.ts`
   - Status: Not implemented

## Step Registry Entries
Currently registered in `test/bdd/step-registry.ts`:
- `I open the TTC application form for a non-US country`: python: `test/python/steps/forms_steps.py:1` (placeholder), typescript: `test/typescript/steps/forms_steps.ts:1` (placeholder)
- `I should see the TTC application questions for that country`: python: `test/python/steps/forms_steps.py:1` (placeholder), typescript: `test/typescript/steps/forms_steps.ts:1` (placeholder)

## Acceptance Criteria
- [ ] Python step definitions implemented and passing
- [ ] TypeScript step definitions implemented and passing
- [ ] Step registry updated with correct line numbers
- [ ] `verify-alignment.ts` passes (0 orphan, 0 dead)
- [ ] `typecheck` passes
- [ ] `lint` passes

## Dependencies
- TASK-001 (Auth/login) - ✅ Complete
- TASK-011 (TTC Application US) - ⚠️ Partially complete (Python passes, TypeScript unknown)

## Notes
- This is similar to TASK-011 (TTC Application US) but for non-US countries
- May need to handle country-specific form variants
- Should reuse existing patterns from TASK-011 implementation
