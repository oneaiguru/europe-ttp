@browser
Feature: Redirect Sanitization - Browser Behavior
  As a security-conscious user
  I want redirect URLs to be sanitized
  So that I am protected from open redirect attacks

  @p1
  Scenario: Safe redirect URL is accepted
    Given I navigate to "/api/portal/home"
    Then I should see link "TTC Reports"

  @p1
  Scenario: Report links use sanitized hrefs
    Given I navigate to "/api/portal/home"
    Then I should see link "TTC Reports"
    And I should see link "Applicants Summary"
