Feature: User Get Form Instances
  As a authenticated user
  I want to list my form instances
  So that manage multiple submissions

  @p2 @needs-verification
  Scenario: List form instances
    Given I have multiple form instances for a form type
    When I request the list of form instances
    Then I should receive the available form instances
