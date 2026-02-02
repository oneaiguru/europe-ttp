Feature: Print Form
  As a admin user
  I want to print a form
  So that review printable form output

  @p3 @needs-verification
  Scenario: Print a form
    Given I am authenticated as an admin user
    When I open a printable form page
    Then I should see a printable form view
