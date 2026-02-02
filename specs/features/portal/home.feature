Feature: Portal Home
  As a authenticated user
  I want to view the TTC portal home
  So that access my profile and reports

  @p1 @needs-verification
  Scenario: View portal home
    Given I am authenticated on the TTC portal
    When I open the TTC portal home
    Then I should see my profile details and available reports
