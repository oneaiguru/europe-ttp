# Test fixture for empty Examples block (should fail validation)
# This is intentionally malformed to test error detection

Feature: Empty Examples Block Test

  Scenario Outline: Test with empty examples
    Given I have <count> apples

    Examples:
    # No rows here - this should trigger an error
