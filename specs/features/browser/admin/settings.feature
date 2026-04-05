@browser @pending
Feature: Admin Settings Page - Browser Behavior
  As an admin user
  I want to access the settings page
  So that I can manage platform configuration

  # NOTE: This feature is @pending because render functions are stubs

  Background:
    Given I navigate to "/api/admin/settings"

  @p1
  Scenario: Settings page renders
    Then I should see the heading "Admin Settings"
    And I should see element "#settings_page"

  @p2 @parity
  Scenario: Parity with legacy
    Then the form element count should match the legacy at "/api/legacy/admin_settings"
    And the page should have a whitelisted user management section
