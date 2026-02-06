# TASK: fix-api-py-or-disable-handler

## Task ID
fix-api-py-or-disable-handler

## Priority
p2

## Source
docs/review/REVIEW_DRAFTS.md

## Description
Ensure `/api` handler module is importable, or remove/disable it safely.

## Evidence Locations (from review)
- `api.py:17` - Import error location
- `app.yaml:77` - Handler reference

## Acceptance Criteria
1. `api.py` imports without syntax errors
2. `app.yaml` does not reference broken handlers

## Feature File
N/A (fix/hardening task - no BDD scenarios)

## Type
Fix/Hardening - No BDD scenarios required

## Status
✅ COMPLETE

## Implementation Summary
Disabled the broken `/api/.*` handler in all app.yaml files:
- `app.yaml` - Removed handler block (lines 76-79)
- `app-dev.yaml` - Removed handler block (lines 59-62)
- `app-20190828.yaml` - Removed handler block (lines 75-78)

The `api.py` file remains in place as historical reference but is no longer referenced by any handlers. This was safe because:
- BDD tests use `/users/upload-form-data` endpoint instead
- No frontend references to `/api/upload-form`
- `api.py` contains incomplete stub code with syntax errors
