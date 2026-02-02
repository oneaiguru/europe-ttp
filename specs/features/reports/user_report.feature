Feature: User Application Report
  As a admin user
  I want to retrieve user application reports
  So that review application details

  @p2 @needs-verification
  Scenario: Get user application HTML
    Given I am authenticated as an admin user
    When I request the user application report as HTML
    Then I should receive the user application HTML

  @p2 @needs-verification
  Scenario: Get combined user application report
    Given I am authenticated as an admin user
    When I request the combined user application report
    Then I should receive the combined user application data

  @p2 @needs-verification
  Scenario: Get user application forms
    Given I am authenticated as an admin user
    When I request the user application report as forms
    Then I should receive the user application form data
