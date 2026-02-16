Feature: TTC Application to Admin Review Pipeline
  As a TTC administrator
  I want to see a complete pipeline from application to evaluations to admin review
  So that I can verify cross-user aggregation works correctly

  @e2e @api
  Scenario: Applicant submits application and receives two evaluations
    Given test TTC option "test_us_future" is available
    And I am authenticated as applicant with email "test.applicant@example.com"
    And I have completed my applicant profile
    And I have uploaded my photo
    When I submit TTC application for "test_us_future" with:
      | field | value |
      | i_happiness_program_completed | true |
      | i_amp_completed | true |
      | i_vtp_completed | true |
      | i_part1_course_date | 2020-01-15 |
      | i_part2_silence_date | 2020-06-20 |
      | i_dsn_completed | true |
    Then the TTC application should be marked as submitted
    And the form should be marked as complete

    # Evaluator 1 submits evaluation
    Given I am authenticated as evaluator with email "test.evaluator1@example.com"
    When I submit TTC evaluation for "test.applicant@example.com" with:
      | field | value |
      | i_evaluator_recommendation | Strongly Recommend |
      | i_readiness_level | Ready |
    Then the evaluation should be recorded for the applicant

    # Evaluator 2 submits evaluation
    Given I am authenticated as evaluator with email "test.evaluator2@example.com"
    When I submit TTC evaluation for "test.applicant@example.com" with:
      | field | value |
      | i_evaluator_recommendation | Recommend |
      | i_readiness_level | Ready |
    Then the evaluation should be recorded for the applicant

    # Admin runs reporting job
    Given I am authenticated as admin
    When I run the user summary job
    And I request the combined user application report for "test.applicant@example.com"
    Then the user summary should show:
      | field | value |
      | ttc_application_status | submitted |
      | evaluations_submitted_count | 2 |
      | overall_status | evaluation_pending |
    And the combined report should include both evaluations

  @e2e @api
  Scenario Outline: Multiple applicants with different evaluators
    Given test TTC option "<ttc_option>" is available
    And I am authenticated as applicant with email "<applicant_email>"
    When I submit TTC application for "<ttc_option>" with:
      | field | value |
      | i_happiness_program_completed | true |
      | i_amp_completed | true |
      | i_vtp_completed | true |
    Then the TTC application should be marked as submitted

    Examples:
      | ttc_option      | applicant_email                   |
      | test_us_future  | test.applicant@example.com         |
      | test_ca_future  | test.applicant.ca@example.com      |
      | test_in_future  | test.applicant.in@example.com      |
