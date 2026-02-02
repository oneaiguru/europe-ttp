Feature: User Summary Report
  As a admin user
  I want to generate and view the user summary
  So that review applicant status

  @p1 @needs-verification
  Scenario: Load user summary
    Given I am authenticated as an admin user
    When I run the user summary report load job
    Then a user summary file should be generated

  @p2 @needs-verification
  Scenario: Get user summary by user
    Given I am authenticated as an admin user
    When I request the user summary report by user
    Then I should receive the user summary data
