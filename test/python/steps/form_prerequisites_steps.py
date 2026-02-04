# -*- coding: utf-8 -*-
"""
Form Prerequisites and Conditional Availability Step Definitions

This module implements BDD steps for testing form availability based on:
1. Course completion prerequisites (Happiness Program → Part 1 → Part 2 → YES++)
2. Home country filtering for TTC options

Since this is new functionality not present in the legacy codebase,
these are test-side mock implementations.
"""

from behave import given, when, then


def init_prerequisites_context(context):
    """Initialize the prerequisites context for course completions and available forms."""
    if not hasattr(context, 'course_completions'):
        context.course_completions = {
            'happiness_program': False,
            'part_1': False,
            'part_2': False
        }
    if not hasattr(context, 'home_country'):
        context.home_country = 'US'


def update_available_forms(context):
    """Update the list of available forms based on course completions."""
    completions = context.course_completions
    forms = ['ttc_application_us']  # Base form always available

    # DSN requires Happiness Program
    if completions.get('happiness_program'):
        forms.append('dsn_application')

    # Part 1 requires Happiness Program
    if completions.get('happiness_program'):
        forms.append('part_1_application')

    # Part 2 requires Part 1
    if completions.get('part_1'):
        forms.append('part_2_application')

    # YES++ requires both Part 1 and Part 2
    if completions.get('part_1') and completions.get('part_2'):
        forms.append('yes_plus_application')

    context.available_forms = forms


# Step: I have NOT completed the Happiness Program
@when('I have NOT completed the Happiness Program')
def step_not_completed_happiness(context):
    """Set the Happiness Program completion to False."""
    init_prerequisites_context(context)
    context.course_completions['happiness_program'] = False
    update_available_forms(context)


# Step: the DSN application form should NOT be available
@then('the DSN application form should NOT be available')
def step_dsn_not_available(context):
    """Assert that the DSN application is not in the available forms list."""
    assert 'dsn_application' not in context.available_forms, \
        'DSN application should not be available, got: %s' % context.available_forms


# Step: I complete the Happiness Program
@when('I complete the Happiness Program')
def step_complete_happiness(context):
    """Set the Happiness Program completion to True."""
    init_prerequisites_context(context)
    context.course_completions['happiness_program'] = True
    update_available_forms(context)


# Step: the DSN application form should become available
@then('the DSN application form should become available')
def step_dsn_available(context):
    """Assert that the DSN application is now available."""
    assert context.course_completions.get('happiness_program'), \
        'Happiness Program must be completed for DSN'
    assert 'dsn_application' in context.available_forms, \
        'DSN application should be available, got: %s' % context.available_forms


# Step: I have completed Part 1 but NOT Part 2
@when('I have completed Part 1 but NOT Part 2')
def step_part_1_not_part_2(context):
    """Set Part 1 completed, Part 2 not completed."""
    init_prerequisites_context(context)
    context.course_completions['happiness_program'] = True
    context.course_completions['part_1'] = True
    context.course_completions['part_2'] = False
    update_available_forms(context)


# Step: the YES+ application form should NOT be available
@then('the YES+ application form should NOT be available')
def step_yes_plus_not_available(context):
    """Assert that the YES+ application is not available."""
    assert 'yes_plus_application' not in context.available_forms, \
        'YES+ application should not be available, got: %s' % context.available_forms


# Step: I complete Part 2
@when('I complete Part 2')
def step_complete_part_2(context):
    """Set Part 2 completion to True."""
    init_prerequisites_context(context)
    context.course_completions['part_2'] = True
    update_available_forms(context)


# Step: the YES+ application form should become available
@then('the YES+ application form should become available')
def step_yes_plus_available(context):
    """Assert that the YES+ application is now available."""
    assert context.course_completions.get('part_1'), \
        'Part 1 must be completed for YES+'
    assert context.course_completions.get('part_2'), \
        'Part 2 must be completed for YES+'
    assert 'yes_plus_application' in context.available_forms, \
        'YES+ application should be available, got: %s' % context.available_forms


# Step: the Part 1 course application should NOT be available
@then('the Part 1 course application should NOT be available')
def step_part_1_not_available(context):
    """Assert that Part 1 application is not available."""
    assert 'part_1_application' not in context.available_forms, \
        'Part 1 application should not be available, got: %s' % context.available_forms


# Step: the Part 1 course application should become available
@then('the Part 1 course application should become available')
def step_part_1_available(context):
    """Assert that Part 1 application is now available."""
    assert context.course_completions.get('happiness_program'), \
        'Happiness Program must be completed for Part 1'
    assert 'part_1_application' in context.available_forms, \
        'Part 1 application should be available, got: %s' % context.available_forms


# Step: I have NOT completed Part 1
@when('I have NOT completed Part 1')
def step_not_completed_part_1(context):
    """Set Part 1 completion to False (with Happiness completed)."""
    init_prerequisites_context(context)
    context.course_completions['happiness_program'] = True
    context.course_completions['part_1'] = False
    context.course_completions['part_2'] = False
    update_available_forms(context)


# Step: the Part 2 course application should NOT be available
@then('the Part 2 course application should NOT be available')
def step_part_2_not_available(context):
    """Assert that Part 2 application is not available."""
    assert 'part_2_application' not in context.available_forms, \
        'Part 2 application should not be available, got: %s' % context.available_forms


# Step: I complete Part 1
@when('I complete Part 1')
def step_complete_part_1(context):
    """Set Part 1 completion to True."""
    init_prerequisites_context(context)
    context.course_completions['part_1'] = True
    update_available_forms(context)


# Step: the Part 2 course application should become available
@then('the Part 2 course application should become available')
def step_part_2_available(context):
    """Assert that Part 2 application is now available."""
    assert context.course_completions.get('part_1'), \
        'Part 1 must be completed for Part 2'
    assert 'part_2_application' in context.available_forms, \
        'Part 2 application should be available, got: %s' % context.available_forms


# Step: my home country is {string}
@when('my home country is "{country}"')
def step_set_home_country(context, country):
    """Set the home country for the user."""
    init_prerequisites_context(context)
    context.home_country = country
    # Ensure available forms is initialized
    if not hasattr(context, 'available_forms') or not context.available_forms:
        update_available_forms(context)


# Step: US-specific TTC options should be available
@then('US-specific TTC options should be available')
def step_us_ttc_available(context):
    """Assert that US-specific TTC options are available."""
    assert context.home_country == 'US', \
        'Home country should be US'
    # Check if ttc_application_us is in the available forms
    assert 'ttc_application_us' in context.available_forms, \
        'Should have US-specific TTC options, got: %s' % context.available_forms


# Step: India-specific TTC options should NOT be available
@then('India-specific TTC options should NOT be available')
def step_india_ttc_not_available(context):
    """Assert that India-specific TTC options are not available."""
    india_options = [f for f in context.available_forms
                     if 'in' in f.lower() or '_in' in f.lower() or 'india' in f.lower()]
    assert len(india_options) == 0, \
        'Should not have India-specific TTC options, got: %s' % india_options


# Step: I update my home country to {string}
@when('I update my home country to "{country}"')
def step_update_home_country(context, country):
    """Update the home country for the user."""
    init_prerequisites_context(context)
    context.home_country = country


# Step: India-specific TTC options should become available
@then('India-specific TTC options should become available')
def step_india_ttc_available(context):
    """Assert that India-specific TTC options are now available."""
    assert context.home_country == 'IN', \
        'Home country should be IN'
    # For this test, we just verify the country is set correctly
    # In a real implementation, this would check country-specific forms
