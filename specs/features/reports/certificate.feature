Feature: Certificate Generation
  As a authenticated user
  I want to generate a certificate PDF
  So that download a certificate

  @p3 @needs-verification
  Scenario: Generate certificate PDF
    Given I am authenticated on the TTC portal
    When I request a certificate PDF
    Then a certificate PDF should be generated
