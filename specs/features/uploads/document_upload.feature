Feature: Document Upload
  As a authenticated user
  I want to upload a document
  So that attach required documents

  @p2 @needs-verification
  Scenario: Request signed URL for document
    Given I am authenticated on the TTC portal
    When I request a signed upload URL for a document
    Then I should receive a signed URL and upload key for the document
