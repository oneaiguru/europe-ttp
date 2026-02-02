Feature: Participant List
  As a admin user
  I want to download participant lists
  So that review enrollment totals

  @p2 @needs-verification
  Scenario: Generate participant list
    Given I am authenticated as an admin user
    When I request the participant list report
    Then I should receive the participant list output
