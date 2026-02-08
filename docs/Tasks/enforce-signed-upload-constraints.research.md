# TASK-077: enforce-signed-upload-constraints - Research

## Executive Summary

**Status**: ALREADY IMPLEMENTED - No code changes required.

The security constraints described in TASK-077 are already fully implemented in `app/api/upload/signed-url/route.ts`. This research confirms that:

1. **File type validation**: Already implemented via `ALLOWED_CONTENT_TYPES` whitelist (lines 22-29)
2. **Directory traversal prevention**: Already implemented with ".." and leading "/" checks (lines 69-71)
3. **Path character validation**: Already implemented with regex whitelist `/^[\w\-/]+$/` (line 73)
4. **Path normalization**: Server-controlled filename generation prevents client manipulation

The original review finding that prompted this task appears to be outdated, referring to an earlier version of the code before TASK-047 ("harden-nextjs-signed-upload", completed 2026-02-06) was implemented.

---

## File: app/api/upload/signed-url/route.ts

### 1. Content-Type Whitelist (Lines 22-29)

```typescript
const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;
```

**Findings**:
- ✅ Whitelist approach for file types (deny-by-default)
- ✅ Matches legacy Python implementation exactly (`pyutils/upload.py:29-37`)
- ✅ Covers common image formats, PDF, and Word documents

### 2. File Size Enforcement (Lines 31-32)

```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024;
```

**Findings**:
- ✅ 10MB limit defined (matches legacy `pyutils/upload.py:40`)
- ⚠️ Note: This constant is defined but not actively used in the current placeholder implementation
- ℹ️ In production GCS signed URLs, `max_bytes` parameter would be passed to `generate_signed_url()`

### 3. URL Expiration (Lines 34-35)

```typescript
const URL_EXPIRATION_MINUTES = 15;
```

**Findings**:
- ✅ 15-minute expiration (matches legacy `pyutils/upload.py:42-43`)
- ✅ Used in URL generation (line 97)

### 4. Directory Traversal Prevention (Lines 66-76)

```typescript
if (filepath) {
  // Reject directory traversal attempts
  if (filepath.includes('..') || filepath.startsWith('/')) {
    return Response.json({ error: 'Invalid filepath' }, { status: 400 });
  }
  // Only allow alphanumeric, hyphens, underscores, and forward slashes
  if (!/^[\w\-/]+$/.test(filepath)) {
    return Response.json({ error: 'Invalid filepath characters' }, { status: 400 });
  }
}
```

**Findings**:
- ✅ Validates against `..` (directory traversal) - line 69
- ✅ Rejects absolute paths (starting with `/`) - line 69
- ✅ Uses regex whitelist for allowed characters - line 73
- ✅ Returns HTTP 400 on invalid input
- ✅ Matches legacy Python implementation (`pyutils/upload.py:82-91`)

### 5. Content-Type Validation (Lines 78-81)

```typescript
if (content_type && !ALLOWED_CONTENT_TYPES.includes(content_type as (typeof ALLOWED_CONTENT_TYPES)[number])) {
  return Response.json({ error: 'Invalid content type' }, { status: 400 });
}
```

**Findings**:
- ✅ Server-side validation (cannot be bypassed by client)
- ✅ Returns HTTP 400 for invalid types
- ✅ Matches legacy Python implementation (`pyutils/upload.py:94-98`)

### 6. Server-Controlled Filename Generation (Lines 83-91)

```typescript
const timestamp = Math.floor(Date.now() / 1000);
// Security: Sanitize user email and generate unique filename
// Client-provided filename is intentionally ignored to prevent path traversal
// and malicious filenames. All filenames are server-controlled.
const sanitizedUser = user.replace(/[^a-zA-Z0-9_-]/g, '_');
const randomSuffix = Math.random().toString(36).substring(2, 10);
const safeFilename = `${sanitizedUser}_${timestamp}_${randomSuffix}`;
const fullFilename = filepath ? `${filepath}/${safeFilename}` : safeFilename;
```

**Findings**:
- ✅ Client-provided `filename` is intentionally ignored (line 64)
- ✅ User email is sanitized (removes special characters)
- ✅ Random suffix prevents collisions
- ✅ Final filename is completely server-controlled

### 7. URL Encoding (Line 100)

```typescript
const encodedFilename = encodeURIComponent(fullFilename);
```

**Findings**:
- ✅ Proper URL encoding for GCS object paths
- ✅ Matches legacy Python implementation (`pyutils/upload.py:112`)

---

## File: app/utils/crypto.ts

### Upload Token Security

**Findings**:
- ✅ HMAC-signed tokens prevent forgery (lines 35-52)
- ✅ Double-encoded payload prevents information leakage
- ✅ Token verification with signature validation (lines 61-118)
- ✅ Token expiration checking (lines 127-131)

---

## File: app/api/upload/verify/route.ts

### Token Verification Endpoint

**Findings**:
- ✅ Requires authentication (lines 34-37)
- ✅ Verifies HMAC signature (lines 55-59)
- ✅ Checks token expiration (lines 62-64)
- ✅ Validates ownership (user must match authenticated user, lines 67-69)

---

## Comparison with Legacy Python Implementation

### File: pyutils/upload.py

| Feature | Legacy Python | Next.js TypeScript | Status |
|---------|---------------|-------------------|--------|
| Content-type whitelist | Lines 29-37 | Lines 22-29 | ✅ Match |
| File size limit | Line 40 | Line 32 | ✅ Match |
| URL expiration | Lines 42-43 | Lines 34-35 | ✅ Match |
| Directory traversal check | Lines 82-86 | Lines 69-71 | ✅ Match |
| Character whitelist | Lines 87-91 | Lines 72-76 | ✅ Match |
| Content-type validation | Lines 94-98 | Lines 78-81 | ✅ Match |
| Server-controlled filename | Lines 104-109 | Lines 83-91 | ✅ Match |
| URL encoding | Line 112 | Line 100 | ✅ Match |
| Authentication required | Lines 72-76 | Lines 51-54 | ✅ Match |

**Conclusion**: The TypeScript implementation has feature parity with the hardened Python implementation from TASK-046.

---

## Test Coverage Analysis

### File: specs/features/uploads/upload_security.feature

Existing test scenarios:
1. ✅ Anonymous user cannot request signed URL (line 6-9)
2. ✅ Directory traversal is blocked (line 11-15)
3. ✅ Invalid content type is rejected (line 17-21)
4. ✅ Valid content type is accepted (line 23-27)

**Findings**:
- ✅ Security scenarios are already specified
- ✅ Tests cover the main attack vectors

### File: test/typescript/steps/uploads_steps.ts

**Analysis of test implementation**:
- ⚠️ Tests are currently mocked/simulated (do not make real HTTP requests)
- ⚠️ The hardening is verified in the step definitions themselves (lines 120-132, 144-169)
- ⚠️ This means the tests verify the test logic, not the actual route implementation

**Issue**: The BDD tests validate the test step logic, not the actual API route. The steps contain hardcoded validation logic that mirrors the route, but doesn't actually test the route.

---

## Gap Analysis

### What's Already Implemented (No Changes Needed)
1. ✅ File type validation via content-type whitelist
2. ✅ Directory traversal prevention (.. and leading /)
3. ✅ Path character validation (regex whitelist)
4. ✅ Server-controlled filename generation
5. ✅ URL encoding for object keys
6. ✅ HMAC-signed upload tokens
7. ✅ Token verification endpoint

### What Could Be Enhanced (Future Work)
1. The BDD tests don't actually make HTTP requests to the route
2. File size constant is defined but not used in the placeholder implementation
3. No tests for null bytes, encoded characters, or edge cases in filepath
4. No tests for very long filepaths (potential DoS)

---

## Recommendations

### Option 1: Close Task as Complete (Recommended)

**Rationale**: All security constraints from TASK-077 are already implemented. The task description appears to be based on an outdated review finding.

**Action**: Mark TASK-077 as DONE with a note that constraints were already implemented in TASK-047.

### Option 2: Convert to Test Enhancement Task

**Rationale**: While the code is correct, the BDD tests are mocked and don't actually test the real implementation.

**Action**: Convert TASK-077 to focus on:
1. Making BDD tests actually call the API endpoints
2. Adding edge case scenarios (null bytes, long paths, etc.)
3. Verifying end-to-end security posture

---

## Decision Point

The security constraints are **already fully implemented**. This task should either:
1. **Close as DONE** - Code meets all acceptance criteria
2. **Pivot to test improvements** - Focus on end-to-end testing rather than implementation

No code changes to `app/api/upload/signed-url/route.ts` are required for security.
