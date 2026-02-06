# TASK: Harden Python Signed Upload

## Task ID
harden-python-signed-upload

## Priority
p2

## Source
docs/review/REVIEW_DRAFTS.md

## Description
Make legacy signed-upload URL generation safe and robust.

## Evidence Locations (from review)
- `pyutils/upload.py:44` - SERVICE_JSON_FILE usage
- `pyutils/upload.py:74-96` - Filepath and filename validation
- `pyutils/upload.py:101-106` - Signed URL generation
- `pyutils/upload.py:117-124` - Post-upload handler

## Acceptance Criteria
1. Validate both `filepath` and `filename` (no traversal, no reserved chars); allow only server-controlled prefixes.
2. Signed URL generation works in deployed runtime (no unsupported kwargs; handle missing `SERVICE_JSON_FILE` cleanly).
3. Post-upload handler validates key existence and ownership before using it.

## Feature File
N/A (fix/hardening task - no BDD scenarios)

## Type
Fix/Hardening - No BDD scenarios required

## Status
✅ COMPLETE
