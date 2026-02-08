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

  Scenario: Test single-quoted string placeholder
    Given test placeholder step with value 'single quoted'
    When the alignment check runs
    Then the step should match correctly

  Scenario: Test negative integer placeholder
    Given test placeholder step with int -42
    When the alignment check runs
    Then the step should match correctly

  Scenario: Test negative float placeholder
    Given test placeholder step with float -1.5
    When the alignment check runs
    Then the step should match correctly
