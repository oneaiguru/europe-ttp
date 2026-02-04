Feature: Simple Test
  Scenario: Simple
    Given test TTC option "test_us_future" is available
    When I submit TTC application for "test_us_future" with:
      | field | value |
      | i_happiness_program_completed | true |
    Then the TTC application should be marked as submitted
