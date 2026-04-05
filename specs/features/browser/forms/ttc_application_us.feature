@browser @pending
Feature: TTC Application (US) - Browser Behavior
  As a TTC applicant
  I want to fill in the TTC Application form for the United States
  So that I can apply for TTC in the United States

  # NOTE: renderTtcApplicationUs() is currently a stub.
  # These scenarios will pass once the render function is enriched.

  Background:
    Given I navigate to "/api/forms/ttc_application_us"

  @p1
  Scenario: Form renders with correct structure
    Then I should see the heading "TTC Application"
    And the form should contain a submit button
    And the form should have input fields for personal details

  @p1
  Scenario: Form accepts valid input
    When I fill in "i_fname" with "John"
    And I fill in "i_lname" with "Doe"
    Then the fields should retain their values

  @p2 @parity
  Scenario: Form field count matches legacy
    Then the input field count should be within 20% of the legacy form
    And the select field count should be within 20% of the legacy form
