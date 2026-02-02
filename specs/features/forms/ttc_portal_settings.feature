Feature: TTC Portal Settings
  As a TTC admin
  I want to configure portal settings
  So that manage portal configuration

  @p3 @needs-verification
  Scenario: Open TTC portal settings
    Given I am authenticated as a TTC admin
    When I open the TTC portal settings form
    Then I should see the TTC portal settings questions
