# Test fixture for empty Examples header (should fail validation)
# This is intentionally malformed to test error detection

Feature: Empty Examples Header Test

  Scenario Outline: Test with empty header
    Given I have <count> apples

    Examples:
      |     |  # Empty header - should trigger an error
