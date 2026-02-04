Feature: Certificate Generation Gated by Completion
  As a TTC administrator
  I want certificate generation to require completion of all prerequisites
  So that certificates are only issued to qualified graduates

  Scenario: Generate certificate when all requirements complete
    Given applicant has completed all TTC requirements:
      | requirement | status |
      | ttc_application | submitted |
      | ttc_evaluation_count | 2 |
      | post_ttc_self_eval | submitted |
      | post_ttc_feedback | submitted |
    And I am authenticated as admin
    When I request a certificate PDF for "test.applicant@example.com"
    Then a certificate PDF should be generated
    And the certificate should include the applicant's name
    And the certificate should include the TTC completion date

  Scenario: Certificate blocked when evaluations missing
    Given applicant has submitted TTC application
    But applicant has only 1 evaluation (requires 2)
    And I am authenticated as admin
    When I request a certificate PDF for "test.applicant@example.com"
    Then certificate generation should be blocked
    And I should see the reason: "Missing evaluations (1/2 required)"

  Scenario: Certificate blocked when post-TTC feedback missing
    Given applicant has completed TTC and evaluations
    But post-TTC co-teacher feedback is missing
    When I request a certificate PDF for "test.applicant@example.com"
    Then certificate generation should be blocked
    And I should see the reason: "Missing co-teacher feedback"
