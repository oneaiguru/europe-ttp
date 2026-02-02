Feature: Post-TTC Feedback
  As a TTC graduate
  I want to submit post-TTC feedback
  So that provide feedback on the course

  @p2 @needs-verification
  Scenario: Open post-TTC feedback
    Given I am authenticated as a TTC graduate
    When I open the post-TTC feedback form
    Then I should see the post-TTC feedback questions
