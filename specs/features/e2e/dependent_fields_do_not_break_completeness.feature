Feature: Dependent Fields Do Not Break Form Completeness
  As a TTC applicant
  I want hidden conditional fields to not affect form completion
  So that I can submit valid forms without filling invisible fields

  @e2e @conditional-fields @api
  Scenario: Single evaluator - teacher 2/3 fields hidden
    Given I am authenticated as applicant with email "test.applicant@example.com"
    And I navigate to the TTC application form
    # API-based verification
    When I select "1" for "How many evaluating teachers?"
    Then only teacher 1 email should be in the evaluator list
    # API: Submit and verify
    When I submit TTC application for "test_us_future" with:
      | field | value |
      | i_num_evaluators | 1 |
      | i_eval1_email | test.evaluator1@example.com |
      | i_happiness_program_completed | true |
    Then the form should be marked as complete
    And only teacher 1 email should be in the evaluator list

  @e2e @conditional-fields @api
  Scenario: Two evaluators - teacher 3 fields hidden
    Given I am authenticated as applicant with email "test.applicant2@example.com"
    And I navigate to the TTC application form
    When I select "2" for "How many evaluating teachers?"
    Then teacher 1 and 2 emails should be in the evaluator list
    When I submit TTC application for "test_us_future" with:
      | field | value |
      | i_num_evaluators | 2 |
      | i_eval1_email | test.evaluator1@example.com |
      | i_eval2_email | test.evaluator2@example.com |
      | i_happiness_program_completed | true |
    Then the form should be marked as complete
    And teacher 1 and 2 emails should be in the evaluator list

  @e2e @conditional-fields @api
  Scenario: Three evaluators - all teacher fields visible
    Given I am authenticated as applicant with email "test.applicant3@example.com"
    And I navigate to the TTC application form
    When I select "3" for "How many evaluating teachers?"
    When I submit TTC application for "test_us_future" with:
      | field | value |
      | i_num_evaluators | 3 |
      | i_eval1_email | test.evaluator1@example.com |
      | i_eval2_email | test.evaluator2@example.com |
      | i_eval3_email | test.evaluator3@example.com |
      | i_happiness_program_completed | true |
    Then the form should be marked as complete

  @e2e @conditional-fields @api
  Scenario Outline: Different numbers of evaluators
    Given I am authenticated as applicant with email "test.applicant@example.com"
    And I navigate to the TTC application form
    When I select "<num>" for "How many evaluating teachers?"
    And I submit TTC application for "test_us_future" with:
      | field | value |
      | i_num_evaluators | <num> |
      | i_happiness_program_completed | true |
    Then the form should be marked as complete

    Examples:
      | num |
      | 1    |
      | 2    |
      | 3    |
