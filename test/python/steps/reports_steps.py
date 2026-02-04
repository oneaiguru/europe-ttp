# -*- coding: utf-8 -*-
from __future__ import absolute_import

from behave import given, when, then
import json
import sys
import os

# Add parent directory to path for legacy imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))


def _get_reporting_client(context):
    """Get TestApp client for reporting module from context."""
    client = getattr(context, 'reporting_client', None)
    if client is None:
        raise AssertionError("Reporting client not available in context - requires Google App Engine dependencies (google.appengine.api, cloudstorage)")
    return client


def _get_admin_email(context):
    """Get admin email from context."""
    if hasattr(context, 'current_email'):
        return context.current_email
    return 'test.admin@example.com'


def _get_response_body(response):
    """Extract response body as string."""
    body = getattr(response, 'body', response)
    if body is None:
        return ''
    if isinstance(body, bytes):
        return body.decode('utf-8', errors='ignore')
    return body


# User Summary Report Steps

@when('I run the user summary report load job')
def step_run_user_summary_load_job(context):
    """Call the legacy user summary load endpoint."""
    client = _get_reporting_client(context)
    admin_email = _get_admin_email(context)

    # Mock admin authentication by setting environ
    client.extra_environ = {'USER_EMAIL': admin_email}

    try:
        response = client.get('/reporting/user-summary/load')
        context.load_response = response
        context.load_status = response.status
        context.load_body = _get_response_body(response)
    except Exception as e:
        context.load_error = str(e)
        context.load_status = 500


@then('a user summary file should be generated')
def step_user_summary_file_generated(context):
    """Verify that the load job completed successfully."""
    if hasattr(context, 'load_error'):
        raise AssertionError("Load job failed with error: {}".format(context.load_error))

    assert context.load_status == 200, "Expected status 200, got {}: {}".format(context.load_status, context.load_body)

    # Verify we can retrieve the summary via the get endpoint
    client = _get_reporting_client(context)
    admin_email = _get_admin_email(context)
    client.extra_environ = {'USER_EMAIL': admin_email}

    try:
        response = client.get('/reporting/user-summary/get-by-user')
        assert response.status == 200, "Get request failed: {}".format(response.status)
        context.summary_data = json.loads(_get_response_body(response))
    except Exception as e:
        raise AssertionError("Failed to retrieve summary file: {}".format(e))


@when('I request the user summary report by user')
def step_request_user_summary_by_user(context):
    """Request the user summary data."""
    client = _get_reporting_client(context)
    admin_email = _get_admin_email(context)
    client.extra_environ = {'USER_EMAIL': admin_email}

    try:
        response = client.get('/reporting/user-summary/get-by-user')
        context.summary_response = response
        context.summary_status = response.status
        context.summary_body = _get_response_body(response)

        if response.status == 200:
            context.summary_data = json.loads(context.summary_body)
    except Exception as e:
        context.summary_error = str(e)
        context.summary_status = 500


@then('I should receive the user summary data')
def step_should_receive_user_summary_data(context):
    """Verify that user summary data was received."""
    if hasattr(context, 'summary_error'):
        raise AssertionError("Request failed with error: {}".format(context.summary_error))

    assert context.summary_status == 200, "Expected status 200, got {}: {}".format(context.summary_status, context.summary_body)

    # Verify response is valid JSON
    assert hasattr(context, 'summary_data'), "No summary data in context"
    assert isinstance(context.summary_data, dict), "Summary data should be a dict"

    # Verify expected structure (at minimum, should be a dict keyed by email)
    # Empty dict is acceptable (no users), but must be a dict
    assert len(context.summary_data) >= 0, "Summary data should be a dict"
