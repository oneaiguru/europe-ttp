# TASK-056: fix-reporting-user-report-imports

## Goal
Fix missing imports/constants used in user_report image serving (`blobstore`, `images`, `CLOUD_STORAGE_LOCATION`).

## Legacy Reference
- File: `reporting/user_report.py`
- Lines: 36-46 (imported but commented-out modules are actually used)

## Acceptance Criteria
1. `blobstore` and `images` are properly imported from `google.appengine.api`
2. `CLOUD_STORAGE_LOCATION` is accessible via the existing `constants` import
3. Code at lines 42-46 can execute without `NameError`

## Files to Modify
- [ ] `reporting/user_report.py` - Uncomment and fix imports for `blobstore`, `images`

## Test Commands
```bash
# Python syntax check
python -m py_compile reporting/user_report.py
# BDD verify
bun run bdd:verify
```

## Context
The `get_user_image_url` method (lines 35-47) uses:
- `CLOUD_STORAGE_LOCATION` (line 42) - defined in `constants.py`, already imported as `import constants`
- `blobstore.create_gs_key` (line 43) - module imported but commented out on line 36
- `images.get_serving_url` (line 46) - module imported but commented out on line 37

The imports were commented out (lines 36-37) but are still needed for the method to work.
