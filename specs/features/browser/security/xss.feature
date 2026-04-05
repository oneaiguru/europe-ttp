@browser
Feature: XSS Prevention - Browser Behavior
  As a user viewing the portal
  I want user-supplied data to be escaped
  So that XSS attacks are prevented

  @p1
  Scenario: Portal home escapes user email in HTML
    Given I navigate to "/api/portal/home"
    Then I should see "test.applicant@example.com" on the page
    And the page should not contain unescaped script tags
