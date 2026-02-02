Feature: Post-TTC Self Evaluation
  As a TTC graduate
  I want to submit a post-TTC self evaluation
  So that provide post-course feedback

  @p2 @needs-verification
  Scenario: Open post-TTC self evaluation
    Given I am authenticated as a TTC graduate
    When I open the post-TTC self evaluation form
    Then I should see the post-TTC self evaluation questions
