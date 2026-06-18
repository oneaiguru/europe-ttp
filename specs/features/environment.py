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
    except ImportError:
        print("Warning: Could not import admin app")

    try:
        from api import app as api_app
        context.api_client = TestApp(api_app)
    except ImportError:
        print("Warning: Could not import api app")

    try:
        from ttc_portal import app as ttc_app
        context.ttc_client = TestApp(ttc_app)
    except ImportError:
        print("Warning: Could not import ttc_portal app")

    # Store project root for reference
    context.project_root = PROJECT_ROOT


def before_scenario(context, scenario):
    """
    Reset context before each scenario.
    """
    context.response = None
    context.data = {}
    context.errors = []


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
