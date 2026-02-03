# -*- coding: utf-8 -*-
"""
Test mode utilities for BDD testing.

When TTC_TEST_MODE environment variable is 'true', this module:
1. Bypasses deadline checks on TTC options
2. Loads test configurations from local fixtures instead of GCS
3. Disables external API calls (email, etc.)

Usage:
    export TTC_TEST_MODE=true
    python -m behave ...
"""
from __future__ import absolute_import

import os

# Module-level flag that can be set programmatically or via environment
TEST_MODE_ENABLED = None


def is_test_mode():
    """
    Check if test mode is enabled.

    Test mode can be enabled by:
    1. Setting TTC_TEST_MODE environment variable to 'true'
    2. Setting test_mode_enabled programmatically

    Returns:
        bool: True if test mode is enabled, False otherwise
    """
    global TEST_MODE_ENABLED

    if TEST_MODE_ENABLED is not None:
        return TEST_MODE_ENABLED

    return os.environ.get('TTC_TEST_MODE', '').lower() == 'true'


def set_test_mode(enabled):
    """
    Programmatically enable or disable test mode.

    Args:
        enabled (bool): True to enable test mode, False to disable
    """
    global TEST_MODE_ENABLED
    TEST_MODE_ENABLED = enabled


def get_test_ttc_config_path():
    """
    Get the path to the test TTC configuration file.

    Returns:
        str: Path to the test TTC config JSON file
    """
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(project_root, 'storage', 'forms', 'ttc_country_and_dates_test.json')


def get_test_users_path():
    """
    Get the path to the test users fixture file.

    Returns:
        str: Path to the test users JSON file
    """
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(project_root, 'test', 'fixtures', 'test-users.json')


def get_test_fixtures_path():
    """
    Get the path to the test fixtures directory.

    Returns:
        str: Path to the test fixtures directory
    """
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(project_root, 'test', 'fixtures')


def bypass_deadline_check(original_check_func):
    """
    Decorator to bypass deadline checks when in test mode.

    Usage:
        @bypass_deadline_check
        def check_deadline_expired(display_until):
            # original deadline logic
            ...

    Args:
        original_check_func: The original deadline check function

    Returns:
        Wrapper function that bypasses check in test mode
    """
    def wrapper(display_until, *args, **kwargs):
        if is_test_mode():
            # In test mode, never consider deadlines expired
            return False
        return original_check_func(display_until, *args, **kwargs)
    return wrapper


def get_test_admin_email():
    """
    Get the admin email used for testing.

    Returns:
        str: Test admin email address
    """
    return os.environ.get('TTC_TEST_ADMIN_EMAIL', 'test.admin@example.com')


def get_test_applicant_email():
    """
    Get the applicant email used for testing.

    Returns:
        str: Test applicant email address
    """
    return os.environ.get('TTC_TEST_APPLICANT_EMAIL', 'test.applicant@example.com')


def get_test_evaluator_email():
    """
    Get the evaluator email used for testing.

    Returns:
        str: Test evaluator email address
    """
    return os.environ.get('TTC_TEST_EVALUATOR_EMAIL', 'test.evaluator1@example.com')
