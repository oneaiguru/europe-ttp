# -*- coding: utf-8 -*-
from __future__ import absolute_import

import os

"""
Shared test utilities for BDD steps.

IMPORTANT: _fake_response() will raise AssertionError unless BDD_MOCK_MODE=true.
This prevents tests from silently masking real application failures with fake
200/HTML responses when the legacy app is unavailable.

To run tests in fixture-only mode (without the legacy app):
    BDD_MOCK_MODE=true bun run bdd:python
"""

MOCK_MODE = os.environ.get('BDD_MOCK_MODE', 'false').lower() == 'true'


def _fake_response(body_text=''):
    """Return a fake response object for testing.

    Only works when BDD_MOCK_MODE=true. Otherwise raises AssertionError
    to prevent masking real application failures.

    Args:
        body_text: Optional text to set as the response body.

    Returns:
        An object with body, status, and status_int attributes.

    Raises:
        AssertionError: If MOCK_MODE is False (default).
    """
    if not MOCK_MODE:
        raise AssertionError(
            'Real handler not available and mock mode not enabled. '
            'Set BDD_MOCK_MODE=true to use fixture-only mode.'
        )
    return type('obj', (object,), {
        'body': body_text,
        'status': '200 OK',
        'status_int': 200
    })()
