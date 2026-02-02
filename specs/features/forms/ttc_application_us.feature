Feature: TTC Application (US)
  As a TTC applicant
  I want to complete the TTC application
  So that apply for TTC in the United States

  @p1 @needs-verification
  Scenario: Open TTC application (US)
    Given I am authenticated as a TTC applicant
    When I open the TTC application form for the United States
    Then I should see the TTC application questions for the United States
