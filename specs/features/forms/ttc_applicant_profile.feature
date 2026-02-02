Feature: TTC Applicant Profile
  As a TTC applicant
  I want to complete my applicant profile
  So that provide applicant details

  @p2 @needs-verification
  Scenario: Open TTC applicant profile
    Given I am authenticated as a TTC applicant
    When I open the TTC applicant profile form
    Then I should see the TTC applicant profile questions
