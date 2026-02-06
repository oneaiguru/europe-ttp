# TASK-056: fix-reporting-user-report-imports - Implementation Plan

## Summary
Fix missing imports in `reporting/user_report.py` for `blobstore` and `images` modules, and fix `CLOUD_STORAGE_LOCATION` reference.

## Implementation Steps

### Step 1: Add module imports
**File**: `reporting/user_report.py`
**Lines**: After line 20 (after `import cloudstorage as gcs`)

Add the following imports:
```python
from google.appengine.ext import blobstore
from google.appengine.api import images
```

**Rationale**: The `get_user_image_url` method (lines 35-47) uses:
- `blobstore.create_gs_key()` on line 43
- `images.get_serving_url()` on line 46

Neither module is currently imported. Lines 36-37 contain commented-out imports that import specific classes/functions, but the code uses the module namespace, not the direct imports.

### Step 2: Fix CLOUD_STORAGE_LOCATION reference
**File**: `reporting/user_report.py`
**Line**: 42

Change:
```python
path = '/gs' + CLOUD_STORAGE_LOCATION + image_file
```

To:
```python
path = '/gs' + constants.CLOUD_STORAGE_LOCATION + image_file
```

**Rationale**: `constants` is imported on line 22, but `CLOUD_STORAGE_LOCATION` is accessed as a bare name. It must be accessed via `constants.CLOUD_STORAGE_LOCATION`.

### Step 3: Remove obsolete commented code (optional)
**File**: `reporting/user_report.py`
**Lines**: 36-39

Remove the commented-out imports that are no longer accurate:
```python
# from google.appengine.ext.blobstore import BlobKey
# from google.appengine.api.images import get_serving_url
# key = BlobKey('imagekey')
# url = get_serving_url(key)
```

**Rationale**: These comments are misleading - they import specific symbols while the actual code uses the module namespace.

## Files to Change
1. `reporting/user_report.py` - Add imports, fix constant reference

## Tests to Run

```bash
# Python syntax check
python -m py_compile reporting/user_report.py

# BDD verify
bun run bdd:verify

# Python BDD check
bun run bdd:python reporting/user_report.py
```

## Verification
After changes:
1. No `NameError` for `blobstore`, `images`, or `CLOUD_STORAGE_LOCATION`
2. Syntax check passes
3. BDD verify passes

## Risks
- **Low risk**: These are straightforward import fixes
- The method `get_user_image_url` may not be actively used (it appears in the code but has no obvious callers)
- No behavior changes, only fixing broken references

## Rollback
If issues arise, revert the import additions and constant reference fix.

## Expected Outcome
The `get_user_image_url` method will have all required imports and will execute without `NameError` exceptions.
