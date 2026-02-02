Feature: Admin Permissions
  As a non-admin user
  I want to attempt to access admin pages
  So that protect admin-only data

  @p1 @needs-verification
  Scenario: Non-admin blocked
    Given I am authenticated as a non-admin user
    When I open an admin-only page
    Then I should see an unauthorized message
