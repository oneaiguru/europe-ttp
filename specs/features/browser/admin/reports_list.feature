@browser @pending
Feature: Admin Reports List - Browser Behavior
  As an admin user
  I want to see the reports list page
  So that I can access and manage available reports

  # NOTE: This feature is @pending because render functions are stubs

  Background:
    Given I navigate to "/api/admin/reports_list"

  @p1
  Scenario: Reports list renders
    Then I should see the heading "Admin Reports"

  @p1
  Scenario: Report links visible
    Then I should see link "Available Report"
