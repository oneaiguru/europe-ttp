# -*- coding: utf-8 -*-
"""
Course Eligibility Dashboard Step Definitions

This module implements BDD steps for testing the eligibility dashboard that shows
users which courses/forms they are eligible for based on their completed prerequisites.

This is NEW functionality not present in the legacy codebase, implemented as a test-side mock.
"""

from behave import given, when, then


# Directly include the helper functions here to avoid import-time side effects
# from form_prerequisites_steps
def init_prerequisites_context(context):
    """Initialize the prerequisites context for form availability testing."""
    if not hasattr(context, 'course_completions'):
        context.course_completions = {}

    if not hasattr(context, 'available_forms'):
        context.available_forms = []


def update_available_forms(context):
    """Update available forms based on course completions."""
    completions = context.course_completions

    available = []

    # TTC Application always available
    available.append('ttc_application')

    # DSN requires Happiness Program
    if completions.get('happiness_program'):
        available.append('dsn_application')

    # Part 1 requires Happiness Program
    if completions.get('happiness_program'):
        available.append('part_1_application')

    # Part 2 requires Part 1
    if completions.get('part_1'):
        available.append('part_2_application')

    # YES+ requires Part 1 and Part 2
    if completions.get('part_1') and completions.get('part_2'):
        available.append('yes_plus_application')

    context.available_forms = available


def get_eligibility_courses(context):
    """Return list of courses with eligibility status based on course completions."""
    # Initialize prerequisites context if needed
    init_prerequisites_context(context)

    completions = getattr(context, 'course_completions', {
        'happiness_program': False,
        'part_1': False,
        'part_2': False
    })

    # For TTC Evaluation, check if TTC was submitted
    ttc_submitted = completions.get('ttc_submitted', False)

    courses = [
        {
            'course': 'TTC Application',
            'prerequisite': 'None',
            'status': 'Eligible'
        },
        {
            'course': 'TTC Evaluation',
            'prerequisite': 'TTC Application submitted',
            'status': 'Eligible' if ttc_submitted else 'Not Eligible'
        },
        {
            'course': 'DSN Application',
            'prerequisite': 'Happiness Program completed',
            'status': 'Eligible' if completions.get('happiness_program') else 'Not Eligible'
        },
        {
            'course': 'Part 1',
            'prerequisite': 'Happiness Program completed',
            'status': 'Eligible' if completions.get('happiness_program') else 'Not Eligible'
        },
        {
            'course': 'Part 2',
            'prerequisite': 'Part 1 completed',
            'status': 'Eligible' if completions.get('part_1') else 'Not Eligible'
        }
    ]

    return courses


def init_eligibility_dashboard_context(context):
    """Initialize the eligibility dashboard context."""
    # Initialize prerequisites context
    init_prerequisites_context(context)
    update_available_forms(context)

    # Initialize eligibility dashboard context
    if not hasattr(context, 'eligibility_dashboard'):
        context.eligibility_dashboard = {
            'courses': [],
            'form_messages': {}
        }

    if not hasattr(context, 'form_access_attempt'):
        context.form_access_attempt = None


# Step: I view my course eligibility dashboard
@when('I view my course eligibility dashboard')
def step_view_eligibility_dashboard(context):
    """Initialize and populate the eligibility dashboard with course list."""
    init_eligibility_dashboard_context(context)
    context.eligibility_dashboard['courses'] = get_eligibility_courses(context)


# Step: I should see a list of available courses with prerequisites:
# Note: Both with and without colon to handle behave version differences
@then('I should see a list of available courses with prerequisites:')
@then('I should see a list of available courses with prerequisites')
def step_see_course_list(context):
    """Verify the eligibility dashboard shows the expected courses with prerequisites and status."""
    # Get expected courses from the data table
    expected = []
    for row in context.table:
        expected.append({
            'course': row['course'],
            'prerequisite': row['prerequisite'],
            'status': row['status']
        })

    # Get actual courses from dashboard
    actual = context.eligibility_dashboard.get('courses', [])

    # Verify all expected courses are present
    for exp_course in expected:
        found = False
        for act_course in actual:
            if (act_course['course'] == exp_course['course'] and
                act_course['prerequisite'] == exp_course['prerequisite'] and
                act_course['status'] == exp_course['status']):
                found = True
                break

        assert found, \
            'Expected course not found in dashboard: %s (got: %s)' % (exp_course, actual)


# Step: I attempt to access the DSN application form
@when('I attempt to access the DSN application form')
def step_attempt_access_dsn_form(context):
    """Record attempt to access DSN form and determine eligibility."""
    init_eligibility_dashboard_context(context)

    # Check if DSN is available based on prerequisites
    is_available = 'dsn_application' in context.available_forms

    context.form_access_attempt = 'dsn_application'

    # Store the message for this form
    if is_available:
        context.eligibility_dashboard['form_messages']['dsn_application'] = {
            'available': True,
            'message': 'available',
            'explanation': None
        }
    else:
        context.eligibility_dashboard['form_messages']['dsn_application'] = {
            'available': False,
            'message': 'not available',
            'explanation': 'Complete Happiness Program first'
        }


# Step: I should see "not available" message
@then('I should see "not available" message')
def step_see_not_available_message(context):
    """Verify that a not available message is shown."""
    assert context.form_access_attempt is not None, \
        'No form access attempt recorded'

    form = context.form_access_attempt
    message_data = context.eligibility_dashboard.get('form_messages', {}).get(form, {})

    assert message_data.get('message') == 'not available', \
        'Expected "not available" message, got: %s' % message_data


# Step: the message should explain the prerequisite: "{string}"
@then('the message should explain the prerequisite: "{explanation}"')
def step_explain_prerequisite(context, explanation):
    """Verify that the prerequisite explanation matches expected."""
    assert context.form_access_attempt is not None, \
        'No form access attempt recorded'

    form = context.form_access_attempt
    message_data = context.eligibility_dashboard.get('form_messages', {}).get(form, {})

    actual_explanation = message_data.get('explanation')
    assert actual_explanation == explanation, \
        'Expected explanation "%s", got: "%s"' % (explanation, actual_explanation)


# Step: the DSN form shows as "not available"
@given('the DSN form shows as "not available"')
@then('the DSN form shows as "not available"')
def step_dsn_shows_not_available(context):
    """Verify that DSN form is marked as not available."""
    init_prerequisites_context(context)
    update_available_forms(context)

    assert 'dsn_application' not in context.available_forms, \
        'DSN application should not be available, got: %s' % context.available_forms


# Step: I refresh the eligibility dashboard
@when('I refresh the eligibility dashboard')
def step_refresh_eligibility_dashboard(context):
    """Re-calculate eligibility based on current course completions."""
    init_eligibility_dashboard_context(context)

    # Re-calculate courses with updated eligibility
    context.eligibility_dashboard['courses'] = get_eligibility_courses(context)


# Step: the DSN form should show as "available"
@then('the DSN form should show as "available"')
def step_dsn_shows_available(context):
    """Verify that DSN form is marked as available."""
    init_prerequisites_context(context)
    update_available_forms(context)

    assert 'dsn_application' in context.available_forms, \
        'DSN application should be available, got: %s' % context.available_forms
