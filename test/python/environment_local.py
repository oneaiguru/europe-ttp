# -*- coding: utf-8 -*-
"""
Behave environment loader for test/python.

This is a minimal environment for testing new functionality like eligibility dashboard.
"""

import sys
import os

# Add steps directory to path
steps_dir = os.path.join(os.path.dirname(__file__), 'steps')
if steps_dir not in sys.path:
    sys.path.insert(0, steps_dir)

# Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)


def before_all(context):
    """Set up test context before all scenarios."""
    context.project_root = PROJECT_ROOT
    print("Test environment initialized (minimal)")


def before_scenario(context, scenario):
    """Reset context before each scenario."""
    context.response = None
    context.data = {}
    context.errors = []
    context.current_user = None
    context.current_role = None


def after_scenario(context, scenario):
    """Clean up after each scenario."""
    if scenario.status == 'failed':
        print("Scenario FAILED: {}".format(scenario.name))
