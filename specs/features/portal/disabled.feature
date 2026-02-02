Feature: Disabled Page
  As a visitor
  I want to see the disabled notice
  So that understand the portal is temporarily unavailable

  @p2 @needs-verification
  Scenario: View disabled page
    Given the TTC portal is in disabled mode
    When I visit the disabled page
    Then I should see the disabled notice
