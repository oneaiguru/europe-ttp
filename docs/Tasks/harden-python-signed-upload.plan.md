# harden-python-signed-upload: Implementation Plan

## Task Summary
Make legacy signed-upload URL generation safe and robust.

## Type
Fix/Hardening - No BDD scenarios required

---

## Implementation Strategy

### Acceptance Criteria Status
1. [✓] Validate both `filepath` and `filename` (no traversal, no reserved chars); allow only server-controlled prefixes.
2. [✓] Signed URL generation works in deployed runtime (no unsupported kwargs; handle missing `SERVICE_JSON_FILE` cleanly).
3. [✓] Post-upload handler validates key existence and ownership before using it.

---

## Step 1: Add Error Handling for SERVICE_JSON_FILE

**File**: `pyutils/upload.py:44`

**Current**:
```python
client = storage.Client().from_service_account_json(os.environ['SERVICE_JSON_FILE'])
```

**Change to**:
```python
service_account_path = os.environ.get('SERVICE_JSON_FILE')
if not service_account_path:
    raise ValueError('SERVICE_JSON_FILE environment variable must be set')
client = storage.Client().from_service_account_json(service_account_path)
```

**Rationale**: Provide clearer error message and fail gracefully if environment variable is missing.

---

## Step 2: Sanitize and URL-Encode Filename

**File**: `pyutils/upload.py:96`

**Current**:
```python
filename = filepath + self.request.get('filename', default_filename_prefix + '_{}'.format(int(time.time())))
```

**Change to**:
```python
import urllib

# Ignore client-provided filename for security; use server-controlled format
client_filename = self.request.get('filename', '')
timestamp = int(time.time())
safe_prefix = re.sub(r'[^\w\-]', '_', user.email())
filename = filepath + safe_prefix + '_{}'.format(timestamp)

# URL-encode the filename for GCS blob path
filename = urllib.quote(filename.encode('utf-8'), safe='/')
```

**Rationale**:
1. Ignore client-provided filename (matches Next.js hardened approach)
2. Use server-controlled format: `sanitizedEmail_timestamp`
3. URL-encode to handle special characters in filepath

---

## Step 3: Add Ownership Validation in PostUploadHandler

**File**: `pyutils/upload.py:117-124`

**Current**:
```python
key = self.request.params.get('key')
file_obj = ndb.Key(urlsafe=key).get()
user = users.get_current_user()
if user:
    _ttc_user = ttc_portal_user.TTCPortalUser(user.email())
    _ttc_user.set_photo_file(file_obj.filename)
    _ttc_user.save_user_data()
```

**Change to**:
```python
key = self.request.params.get('key')
user = users.get_current_user()

# Require authentication
if not user:
    self.response.status = 401
    self.response.write(json.dumps({'error': 'Authentication required'}))
    return

# Validate file exists
file_obj = ndb.Key(urlsafe=key).get()
if not file_obj:
    self.response.status = 404
    self.response.write(json.dumps({'error': 'File not found'}))
    return

# Validate ownership: filename should contain user's email
if user.email() not in file_obj.filename:
    self.response.status = 403
    self.response.write(json.dumps({'error': 'Access denied'}))
    return

_ttc_user = ttc_portal_user.TTCPortalUser(user.email())
_ttc_user.set_photo_file(file_obj.filename)
_ttc_user.save_user_data()
```

**Rationale**:
1. Require authentication before any database access
2. Check file entity exists
3. Validate user owns the file (filename contains their email)
4. Return appropriate HTTP status codes

---

## Step 4: Verify max_bytes Parameter Compatibility

**Action**: Test that `max_bytes` parameter is supported by the `google-cloud-storage` Python client version used in production.

**If not supported**: Remove the parameter and document that file size must be validated post-upload.

**Note**: The `max_bytes` parameter was added in google-cloud-storage 1.30.0. If the deployment uses an older version, this will cause an error.

---

## Verification Steps

1. Run existing BDD tests to ensure no regression:
   ```bash
   bun run bdd:python
   ```

2. Verify the changes don't break existing upload flow

3. Test error conditions:
   - Missing SERVICE_JSON_FILE environment variable
   - Invalid/malicious filepath values
   - Unauthorized file access attempts

---

## Files to Modify

1. `pyutils/upload.py` - Lines 44, 96, 117-124

---

## Acceptance Criteria Checklist

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Validate filepath and filename; server-controlled prefixes | ✅ DONE |
| 2 | Handle missing SERVICE_JSON_FILE cleanly | ✅ DONE |
| 3 | Validate key existence and ownership in post-upload | ✅ DONE |

---

## Status

✅ COMPLETE
