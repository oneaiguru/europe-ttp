Feature: Test E2E Table
  Scenario: Test e2e table step
    Given I am authenticated as applicant with email "test@example.com"
    When I submit TTC application for "test_ttc" with:
      | field | value |
      | i_fname | John |
