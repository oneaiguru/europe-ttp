@browser @pending
Feature: Admin Applicants Summary - Browser Behavior
  As an admin user
  I want to see the TTC applicants summary dashboard
  So that I can view an overview of all applicants

  # NOTE: This feature is @pending because render functions are stubs

  Background:
    Given I navigate to "/api/admin/ttc_applicants_summary"

  @p1
  Scenario: Dashboard renders
    Then I should see the heading "TTC Applicants Summary"
