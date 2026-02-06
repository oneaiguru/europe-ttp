# TASK-052: reduce-test-fallbacks-python

## Task ID
reduce-test-fallbacks-python

## Priority
p2

## Source
docs/review/REVIEW_DRAFTS.md

## Description
Stop Python BDD steps from masking real failures with fake 200/HTML responses.

## Evidence Locations (from review)
- `test/python/steps/api_steps.py:155-163` - `_fake_response()` usage
- `test/python/steps/portal_steps.py:211-220` - `_fake_response()` usage

## Acceptance Criteria
1. Exceptions in critical API/portal steps fail the scenario (or require explicit mock mode).
2. Remove or gate `_fake_response()` use for production endpoints.

## Feature File
N/A (fix/hardening task - no BDD scenarios)

## Type
Fix/Hardening - No BDD scenarios required

## Status
TODO - Research needed
