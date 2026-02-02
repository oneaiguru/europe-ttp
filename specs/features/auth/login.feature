Feature: Login
  As a TTC applicant
  I want to sign in with my Google account
  So that access the TTC portal

  @p1 @needs-verification
  Scenario: Login with Google account
    Given I am on the TTC portal login page
    When I sign in with a valid Google account
    Then I should be redirected to the TTC portal home
