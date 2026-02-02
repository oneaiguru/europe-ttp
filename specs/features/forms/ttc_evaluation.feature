Feature: TTC Evaluation
  As a evaluator
  I want to complete a TTC evaluation
  So that submit evaluation feedback

  @p2 @needs-verification
  Scenario: Open TTC evaluation
    Given I am authenticated as an evaluator
    When I open the TTC evaluation form
    Then I should see the TTC evaluation questions
