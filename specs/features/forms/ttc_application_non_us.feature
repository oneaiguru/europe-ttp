Feature: TTC Application (Non-US)
  As a TTC applicant
  I want to complete the TTC application
  So that apply for TTC outside the United States

  @p2 @needs-verification
  Scenario: Open TTC application (non-US)
    Given I am authenticated as a TTC applicant
    When I open the TTC application form for a non-US country
    Then I should see the TTC application questions for that country
