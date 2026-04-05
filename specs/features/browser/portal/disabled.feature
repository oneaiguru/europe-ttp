@browser @pending
Feature: Portal Disabled Page - Browser Behavior
  As an authenticated user
  I want to see the disabled page
  So that I can understand why the portal is not available

  # NOTE: This feature is @pending because the render function is a stub

  Background:
    Given I navigate to "/api/portal/disabled"

  Scenario: Disabled notice displays
    Then I should see "not available" on the page
