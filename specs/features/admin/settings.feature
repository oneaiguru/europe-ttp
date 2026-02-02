Feature: Admin Settings
  As a admin user
  I want to view admin settings
  So that configure portal settings

  @p3 @needs-verification
  Scenario: Admin opens settings page
    Given I am authenticated as an admin user
    When I open the admin settings page
    Then I should see the admin settings content
