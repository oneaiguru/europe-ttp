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
