Feature: Tabs Rendering
  As a authenticated user
  I want to load tabbed HTML fragments
  So that navigate the portal efficiently

  @p3 @needs-verification
  Scenario: Render tabbed HTML
    Given I am authenticated on the TTC portal
    When I request a tab template page
    Then I should see the rendered tab content with user context
