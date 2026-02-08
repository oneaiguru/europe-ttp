# Test steps for placeholder matching validation
# These steps test the verify-alignment.ts placeholder matching logic

from behave import given, when, then

@given('I have a registry entry with placeholder but no pattern')
def registry_entry_with_placeholder(context):
    """Test step for placeholder matching validation."""
    pass

@when('the alignment check runs')
def alignment_check_runs(context):
    """Test step for placeholder matching validation."""
    pass

@then('the step should match correctly')
def step_should_match_correctly(context):
    """Test step for placeholder matching validation."""
    pass

@given('test placeholder step with value {string}')
def test_placeholder_step_with_value(context, string):
    """Test step with {string} placeholder but NO pattern field in registry.
    This tests the fallback placeholder matching logic in verify-alignment.ts."""
    pass

@given('test placeholder step with float {float}')
def test_placeholder_step_with_float(context, float):
    """Test step with {float} placeholder but NO pattern field in registry.
    This tests the fallback placeholder matching logic for negative floats."""
    pass

@given('test placeholder step with int {int}')
def test_placeholder_step_with_int(context, int):
    """Test step with {int} placeholder but NO pattern field in registry.
    This tests the fallback placeholder matching logic for negative integers."""
    pass

@given('this step should be detected as a dead step')
def asterisk_step_test(context):
    """Test step for asterisk (*) keyword support in Gherkin.
    This is used in specs/features/test/asterisk-step.feature to verify
    that the BDD verification script correctly extracts asterisk steps."""
    pass
