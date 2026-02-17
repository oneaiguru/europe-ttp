# Test fixture for malformed Examples row (should fail validation)
# This is intentionally malformed to test error detection

Feature: Malformed Row Test

  Scenario Outline: Test with malformed row
    Given I have <count> apples and I eat <eaten>

    Examples:
      | count | eaten |
      | 5     | 2     |
      | 1     | 2     | 3 |  # Extra column - should trigger an error
