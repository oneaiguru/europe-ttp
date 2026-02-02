Feature: Admin Access
  As a admin user
  I want to access admin pages
  So that manage portal data

  @p2 @needs-verification
  Scenario: Admin accesses admin dashboard
    Given I am authenticated as an admin user
    When I open the admin dashboard page
    Then I should see the admin dashboard content
