Feature: Placeholder Matching Test
  This feature tests the verify-alignment.ts placeholder matching logic

  Scenario: Test string placeholder without explicit pattern
    Given I have a registry entry with placeholder but no pattern
    When the alignment check runs
    Then the step should match correctly

  Scenario: Test placeholder step with actual value
    Given test placeholder step with value "example value"
    When the alignment check runs
    Then the step should match correctly
