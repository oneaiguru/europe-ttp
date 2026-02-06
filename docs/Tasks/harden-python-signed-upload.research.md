# harden-python-signed-upload: Research Findings

## Task Summary
Make legacy signed-upload URL generation safe and robust.

## File Analyzed
`pyutils/upload.py` - Python 2.7 App Engine module for generating signed upload URLs

## Current Implementation Analysis

### 1. Service Account File Handling (Line 44)
```python
client = storage.Client().from_service_account_json(os.environ['SERVICE_JSON_FILE'])
```

**Findings**:
- Uses `os.environ['SERVICE_JSON_FILE']` which will raise `KeyError` if environment variable not set
- No graceful fallback for missing environment variable
- In production, this would cause a 500 error on module import

**Risk**: Medium - Service account file is required for GCS operations

### 2. Filepath Validation (Lines 74-86)
```python
filepath = self.request.get('filepath', '')
if filepath:
    # Reject directory traversal attempts
    if '..' in filepath or filepath.startswith('/'):
        self.response.status = 400
        self.response.write(json.dumps({'error': 'Invalid filepath'}))
        return
    # Only allow alphanumeric, hyphens, underscores, and forward slashes
    if not re.match(r'^[\w\-/]+$', filepath):
        self.response.status = 400
        self.response.write(json.dumps({'error': 'Invalid filepath characters'}))
        return
```

**Findings**:
- ✅ Validates against `..` (directory traversal)
- ✅ Rejects absolute paths (starting with `/`)
- ✅ Uses regex whitelist for allowed characters
- ⚠️ But the client-provided `filepath` is directly concatenated with filename (line 96)

**Risk**: Low - Good validation in place

### 3. Filename Handling (Lines 96)
```python
filename = filepath + self.request.get('filename', default_filename_prefix + '_{}'.format(int(time.time())))
```

**Findings**:
- ⚠️ Client-provided `filename` is appended directly after validated `filepath`
- ⚠️ No validation of the client-provided `filename` content
- Default uses user email + timestamp (server-controlled)

**Risk**: Medium - Filename not sanitized, could contain problematic characters

### 4. Signed URL Generation (Lines 98-106)
```python
file_blob = bucket.blob(filename, chunk_size=262144 * 5)
url = file_blob.generate_signed_url(
    datetime.datetime.now() + datetime.timedelta(minutes=SIGNED_URL_EXPIRATION_MINUTES),
    method='PUT',
    content_type=content_type,
    max_bytes=MAX_FILE_SIZE
)
```

**Findings**:
- ✅ Uses reduced expiration (15 minutes) via `SIGNED_URL_EXPIRATION_MINUTES`
- ✅ Enforces `MAX_FILE_SIZE` (10MB) via `max_bytes` parameter
- ✅ Specifies `method='PUT'` for upload
- ⚠️ The `filename` is used directly without URL encoding

**Risk**: Low-Medium - `max_bytes` parameter may not be supported in all GCS client versions

### 5. Content-Type Validation (Lines 88-93)
```python
content_type = self.request.get('content_type', '')
if content_type and content_type not in ALLOWED_CONTENT_TYPES:
    self.response.status = 400
    self.response.write(json.dumps({'error': 'Invalid content type'}))
    return
```

**Findings**:
- ✅ Uses whitelist `ALLOWED_CONTENT_TYPES`
- ✅ Returns 400 for invalid types
- ⚠️ Content type is optional (empty string allowed)

**Risk**: Low - Whitelist approach is correct

### 6. Post-Upload Handler (Lines 114-124)
```python
class PostUploadHandler(webapp2.RequestHandler):
    def post(self):
        key = self.request.params.get('key')
        file_obj = ndb.Key(urlsafe=key).get()
        user = users.get_current_user()
        if user:
            _ttc_user = ttc_portal_user.TTCPortalUser(user.email())
            _ttc_user.set_photo_file(file_obj.filename)
            _ttc_user.save_user_data()
```

**Findings**:
- ⚠️ No validation that `file_obj` exists (could be `None`)
- ⚠️ No validation that the user owns this file (any user can use any key)
- ⚠️ No authentication check before accessing the file

**Risk**: High - Any authenticated user can access any file by providing its key

## Security Issues Summary

| Issue | Severity | Location |
|-------|----------|----------|
| Missing SERVICE_JSON_FILE causes crash | Medium | Line 44 |
| Client filename not sanitized | Medium | Line 96 |
| Post-upload has no ownership validation | High | Lines 118-121 |
| Filename not URL-encoded | Low | Line 96 |

## Legacy Code Context
This is Python 2.7 App Engine legacy code that:
- Uses `webapp2` framework (deprecated)
- Uses `ndb` for database (App Engine Datastore)
- Uses `users.get_current_user()` for authentication (Google Accounts API)
- Uses `google-cloud-storage` Python client

## Comparison with Next.js Implementation
The Next.js implementation (`app/api/upload/signed-url/route.ts`) was hardened to:
1. Ignore client-provided filename entirely
2. Generate server-controlled filenames using sanitized user email + timestamp + random suffix
3. URL-encode the object key

## Recommendations
Given the "legacy code is read-only" constraint:
1. Add error handling for missing `SERVICE_JSON_FILE`
2. URL-encode the filename before using it in blob path
3. Add ownership check in `PostUploadHandler` (if possible within read-only constraint)
4. Document that this endpoint requires platform-level auth (Google Accounts API)

## Files Requiring Changes
1. `pyutils/upload.py:44` - Add try/except for SERVICE_JSON_FILE
2. `pyutils/upload.py:96` - Sanitize/URL-encode filename
3. `pyutils/upload.py:118-124` - Add ownership validation (if possible)
