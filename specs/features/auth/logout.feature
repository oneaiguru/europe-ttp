Feature: Logout
  As a authenticated user
  I want to sign out of the TTC portal
  So that securely end my session

  @p1 @needs-verification
  Scenario: Logout from portal
    Given I am authenticated on the TTC portal
    When I sign out of the TTC portal
    Then I should be redirected to the TTC portal login page
