Feature: User Integrity Report
  As a admin user
  I want to generate and view integrity data
  So that validate applicant integrity

  @p1 @needs-verification
  Scenario: Load user integrity
    Given I am authenticated as an admin user
    When I run the user integrity report load job
    Then a user integrity file should be generated

  @p2 @needs-verification
  Scenario: Get user integrity by user
    Given I am authenticated as an admin user
    When I request the user integrity report by user
    Then I should receive the user integrity data

  @p2 @needs-verification
  Scenario: Run user integrity postload
    Given I am authenticated as an admin user
    When I run the user integrity postload job
    Then an applicant enrolled list should be generated
