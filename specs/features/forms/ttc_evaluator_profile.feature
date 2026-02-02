Feature: TTC Evaluator Profile
  As a evaluator
  I want to complete my evaluator profile
  So that provide evaluator details

  @p2 @needs-verification
  Scenario: Open TTC evaluator profile
    Given I am authenticated as an evaluator
    When I open the TTC evaluator profile form
    Then I should see the TTC evaluator profile questions
