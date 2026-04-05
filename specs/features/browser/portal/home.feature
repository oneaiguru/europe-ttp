@browser
Feature: Portal Home Page - Browser Behavior
  As an authenticated user
  I want to see my profile on the portal home page
  So that I can verify my identity and access reports

  Background:
    Given I navigate to "/api/portal/home"

  @p1
  Scenario: Profile section displays user identity
    Then I should see "Logged in as" on the page
    And I should see "test.applicant@example.com" on the page
    And I should see element "#logged_in_as"
    And I should see element "#logout" with text "LOGOUT"

  @p1
  Scenario: Profile section displays home country
    Then I should see element "#user_home_country" with text "United States"
    And I should see element "#user_home_country_iso" with text "US"

  @p1
  Scenario: Report links are visible
    Then I should see a list with 2 links
    And I should see link "TTC Reports"
    And I should see link "Applicants Summary"
