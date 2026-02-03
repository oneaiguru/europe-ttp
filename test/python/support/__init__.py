# -*- coding: utf-8 -*-
"""
Test support package for BDD testing."""
from .fixtures import (
    FixtureLoader,
    get_fixture_loader,
    load_fixtures_into_context,
)

__all__ = [
    'FixtureLoader',
    'get_fixture_loader',
    'load_fixtures_into_context',
]
