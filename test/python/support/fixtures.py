# -*- coding: utf-8 -*-
"""
Test fixture loader for BDD tests.

Loads and provides access to test data fixtures:
- Test users (applicants, evaluators, admins)
- Test TTC configurations
- Sample form submissions
"""
from __future__ import absolute_import

import os
import json
import sys

# Add project root to Python path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, PROJECT_ROOT)


class FixtureLoader(object):
    """Loads and caches test fixtures from JSON files."""

    def __init__(self):
        """Initialize the fixture loader."""
        self._cache = {}
        self.fixtures_dir = os.path.join(PROJECT_ROOT, 'test', 'fixtures')
        self.storage_dir = os.path.join(PROJECT_ROOT, 'storage', 'forms')

    def _load_json(self, path):
        """Load JSON from file with caching."""
        if path not in self._cache:
            try:
                with open(path, 'r') as f:
                    self._cache[path] = json.load(f)
            except (IOError, ValueError) as e:
                # Return empty dict if file doesn't exist or is invalid
                self._cache[path] = {}
        return self._cache[path]

    def get_test_users(self):
        """Get test user fixtures."""
        path = os.path.join(self.fixtures_dir, 'test-users.json')
        return self._load_json(path).get('users', [])

    def get_user_by_email(self, email):
        """Get a specific test user by email."""
        for user in self.get_test_users():
            if user.get('email', '').lower() == email.lower():
                return user
        return None

    def get_user_by_role(self, role):
        """Get first test user with specified role."""
        for user in self.get_test_users():
            if user.get('role') == role:
                return user
        return None

    def get_test_config(self):
        """Get test configuration."""
        path = os.path.join(self.fixtures_dir, 'test-config.json')
        return self._load_json(path)

    def get_form_submissions(self):
        """Get sample form submission fixtures."""
        path = os.path.join(self.fixtures_dir, 'form-submissions.json')
        return self._load_json(path).get('submissions', [])

    def get_ttc_test_config(self):
        """Get test TTC country and dates configuration."""
        path = os.path.join(self.storage_dir, 'ttc_country_and_dates_test.json')
        return self._load_json(path)

    def get_ttc_option_by_value(self, value):
        """Get a specific TTC option by its value."""
        for option in self.get_ttc_test_config():
            if option.get('value') == value:
                return option
        return None

    def get_active_ttc_options(self):
        """Get all TTC options that should be active in tests."""
        # In test mode with future dates, all test options are "active"
        return self.get_ttc_test_config()

    def get_expired_ttc_options(self):
        """Get TTC options with expired deadlines for testing."""
        expired = []
        for option in self.get_ttc_test_config():
            if 'expired' in option.get('value', '').lower():
                expired.append(option)
        return expired


# Global fixture loader instance
_fixture_loader = None


def get_fixture_loader():
    """Get the global fixture loader instance."""
    global _fixture_loader
    if _fixture_loader is None:
        _fixture_loader = FixtureLoader()
    return _fixture_loader


def load_fixtures_into_context(context):
    """
    Load all fixtures into the behave context object.

    Args:
        context: Behave context object
    """
    loader = get_fixture_loader()

    context.fixture_users = loader.get_test_users()
    context.fixture_config = loader.get_test_config()
    context.fixture_submissions = loader.get_form_submissions()
    context.fixture_ttc_options = loader.get_ttc_test_config()
    context.fixtures = loader

    # Convenience methods
    context.get_user = loader.get_user_by_email
    context.get_user_by_role = loader.get_user_by_role
    context.get_ttc_option = loader.get_ttc_option_by_value
