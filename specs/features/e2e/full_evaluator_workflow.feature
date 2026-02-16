Feature: Full Evaluator Workflow
  As an evaluator
  I want to view assigned applicant applications and submit evaluations
  So that applicants can progress through the TTC process

  Scenario: Evaluator views and evaluates applicant
    Given applicant "Test Applicant" has submitted TTC application for "test_us_future"
    And applicant has uploaded photo and required documents
    And I am authenticated as evaluator with email "test.evaluator1@example.com"
    When I open the TTC evaluation form for "test.applicant@example.com"
    Then I should see the applicant's submitted application data
    And I should see the applicant's uploaded photo
    And I should see the applicant's uploaded documents
    When I submit the evaluation with:
      | field | value |
      | i_evaluator_recommendation | Strongly Recommend |
      | i_readiness_level | Ready |
    Then the evaluation status should update to "submitted"
    And the applicant should see the evaluation in their portal

  Scenario: Role-based visibility - evaluator cannot see other evaluators' submissions
    Given evaluator A has submitted an evaluation for applicant
    And I am authenticated as evaluator B
    When I view the applicant's evaluation summary
    Then I should NOT see evaluator A's private evaluation notes
    But I should see that an evaluation was submitted

  Scenario: Evaluator can only evaluate assigned applicants
    Given I am authenticated as evaluator with email "test.evaluator1@example.com"
    When I attempt to access evaluation for unassigned applicant
    Then I should see "not authorized" or "not assigned" error
