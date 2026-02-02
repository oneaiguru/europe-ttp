Feature: Password Reset
  As a user
  I want to recover access to my account
  So that regain access when I forget my password

  @p3 @needs-verification
  Scenario: Password reset via identity provider
    Given I am on the TTC portal login page
    When I request a password reset for my Google account
    Then I should receive a password reset prompt from the identity provider
