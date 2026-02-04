# TASK-020: TTC Portal Settings

## Task ID
TASK-020

## Task Name
TTC Portal Settings: Open TTC portal settings

## Feature File
`specs/features/forms/ttc_portal_settings.feature`

## Scenario
Open TTC portal settings

## Steps Needing Implementation
1. **Given** `I am authenticated as a TTC admin` - UNDEFINED
2. **When** `I open the TTC portal settings form` - UNDEFINED
3. **Then** `I should see the TTC portal settings questions` - UNDEFINED

## Current Status
- Python: UNDEFINED (3 steps)
- TypeScript: UNDEFINED (3 steps)

## Acceptance Criteria
- [ ] Scenario passes in Python BDD tests
- [ ] Scenario passes in TypeScript BDD tests
- [ ] Step registry updated with both Python and TypeScript paths
- [ ] `verify-alignment.ts` passes (0 orphan, 0 dead)

## Feature Content
```gherkin
Feature: TTC Portal Settings
  As a TTC admin
  I want to configure portal settings
  So that manage portal configuration

  @p3 @needs-verification
  Scenario: Open TTC portal settings
    Given I am authenticated as a TTC admin
    When I open the TTC portal settings form
    Then I should see the TTC portal settings questions
```

## Priority
p3 (Nice to have)

## Estimated Hours
2
