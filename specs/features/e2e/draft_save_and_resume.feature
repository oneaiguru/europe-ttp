Feature: Draft Save and Resume
  As a TTC applicant
  I want to save my application as a draft and resume later
  So that I don't lose progress if I can't complete it in one session

  Scenario: Save partial application and resume after logout
    Given I am authenticated as a TTC applicant
    When I fill in the TTC application form partially with:
      | field | value |
      | i_fname | John |
      | i_lname | Doe |
      | i_email | john.doe@example.com |
    And I save the application as draft
    And I sign out of the TTC portal
    And I sign in with a valid Google account
    When I open the TTC application form
    Then I should see my draft data persisted
    When I complete the remaining required fields and submit
    Then the TTC application should be marked as submitted

  Scenario: Multiple drafts for different forms
    Given I am authenticated as a TTC applicant
    When I save a partial TTC application as draft
    And I save a partial evaluator profile as draft
    And I navigate to the TTC application form
    Then I should see the TTC application draft data
    When I navigate to the evaluator profile form
    Then I should see the evaluator profile draft data
