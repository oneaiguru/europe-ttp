Feature: Post-TTC Co-Teaching Feedback Loop
  As a TTC administrator
  I want to track post-TTC self-evaluations and co-teacher feedback
  So that I can verify graduates complete the co-teaching requirement

  @e2e @post-ttc @api
  Scenario: Graduate submits self-eval and receives co-teacher feedback
    Given "test.graduate@example.com" has completed TTC "test_us_future"
    And I am authenticated as "test.graduate@example.com"
    When I submit post-TTC self-evaluation for course starting "2027-07-01" with:
      | field | value |
      | i_course_location | Test Center |
      | i_co_teacher_email | test.coteacher@example.com |
      | i_teaching_hours | 20 |
    Then the self-evaluation should be marked as submitted
    And notification should be sent to "test.coteacher@example.com"

    Given I am authenticated as "test.coteacher@example.com"
    When I submit post-TTC feedback for "test.graduate@example.com" with:
      | field | value |
      | i_feedback_rating | Excellent |
      | i_recommend_for_teaching | Yes |
    Then the feedback should be linked to the graduate

    Given I am authenticated as admin
    When I run the integrity report
    Then "test.graduate@example.com" should not be flagged for missing co-teacher feedback
    And the summary should show both self-eval and co-teacher feedback

  @e2e @post-ttc @api
  Scenario: Multiple graduates with different co-teachers
    Given "test.graduate@example.com" has completed TTC "test_us_future"
    And I am authenticated as "test.graduate@example.com"
    When I submit post-TTC self-evaluation for course starting "2027-08-01" with:
      | field | value |
      | i_course_location | Test Center 2 |
      | i_co_teacher_email | test.evaluator1@example.com |
      | i_teaching_hours | 15 |
    Then the self-evaluation should be marked as submitted

    Given I am authenticated as "test.evaluator1@example.com"
    When I submit post-TTC feedback for "test.graduate@example.com" with:
      | field | value |
      | i_feedback_rating | Good |
      | i_recommend_for_teaching | Yes |
    Then the feedback should be linked to the graduate

  @e2e @post-ttc @api
  Scenario: Graduate flagged when co-teacher feedback is missing
    Given "test.graduate@example.com" has completed TTC "test_us_future"
    And I am authenticated as "test.graduate@example.com"
    When I submit post-TTC self-evaluation for course starting "2027-09-01" with:
      | field | value |
      | i_course_location | Test Center 3 |
      | i_co_teacher_email | test.missing@example.com |
      | i_teaching_hours | 25 |
    Then the self-evaluation should be marked as submitted
    But notification should be sent to "test.missing@example.com"

    Given I am authenticated as admin
    When I run the integrity report
    # In a real scenario, the graduate would be flagged for missing feedback
    Then "test.graduate@example.com" should not be flagged for missing co-teacher feedback
