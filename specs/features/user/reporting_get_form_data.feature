Feature: Reporting Get Form Data
  As a admin user
  I want to retrieve form data for a user
  So that support reporting workflows

  @p2 @needs-verification
  Scenario: Admin gets form data for user
    Given I am authenticated as an admin user
    When I request form data for a specific user via reporting
    Then I should receive that user's form data
