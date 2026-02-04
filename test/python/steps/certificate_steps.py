# -*- coding: utf-8 -*-
"""
Certificate generation step definitions with completion gating.
"""
from __future__ import absolute_import
import json
from datetime import datetime
from behave import given, when, then


# ============================================================================
# COMPLETION STATUS TRACKING
# ============================================================================

def _get_applicant_requirements(context, email=None):
    """Get or create requirements tracking for an applicant."""
    if not hasattr(context, 'applicant_requirements'):
        context.applicant_requirements = {}

    applicant_email = email or getattr(context, 'current_email', 'test.applicant@example.com')

    if applicant_email not in context.applicant_requirements:
        # Default incomplete state
        context.applicant_requirements[applicant_email] = {
            'ttc_application': 'not_submitted',
            'ttc_evaluation_count': 0,
            'post_ttc_self_eval': 'not_submitted',
            'post_ttc_feedback': 'not_submitted',
            'name': 'Test Applicant',
            'completion_date': None,
        }

    return context.applicant_requirements[applicant_email]


def _check_completion_status(requirements):
    """
    Check if all requirements are met for certificate generation.

    Returns: (is_complete, blocking_reason)
    """
    eval_count = requirements.get('ttc_evaluation_count', 0)

    if requirements.get('ttc_application') != 'submitted':
        return False, 'Missing TTC application submission'

    if eval_count < 2:
        return False, 'Missing evaluations ({}/2 required)'.format(eval_count)

    if requirements.get('post_ttc_self_eval') != 'submitted':
        return False, 'Missing post-TTC self-evaluation'

    if requirements.get('post_ttc_feedback') != 'submitted':
        return False, 'Missing co-teacher feedback'

    return True, None


# ============================================================================
# GIVEN STEPS - Setup Completion Status
# ============================================================================

@given('applicant has completed all TTC requirements')
@given('applicant has completed all TTC requirements:')
def step_applicant_completed_all(context):
    """
    Set up an applicant with all requirements complete.
    Table columns: requirement | status
    """
    context.current_email = 'test.applicant@example.com'
    reqs = _get_applicant_requirements(context)

    # Process the table data
    for row in context.table:
        requirement = row['requirement']
        status = row['status']

        if requirement == 'ttc_application':
            reqs['ttc_application'] = status
        elif requirement == 'ttc_evaluation_count':
            reqs['ttc_evaluation_count'] = int(status)
        elif requirement == 'post_ttc_self_eval':
            reqs['post_ttc_self_eval'] = status
        elif requirement == 'post_ttc_feedback':
            reqs['post_ttc_feedback'] = status

    # Set completion date if all requirements met
    is_complete, _ = _check_completion_status(reqs)
    if is_complete:
        reqs['completion_date'] = datetime.utcnow().strftime('%Y-%m-%d')


@given('applicant has submitted TTC application')
def step_applicant_submitted_ttc(context):
    """Set up applicant with TTC application submitted."""
    context.current_email = 'test.applicant@example.com'
    reqs = _get_applicant_requirements(context)
    reqs['ttc_application'] = 'submitted'


@given('applicant has only 1 evaluation (requires 2)')
def step_applicant_one_evaluation(context):
    """Set up applicant with only 1 evaluation (below requirement)."""
    context.current_email = 'test.applicant@example.com'
    reqs = _get_applicant_requirements(context)

    reqs['ttc_application'] = 'submitted'
    reqs['ttc_evaluation_count'] = 1  # Below required 2
    reqs['post_ttc_self_eval'] = 'submitted'
    reqs['post_ttc_feedback'] = 'submitted'


@given('applicant has completed TTC and evaluations')
def step_applicant_completed_ttc_and_evals(context):
    """Set up applicant with TTC and evaluations complete, but missing feedback."""
    context.current_email = 'test.applicant@example.com'
    reqs = _get_applicant_requirements(context)

    reqs['ttc_application'] = 'submitted'
    reqs['ttc_evaluation_count'] = 2  # Meets requirement
    reqs['post_ttc_self_eval'] = 'submitted'
    # post_ttc_feedback left as 'not_submitted' - will be set by next step


@given('post-TTC co-teacher feedback is missing')
def step_feedback_missing(context):
    """Mark that co-teacher feedback is missing for the current applicant."""
    reqs = _get_applicant_requirements(context)
    reqs['post_ttc_feedback'] = 'not_submitted'


# ============================================================================
# WHEN STEPS - Certificate Request
# ============================================================================

@when('I request a certificate PDF for "{email}"')
def step_request_certificate_for_email(context, email):
    """
    Request a certificate PDF for a specific applicant email.
    Implements gating logic based on completion status.
    """
    context.certificate_request_email = email

    # Get applicant requirements
    reqs = _get_applicant_requirements(context, email)

    # Check completion status
    is_complete, blocking_reason = _check_completion_status(reqs)

    if is_complete:
        # Generate mock certificate PDF
        context.certificate_status = 200
        # Remove any existing error (the existing step checks hasattr)
        if hasattr(context, 'certificate_error'):
            delattr(context, 'certificate_error')

        # Include applicant data in PDF
        applicant_name = reqs.get('name', 'Test Applicant')
        completion_date = reqs.get('completion_date', datetime.utcnow().strftime('%Y-%m-%d'))

        # Mock PDF content with applicant data
        pdf_content = '''%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 123
>>
stream
BT
/F1 12 Tf
50 700 Td
(Certificate of Completion) Tj
0 -20 Td
(This certifies that {name}) Tj
0 -20 Td
(has completed TTC on {date}) Tj
ET
endstream
endobj
endobj
%%EOF'''.format(name=applicant_name, date=completion_date)

        context.certificate_body = pdf_content
        context.certificate_applicant_name = applicant_name
        context.certificate_completion_date = completion_date
    else:
        # Block with error
        context.certificate_status = 400
        context.certificate_error = blocking_reason
        context.certificate_body = None


# ============================================================================
# THEN STEPS - Assertions
# ============================================================================

@then('the certificate should include the applicant\'s name')
def step_certificate_includes_name(context):
    """Verify the certificate includes the applicant's name."""
    assert hasattr(context, 'certificate_applicant_name'), \
        'Certificate not generated or applicant name not set'
    assert context.certificate_applicant_name, 'Applicant name should not be empty'

    # Verify name is in the PDF content
    if hasattr(context, 'certificate_body') and context.certificate_body:
        assert context.certificate_applicant_name in context.certificate_body, \
            'Applicant name should be in certificate PDF content'


@then('the certificate should include the TTC completion date')
def step_certificate_includes_date(context):
    """Verify the certificate includes the TTC completion date."""
    assert hasattr(context, 'certificate_completion_date'), \
        'Certificate not generated or completion date not set'
    assert context.certificate_completion_date, 'Completion date should not be empty'

    # Verify date is in the PDF content
    if hasattr(context, 'certificate_body') and context.certificate_body:
        assert context.certificate_completion_date in context.certificate_body, \
            'Completion date should be in certificate PDF content'


@then('certificate generation should be blocked')
def step_certificate_blocked(context):
    """Verify certificate generation was blocked."""
    assert hasattr(context, 'certificate_status'), \
        'Certificate request was not executed'

    # Should have non-200 status
    assert context.certificate_status != 200, \
        'Certificate generation should be blocked but returned status 200'

    # Should have an error reason
    assert hasattr(context, 'certificate_error'), \
        'Blocking reason should be set'
    assert context.certificate_error is not None, \
        'Blocking reason should not be None'


@then('I should see the reason: "{message}"')
def step_should_see_reason(context, message):
    """Verify the blocking reason matches the expected message."""
    assert hasattr(context, 'certificate_error'), \
        'No error message was set'

    assert context.certificate_error == message, \
        'Expected error "{}" but got "{}"'.format(message, context.certificate_error)
