# TASK: Harden Signed Upload URL - Implementation Plan

## Task ID
harden-signed-upload-url

## Implementation Strategy

### Phase 1: Fix Legacy Python Implementation (CRITICAL)

**File**: `pyutils/upload.py`

#### Change 1: Require Authentication
**Lines**: 47-51
**Action**: Reject anonymous requests

```python
# BEFORE (vulnerable):
user = users.get_current_user()
if user:
    default_filename_prefix = user.email()
else:
    default_filename_prefix = 'noname'

# AFTER (secure):
user = users.get_current_user()
if not user:
    self.response.status = 401
    self.response.write(json.dumps({'error': 'Authentication required'}))
    return
default_filename_prefix = user.email()
```

#### Change 2: Reduce URL Expiration
**Lines**: 55-56
**Action**: Change from 2 hours to 15 minutes

```python
# BEFORE:
url = file_blob.generate_signed_url(
    datetime.datetime.now() + datetime.timedelta(hours=2), 
    method='PUT',
    content_type=content_type
)

# AFTER:
url = file_blob.generate_signed_url(
    datetime.datetime.now() + datetime.timedelta(minutes=15), 
    method='PUT',
    content_type=content_type
)
```

#### Change 3: Add Path Validation
**Lines**: 52-53
**Action**: Sanitize filepath to prevent directory traversal

```python
# BEFORE:
filename = self.request.get('filepath','') + self.request.get('filename', default_filename_prefix + '_{}'.format(int(time.time())))

# AFTER:
import re
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

filename = filepath + self.request.get('filename', default_filename_prefix + '_{}'.format(int(time.time())))
```

#### Change 4: Add Content-Type Whitelist
**Lines**: 53-54
**Action**: Only allow specific MIME types

```python
# Add after line 53:
ALLOWED_CONTENT_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

if content_type and content_type not in ALLOWED_CONTENT_TYPES:
    self.response.status = 400
    self.response.write(json.dumps({'error': 'Invalid content type'}))
    return
```

#### Change 5: Add File Size Limit Check
**Lines**: Before line 55
**Action**: Validate max file size

```python
# Add max file size parameter (in bytes)
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# When generating signed URL:
url = file_blob.generate_signed_url(
    datetime.datetime.now() + datetime.timedelta(minutes=15),
    method='PUT',
    content_type=content_type,
    max_bytes=MAX_FILE_SIZE
)
```

### Phase 2: Create TypeScript Implementation

**New File**: `app/api/upload/signed-url/route.ts`

Based on the Python implementation but with security built in:

```typescript
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const URL_EXPIRATION_MINUTES = 15;

interface SignedUrlRequest {
  filename?: string;
  filepath?: string;
  content_type?: string;
}

interface SignedUrlResponse {
  url?: string;
  key?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<SignedUrlResponse>> {
  // 1. Check authentication
  const user = request.headers.get('x-user-email');
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // 2. Parse request body
  const body = (await request.json()) as SignedUrlRequest;
  const { filename, filepath, content_type } = body;

  // 3. Validate filepath (prevent directory traversal)
  if (filepath) {
    if (filepath.includes('..') || filepath.startsWith('/')) {
      return NextResponse.json({ error: 'Invalid filepath' }, { status: 400 });
    }
    if (!/^[\w\-/]+$/.test(filepath)) {
      return NextResponse.json({ error: 'Invalid filepath characters' }, { status: 400 });
    }
  }

  // 4. Validate content type
  if (content_type && !ALLOWED_CONTENT_TYPES.includes(content_type)) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
  }

  // 5. Generate filename
  const timestamp = Math.floor(Date.now() / 1000);
  const safeFilename = filename || `${user.replace('@', '-')}_${timestamp}`;
  const fullFilename = filepath ? `${filepath}/${safeFilename}` : safeFilename;

  // 6. Generate signed URL (using Google Cloud Storage client library)
  // This is a placeholder - actual implementation uses @google-cloud/storage
  const signedUrl = `https://storage.googleapis.com/${process.env.BUCKET_NAME}/${fullFilename}?expires=${timestamp + URL_EXPIRATION_MINUTES * 60}`;

  // 7. Generate upload key (for tracking)
  const uploadKey = Buffer.from(`${user}:${timestamp}:${fullFilename}`).toString('base64');

  return NextResponse.json({
    url: signedUrl,
    key: uploadKey,
  });
}
```

### Phase 3: Update BDD Tests

**Files to Update**:
- `test/python/steps/uploads_steps.py`
- `test/typescript/steps/uploads_steps.ts`

**New Test Scenarios to Add**:

```gherkin
Scenario: Anonymous user cannot request signed URL
  When I request a signed upload URL without authentication
  Then I should receive a 401 error
  And no signed URL should be generated

Scenario: Signed URL expires after 15 minutes
  Given I am authenticated as a TTC applicant
  When I request a signed upload URL for a profile photo
  Then the signed URL should expire within 15 minutes

Scenario: Directory traversal is blocked
  Given I am authenticated as a TTC applicant
  When I request a signed URL with filepath "../../etc/passwd"
  Then I should receive a 400 error
  And the error should mention "Invalid filepath"

Scenario: Invalid content type is rejected
  Given I am authenticated as a TTC applicant
  When I request a signed URL with content type "application/exe"
  Then I should receive a 400 error
  And the error should mention "Invalid content type"
```

### Phase 4: Step Registry Updates

**File**: `test/bdd/step-registry.ts`

Add new step patterns:
- `I request a signed upload URL without authentication`
- `the signed URL should expire within {int} minutes`
- `I request a signed URL with filepath {string}`
- `the error should mention {string}`

### Phase 5: Verification

**Run Tests**:
```bash
# Python tests
python3 -m behave test/python/features/uploads/

# TypeScript tests
npx tsx scripts/bdd/run-typescript.ts specs/features/uploads/

# Alignment check
npx tsx scripts/bdd/verify-alignment.ts
```

**Expected Results**:
- All existing tests pass
- New security tests pass
- 0 orphan, 0 dead steps

## Implementation Order

1. **Fix Python implementation** (`pyutils/upload.py`) - CRITICAL
2. **Update Python BDD steps** (`test/python/steps/uploads_steps.py`)
3. **Verify Python tests pass**
4. **Create TypeScript route** (`app/api/upload/signed-url/route.ts`)
5. **Update TypeScript BDD steps** (`test/typescript/steps/uploads_steps.ts`)
6. **Verify TypeScript tests pass**
7. **Run alignment check**
8. **Update documentation**

## Acceptance Criteria

- [ ] Signed URLs require authentication (401 if not authenticated)
- [ ] Signed URLs expire in 15 minutes (not 2 hours)
- [ ] Directory traversal attempts are blocked (400 error)
- [ ] Invalid content types are rejected (400 error)
- [ ] File size limits are enforced
- [ ] All BDD tests pass (Python + TypeScript)
- [ ] Alignment check passes (0 orphan, 0 dead)
- [ ] Type checking passes

## Security Checklist

- [ ] Authentication required before generating URL
- [ ] URL expiration is 15 minutes or less
- [ ] Path validation prevents directory traversal
- [ ] Content-type whitelist enforced
- [ ] File size limits enforced
- [ ] No hardcoded credentials
- [ ] Proper error handling (no information leakage)
