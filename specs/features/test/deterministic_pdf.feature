Feature: Deterministic PDF Generation
  As a developer
  I want PDF generation to be deterministic
  So that tests are stable and builds are reproducible

  Scenario: Generate identical PDFs across multiple runs
    When I create a deterministic PDF with default config
    And I create another deterministic PDF with default config
    Then the PDFs should have identical content hashes
    And the PDFs should have identical creation dates
    And the PDFs should have identical file IDs

  Scenario: Generate PDFs with custom deterministic values
    When I create a deterministic PDF with custom creation date "2024-12-25T12:00:00Z"
    And I create a deterministic PDF with custom file ID "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    Then the PDF creation date should contain "20241225"
    And the PDF file ID should be "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"

  Scenario: Multiple PDFs with sequential file IDs
    When I create a PDF with file ID "00000000000000000000000000000001"
    And I create a PDF with file ID "00000000000000000000000000000002"
    Then the PDFs should have different file IDs
    And the PDFs should have identical creation dates
