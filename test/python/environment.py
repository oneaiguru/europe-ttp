# -*- coding: utf-8 -*-
"""
Behave environment loader for test/python.

This file ensures Behave can find the steps directory when running
from test/python with features symlinked to specs/features.
"""

# Ensure steps are on the path
import sys
import os

# Add steps directory to path
steps_dir = os.path.join(os.path.dirname(__file__), 'steps')
if steps_dir not in sys.path:
    sys.path.insert(0, steps_dir)

# Import the actual environment from features
from specs.features.environment import *