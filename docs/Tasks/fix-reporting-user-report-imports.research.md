# TASK-056: fix-reporting-user-report-imports - Research

## Evidence

### 1. Missing `blobstore` import (line 36, used on line 43)
- **File**: `reporting/user_report.py`
- **Line 36**: `# from google.appengine.ext.blobstore import BlobKey` (commented out)
- **Line 43**: `key = blobstore.create_gs_key(path)` (uses `blobstore`)
- **Problem**: The `blobstore` module is never imported, only a commented-out `BlobKey` class import exists.

### 2. Missing `images` import (line 37, used on line 46)
- **File**: `reporting/user_report.py`
- **Line 37**: `# from google.appengine.api.images import get_serving_url` (commented out)
- **Line 46**: `url = images.get_serving_url(key, size=max_width, crop=True)` (uses `images`)
- **Problem**: The `images` module is never imported, only a commented-out `get_serving_url` function import exists.

### 3. `CLOUD_STORAGE_LOCATION` is accessible (line 42)
- **File**: `constants.py`
- **Line 35**: `CLOUD_STORAGE_LOCATION = '/' + BUCKET_NAME + '/'`
- **Context**: Already imported as `import constants` (line 22 in user_report.py)
- **Problem**: `constants.CLOUD_STORAGE_LOCATION` should be used, not bare `CLOUD_STORAGE_LOCATION`

## Summary

The `get_user_image_url` method (lines 35-47) uses three symbols that are not properly imported:
1. `blobstore` - module not imported (line 43)
2. `images` - module not imported (line 46)
3. `CLOUD_STORAGE_LOCATION` - accessed as bare name but should be `constants.CLOUD_STORAGE_LOCATION` (line 42)

## Required Changes

1. Uncomment and fix imports at lines 36-37:
   - `from google.appengine.ext import blobstore`
   - `from google.appengine.api import images`

2. Fix `CLOUD_STORAGE_LOCATION` reference on line 42 to use `constants.CLOUD_STORAGE_LOCATION`
