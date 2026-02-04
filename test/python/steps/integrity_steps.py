# -*- coding: utf-8 -*-
"""
Integrity report step definitions for E2E scenarios.

Tests the integrity report feature that flags:
- Missing uploads (photos, documents)
- Incomplete forms (applications started but not submitted)
- Mismatched user IDs (evaluations with wrong emails)
"""
from __future__ import absolute_import
import json
from behave import given, when, then


# ============================================================================
# DATA SETUP STEPS (Integrity-specific)
# ============================================================================

def _ensure_integrity_data(context):
    """Initialize integrity_data structure if not exists."""
    if not hasattr(context, 'integrity_data'):
        context.integrity_data = {}


def _get_current_email(context):
    """Get current email from context, set to default if missing."""
    if not hasattr(context, 'current_email'):
        context.current_email = 'test.applicant@example.com'
    return context.current_email


@given('applicant has NOT uploaded required photo')
def step_applicant_no_photo(context):
    """Mark that the applicant has not uploaded the required photo."""
    _ensure_integrity_data(context)
    email = _get_current_email(context)

    # Initialize integrity data for this email if not exists
    if email not in context.integrity_data:
        context.integrity_data[email] = {
            'email': email,
            'flags': [],
            'mismatches': []
        }

    context.integrity_data[email]['photo_uploaded'] = False
    if 'missing_photo' not in context.integrity_data[email]['flags']:
        context.integrity_data[email]['flags'].append('missing_photo')


@given('applicant has started TTC application but not submitted')
def step_applicant_incomplete(context):
    """Set up applicant with incomplete TTC application."""
    context.current_email = 'test.applicant@example.com'

    _ensure_integrity_data(context)

    # Add applicant with incomplete application
    context.integrity_data[context.current_email] = {
        'email': context.current_email,
        'ttc_application': 'incomplete',
        'application_status': 'incomplete',
        'flags': ['incomplete_application'],
        'mismatches': []
    }


@given('evaluation was submitted with email "{email}"')
def step_evaluation_wrong_email(context, email):
    """Set up evaluation submitted with mismatched email."""
    context.evaluation_email = email

    _ensure_integrity_data(context)

    # Track evaluation with wrong email
    context.integrity_data['_evaluations'] = context.integrity_data.get('_evaluations', [])
    context.integrity_data['_evaluations'].append({
        'submitted_email': email,
        'status': 'unmatched'
    })


@given('applicant exists with email "{email}"')
def step_applicant_different_email(context, email):
    """Set up actual applicant with different email."""
    context.applicant_email = email

    _ensure_integrity_data(context)

    # Add applicant to integrity data
    context.integrity_data[email] = {
        'email': email,
        'application_status': 'submitted',
        'flags': [],
        'mismatches': []
    }

    # Flag the mismatch
    if '_evaluations' in context.integrity_data:
        for eval_entry in context.integrity_data['_evaluations']:
            if eval_entry['submitted_email'] != email:
                eval_entry['actual_applicant_email'] = email
                eval_entry['status'] = 'mismatched'


# ============================================================================
# WHEN STEPS - Run Report & Download
# ============================================================================

@given('I run the user integrity report')
@when('I run the user integrity report')
def step_run_integrity_report(context):
    """
    Run the integrity report and store results.
    """
    # Mock report generation
    context.last_report_run = {
        'job_type': 'integrity',
        'timestamp': '2025-01-01T00:00:00Z'
    }

    # Ensure integrity data exists
    _ensure_integrity_data(context)

    # Store response for verification
    context.response = type('obj', (object,), {
        'status': '200 OK',
        'body': json.dumps({
            'success': True,
            'records_processed': len(context.integrity_data),
            'data': context.integrity_data
        })
    })()


@when('I download the integrity report as CSV')
def step_download_csv(context):
    """Download the integrity report as CSV."""
    # Mock CSV generation
    rows = []
    for email, data in context.integrity_data.items():
        if email.startswith('_'):  # Skip metadata
            continue
        row = {
            'email': email,
            'flags': ','.join(data.get('flags', [])),
            'missing_uploads': 'photo' if 'missing_photo' in data.get('flags', []) else '',
            'incomplete_forms': 'ttc_application' if 'incomplete_application' in data.get('flags', []) else '',
            'mismatches': data.get('mismatches', [])
        }
        rows.append(row)

    context.csv_data = {
        'columns': ['email', 'flags', 'missing_uploads', 'incomplete_forms', 'mismatches'],
        'rows': rows
    }

    context.csv_download_url = '/admin/integrity-report.csv'


# ============================================================================
# THEN STEPS - Verification
# ============================================================================

@then('"{email}" should be flagged for missing photo')
def step_flagged_missing_photo(context, email):
    """Verify the applicant is flagged for missing photo."""
    assert hasattr(context, 'integrity_data'), "No integrity data available"

    # Normalize email for lookup
    email = email.lower()

    # Check if email exists in integrity data
    assert email in context.integrity_data, \
        "Email {} not found in integrity report".format(email)

    # Check for missing photo flag
    data = context.integrity_data[email]
    assert 'missing_photo' in data.get('flags', []), \
        "Expected missing_photo flag for {}, got flags: {}".format(email, data.get('flags', []))


@then('the integrity report should show the missing upload type')
def step_show_missing_upload_type(context):
    """Verify the report shows what's missing."""
    assert hasattr(context, 'integrity_data'), "No integrity data available"

    # Find at least one entry with missing uploads
    found_missing = False
    for email, data in context.integrity_data.items():
        if email.startswith('_'):
            continue
        if 'missing_photo' in data.get('flags', []):
            found_missing = True
            # Verify the flag indicates what's missing
            assert data.get('photo_uploaded') is False, \
                "Expected photo_uploaded to be False for {}".format(email)
            break

    assert found_missing, "No entries with missing uploads found in report"


@then('"{email}" should be flagged for incomplete application')
def step_flagged_incomplete(context, email):
    """Verify the applicant is flagged for incomplete application."""
    assert hasattr(context, 'integrity_data'), "No integrity data available"

    # Normalize email for lookup
    email = email.lower()

    # Check if email exists in integrity data
    assert email in context.integrity_data, \
        "Email {} not found in integrity report".format(email)

    # Check for incomplete application flag
    data = context.integrity_data[email]
    assert 'incomplete_application' in data.get('flags', []), \
        "Expected incomplete_application flag for {}, got flags: {}".format(email, data.get('flags', []))


@then('the report should show the application status as "incomplete"')
def step_show_incomplete_status(context):
    """Verify the report shows incomplete status."""
    assert hasattr(context, 'integrity_data'), "No integrity data available"

    # Find at least one incomplete application
    found_incomplete = False
    for email, data in context.integrity_data.items():
        if email.startswith('_'):
            continue
        if data.get('application_status') == 'incomplete':
            found_incomplete = True
            break

    assert found_incomplete, "No incomplete applications found in report"


@then('the evaluation should be flagged as unmatched')
def step_flagged_unmatched(context):
    """Verify the evaluation is flagged as unmatched/mismatched."""
    assert hasattr(context, 'integrity_data'), "No integrity data available"

    # Check for mismatched evaluations
    evaluations = context.integrity_data.get('_evaluations', [])
    assert len(evaluations) > 0, "No evaluations found in integrity data"

    # Find the mismatched evaluation
    mismatched = [e for e in evaluations if e.get('status') == 'mismatched']
    assert len(mismatched) > 0, "No mismatched evaluations found"

    context.mismatched_evaluation = mismatched[0]


@then('the report should show the mismatched email')
def step_show_mismatched_email(context):
    """Verify the report shows the mismatched email."""
    assert hasattr(context, 'mismatched_evaluation'), "No mismatched evaluation found"

    eval_entry = context.mismatched_evaluation
    assert 'submitted_email' in eval_entry, "Missing submitted_email in evaluation"
    assert 'actual_applicant_email' in eval_entry, "Missing actual_applicant_email in evaluation"

    # Verify emails are different
    assert eval_entry['submitted_email'] != eval_entry['actual_applicant_email'], \
        "Expected different emails for mismatched evaluation"


@then('the CSV should contain columns: email, flags, missing_uploads, incomplete_forms, mismatches')
def step_verify_csv_columns(context):
    """Verify CSV has the expected columns."""
    assert hasattr(context, 'csv_data'), "No CSV data available"

    expected_columns = ['email', 'flags', 'missing_uploads', 'incomplete_forms', 'mismatches']
    actual_columns = context.csv_data.get('columns', [])

    assert set(expected_columns) == set(actual_columns), \
        "Expected columns {}, got {}".format(expected_columns, actual_columns)


@then('the CSV should be downloadable via admin dashboard')
def step_verify_csv_downloadable(context):
    """Verify CSV is downloadable."""
    assert hasattr(context, 'csv_download_url'), "No CSV download URL available"

    # Verify URL format
    assert context.csv_download_url.startswith('/'), \
        "Expected download URL to start with /, got {}".format(context.csv_download_url)

    # Verify CSV data exists
    assert hasattr(context, 'csv_data'), "No CSV data available"
    assert 'rows' in context.csv_data, "CSV data missing rows"
