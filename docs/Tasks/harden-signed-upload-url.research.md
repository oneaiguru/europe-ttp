# TASK: Harden Signed Upload URL - Research

## Task ID
harden-signed-upload-url

## Research Findings

### Current Implementation

#### Legacy Python Implementation (`pyutils/upload.py`)

**Location**: `pyutils/upload.py:42-61`

**Key Security Issues Identified**:

1. **No Authentication Check** (Line 47-51):
   - The handler checks `if user:` but allows anonymous access with `default_filename_prefix = 'noname'`
   - This means **anyone can request signed URLs without authentication**

2. **Excessive URL Expiration** (Line 55):
   - Signed URLs are valid for **2 hours** (`datetime.timedelta(hours=2)`)
   - Best practice is 15 minutes or less for upload URLs

3. **No Input Validation** (Line 52-53):
   - `filepath` and `filename` parameters are not validated
   - Potential for **directory traversal attacks** via malicious filepath
   - No content-type validation beyond accepting what's provided

4. **No Rate Limiting**:
   - No protection against abuse
   - An attacker could request unlimited signed URLs

5. **No Authorization Check**:
   - Does not verify if user has permission to upload
   - Does not check file size limits before generating URL

```python
# Current vulnerable code (lines 42-61):
class SignedUrlHandler(webapp2.RequestHandler):
    def get(self):
        """Generates signed url to which data will be uploaded."""
        user = users.get_current_user()
        if user:
            default_filename_prefix = user.email()
        else:
            default_filename_prefix = 'noname'  # ⚠️ ALLOWS ANONYMOUS ACCESS
        
        filename = self.request.get('filepath','') + self.request.get('filename', default_filename_prefix + '_{}'.format(int(time.time())))
        content_type = self.request.get('content_type', '')
        # ⚠️ NO PATH VALIDATION - Directory traversal possible
        
        file_blob = bucket.blob(filename, chunk_size=262144 * 5)
        url = file_blob.generate_signed_url(datetime.datetime.now() + datetime.timedelta(hours=2), method='PUT',
                                            content_type=content_type)  # ⚠️ 2 HOURS TOO LONG
        
        file_upload = FileModel(filename=filename)
        file_upload.put()
        key_safe = file_upload.key.urlsafe()
        data = {'url': url, 'key': key_safe}
        self.response.write(json.dumps(data))
```

#### TypeScript Test Implementations

**Locations**:
- `test/typescript/steps/uploads_steps.ts` - Mock implementation
- `test/python/steps/uploads_steps.py` - Mock implementation

Both test implementations are **mocks only** - they don't test actual security properties.

### TypeScript App Implementation Status

**Finding**: No TypeScript implementation of the signed URL endpoint exists yet.

The `app/users/upload-form-data/route.ts` exists but handles form data submission, not signed URL generation for file uploads.

### Security Vulnerabilities Summary

| Vulnerability | Severity | Location | Impact |
|--------------|----------|----------|--------|
| No authentication required | **CRITICAL** | `pyutils/upload.py:47-51` | Anyone can generate upload URLs |
| 2-hour URL expiration | **HIGH** | `pyutils/upload.py:55` | Extended window for URL abuse |
| No path validation | **HIGH** | `pyutils/upload.py:52` | Directory traversal attacks |
| No rate limiting | **MEDIUM** | N/A | DoS / resource exhaustion |
| No file type validation | **MEDIUM** | `pyutils/upload.py:53` | Upload of malicious files |
| No authorization check | **MEDIUM** | N/A | Users can upload without permission |

### Google Cloud Storage Integration

**Current Setup**:
- Uses `google.cloud.storage` library
- Bucket name from `constants.BUCKET_NAME`
- Service account from `os.environ['SERVICE_JSON_FILE']`

**Existing signed URL generation**:
- Uses `blob.generate_signed_url()` with expiration and method
- Includes content-type validation (good)
- Chunk size configured (1.25MB chunks)

## Recommendations

### Priority 1 (Critical - Must Fix)
1. **Require authentication** - Reject requests with no authenticated user
2. **Reduce URL expiration** - Change from 2 hours to 15 minutes
3. **Add path validation** - Sanitize filepath to prevent directory traversal

### Priority 2 (High - Should Fix)
4. **Add content-type whitelist** - Only allow specific MIME types
5. **Add file size limits** - Validate before generating URL
6. **Add rate limiting** - Per-user request limits

### Priority 3 (Medium - Nice to Have)
7. **Add authorization checks** - Verify user has permission to upload
8. **Add audit logging** - Track signed URL generation
9. **Add usage monitoring** - Alert on suspicious patterns

## Related Files

- `pyutils/upload.py` - Legacy implementation (NEEDS HARDENING)
- `test/typescript/steps/uploads_steps.ts` - Test mocks (no security tests)
- `test/python/steps/uploads_steps.py` - Test mocks (no security tests)
- `specs/features/uploads/photo_upload.feature` - BDD scenarios
- `specs/features/uploads/document_upload.feature` - BDD scenarios
