@browser @pending
Feature: Admin Permissions - Browser Behavior
  As an unauthenticated or unauthorized user
  I want to see the permissions error page
  So that I understand why I cannot access admin features

  # NOTE: This feature is @pending because render functions are stubs

  Background:
    Given I navigate to "/api/admin/permissions"

  @p1
  Scenario: Unauthorized message displays
    Then I should see "UN-AUTHORIZED" on the page
