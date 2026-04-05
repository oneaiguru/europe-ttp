@browser @pending
Feature: Post-TTC Self Evaluation - Browser Behavior
  As a TTC participant
  I want to fill in the Post-TTC Self Evaluation form
  So that I can complete self evaluation after TTC

  # NOTE: renderPostTtcSelfEvaluation() is currently a stub.
  # These scenarios will pass once the render function is enriched.

  Background:
    Given I navigate to "/api/forms/post_ttc_self_evaluation"

  @p1
  Scenario: Form renders with correct structure
    Then I should see the heading "Post-TTC Self Evaluation"
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
