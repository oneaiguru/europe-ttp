Feature: Post-Sahaj TTC Self Evaluation
  As a Sahaj TTC graduate
  I want to submit a Sahaj self evaluation
  So that provide Sahaj-specific feedback

  @p2 @needs-verification
  Scenario: Open post-Sahaj self evaluation
    Given I am authenticated as a Sahaj TTC graduate
    When I open the post-Sahaj TTC self evaluation form
    Then I should see the post-Sahaj TTC self evaluation questions
