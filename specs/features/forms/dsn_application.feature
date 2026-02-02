Feature: DSN Application
  As a TTC applicant
  I want to complete a DSN application
  So that apply for DSN

  @p3 @needs-verification
  Scenario: Open DSN application
    Given I am authenticated as a TTC applicant
    When I open the DSN application form
    Then I should see the DSN application questions
