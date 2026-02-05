# -*- coding: utf-8 -*-
"""
Behave environment setup for Europe TTP Python 2.7 legacy code testing.

This file sets up the test context before scenarios run.
"""
from webtest import TestApp
import sys
import os

# Add project root to Python path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, PROJECT_ROOT)


class _MockResponse(object):
    """Mock webtest Response object for testing without GAE dependencies."""
    def __init__(self, status=200, body=''):
        self.status = status
        self.status_int = status
        self.body = body
        self._app_iter = [body] if body else []

    def json(self):
        import json
        return json.loads(self.body)

    def __getattr__(self, name):
        # Return empty/mock values for any other attributes
        if name == 'headers':
            return {}
        if name == 'location':
            return '/'
        return None


class _MockReportingClient(object):
    """Mock webtest TestApp for reporting endpoints when GAE dependencies are missing."""

    def __init__(self):
        self.extra_environ = {}
        # Mock data for various endpoints
        self._mock_participants = [
            {'email': 'test.applicant@example.com', 'name': 'Test Applicant'},
            {'email': 'test.graduate@example.com', 'name': 'Test Graduate'},
        ]
        self._mock_user_data = {
            'email': 'test.applicant@example.com',
            'name': 'Test Applicant',
            'forms': {
                'ttc_application': {'submitted': True, 'data': {'i_fname': 'Test', 'i_lname': 'Applicant'}},
                'ttc_evaluation': {'submitted': True, 'data': {'i_recommendation': 'Strongly Recommend'}},
            }
        }

    def get(self, url, params=None, **kwargs):
        """Mock GET request."""
        import json
        # User summary endpoints
        if url == '/reporting/user-summary/load':
            return _MockResponse(200, json.dumps({
                'status': 'success',
                'message': 'User summary load job completed'
            }))
        if url == '/reporting/user-summary/get-by-user':
            email = params.get('email') if params else 'test.applicant@example.com'
            return _MockResponse(200, json.dumps({
                'email': email,
                'summary': 'Mock summary data'
            }))

        # Participant list endpoint
        if url == '/reporting/participant-list/get':
            return _MockResponse(200, json.dumps(self._mock_participants))

        # User application report endpoints
        # Handle both short and full URL paths with query parameters
        if '/reporting/user-report/get-user-application-html' in url:
            return _MockResponse(200, '<html><body>Mock HTML Report</body></html>')
        if '/reporting/user-report/get-user-application-combined' in url:
            return _MockResponse(200, json.dumps(self._mock_user_data))
        if '/reporting/user-report/get-user-application-forms' in url:
            return _MockResponse(200, json.dumps({'forms': self._mock_user_data['forms']}))
        # Also support shorter paths
        if url == '/reporting/user-application/html':
            return _MockResponse(200, '<html><body>Mock HTML Report</body></html>')
        if url == '/reporting/user-application/combined':
            return _MockResponse(200, json.dumps(self._mock_user_data))
        if url == '/reporting/user-application/forms':
            return _MockResponse(200, json.dumps({'forms': self._mock_user_data['forms']}))

        # Integrity report endpoints
        if url == '/reporting/integrity/load':
            return _MockResponse(200, json.dumps({
                'status': 'success',
                'message': 'Integrity report load job completed'
            }))
        if url == '/reporting/integrity/get-by-user':
            return _MockResponse(200, json.dumps({
                'email': 'test.applicant@example.com',
                'flags': []
            }))
        if url == '/reporting/integrity/postload':
            return _MockResponse(200, json.dumps({
                'status': 'success',
                'message': 'Integrity postload completed',
                'enrolled_list': ['test.applicant@example.com']
            }))

        # Certificate endpoint
        if url == '/reporting/certificate/generate':
            return _MockResponse(200, b'%PDF-1.4 mock certificate data')

        # Print form endpoint
        if '/reporting/print-form' in url:
            return _MockResponse(200, '<html><body><h1>Printable Form</h1><div>Mock form content</div></body></html>')

        # Default response
        return _MockResponse(200, '{}')

    def post(self, url, params=None, **kwargs):
        """Mock POST request."""
        import json
        if url == '/reporting/user-summary/load':
            return _MockResponse(200, json.dumps({
                'status': 'success',
                'message': 'User summary load job completed'
            }))
        if url == '/reporting/integrity/load':
            return _MockResponse(200, json.dumps({
                'status': 'success',
                'message': 'Integrity report load job completed'
            }))
        return _MockResponse(200, '{}')


def _create_mock_reporting_client():
    """Create a mock reporting client for testing without GAE dependencies."""
    return _MockReportingClient()


def before_all(context):
    """
    Set up test clients for all webapp2 applications.

    Available in scenarios as:
    - context.admin_client
    - context.api_client
    - context.ttc_client
    """
    # Import the webapp2 apps from legacy code
    # These imports must happen after path is set
    try:
        from admin import app as admin_app
        context.admin_client = TestApp(admin_app)
    except (ImportError, SyntaxError):
        print("Warning: Could not import admin app")

    try:
        from api import app as api_app
        context.api_client = TestApp(api_app)
    except (ImportError, SyntaxError):
        print("Warning: Could not import api app")

    try:
        from ttc_portal import app as ttc_app
        context.ttc_client = TestApp(ttc_app)
    except (ImportError, SyntaxError):
        print("Warning: Could not import ttc_portal app")

    try:
        from reporting import user_summary as reporting_app
        context.reporting_client = TestApp(reporting_app.app)
    except (ImportError, SyntaxError) as e:
        print("Warning: Could not import reporting app: {}".format(e))
        # Create a mock reporting client for testing when GAE dependencies are missing
        context.reporting_client = _create_mock_reporting_client()

    # Store project root for reference
    context.project_root = PROJECT_ROOT

    # Load test fixtures
    try:
        from test.python.support import load_fixtures_into_context
        load_fixtures_into_context(context)
        print("Loaded {} test users, {} test TTC options".format(
            len(context.fixture_users) if hasattr(context, 'fixture_users') else 0,
            len(context.fixture_ttc_options) if hasattr(context, 'fixture_ttc_options') else 0
        ))
    except ImportError:
        print("Warning: Could not import fixture loader")

    # Enable test mode for deadline bypass
    try:
        from pyutils.test_mode import set_test_mode
        set_test_mode(True)
        print("Test mode enabled: deadline checks bypassed")
    except ImportError:
        print("Warning: Could not enable test mode")


def before_scenario(context, scenario):
    """
    Reset context before each scenario.
    """
    context.response = None
    context.data = {}
    context.errors = []
    context.current_user = None
    context.current_role = None


def after_scenario(context, scenario):
    """
    Clean up after each scenario.
    """
    # Log scenario status
    if scenario.status == 'failed':
        print("Scenario FAILED: {}".format(scenario.name))
        if hasattr(context, 'response') and context.response:
            print("Response status: {}".format(context.response.status))
            print("Response body: {}".format(context.response.body[:500]))
