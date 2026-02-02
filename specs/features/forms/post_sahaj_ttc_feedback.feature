Feature: Post-Sahaj TTC Feedback
  As a Sahaj TTC graduate
  I want to submit Sahaj feedback
  So that provide Sahaj course feedback

  @p2 @needs-verification
  Scenario: Open post-Sahaj feedback
    Given I am authenticated as a Sahaj TTC graduate
    When I open the post-Sahaj TTC feedback form
    Then I should see the post-Sahaj TTC feedback questions
