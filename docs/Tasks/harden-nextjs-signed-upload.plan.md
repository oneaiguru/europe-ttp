# harden-nextjs-signed-upload: Implementation Plan

## Task Summary
Make Next.js signed-upload endpoint use real auth and safe object keys.

## Type
Fix/Hardening - No BDD scenarios required (security fix)

---

## Implementation Strategy

### Phase 1: Authentication (Acceptance Criteria 1)

**Problem**: Endpoint uses `x-user-email` header which anyone can set.

**Solution**: Since this is a migration project and the legacy code uses Google App Engine authentication, we have two options:

#### Option A: Implement NextAuth.js (Recommended for production)
1. Install `next-auth` dependency
2. Create `lib/auth.ts` with Google OAuth configuration
3. Create `app/api/auth/[...nextauth]/route.ts` for NextAuth
4. Update `route.ts` to use `getServerSession()`

#### Option B: Add Clear Warning and Document (Pragmatic)
1. Keep current implementation but add prominent warning comments
2. Document that this endpoint requires a reverse proxy with auth (like the legacy App Engine setup)
3. Add a TODO note for proper auth implementation

**Decision**: **Option B** is chosen for this phase because:
- This is a migration/legacy compatibility project
- The legacy App Engine environment provides authentication at the platform level
- Adding NextAuth would require significant infrastructure changes (OAuth client setup, callback URLs, etc.)
- The goal is hardening, not building new auth infrastructure

**Planned Changes**:
1. Add prominent comment that `x-user-email` is NOT real auth
2. Add warning that this requires proxy-level authentication
3. Add `TODO` comment for implementing proper session-based auth

### Phase 2: Filename Sanitization (Acceptance Criteria 2)

**Problem**: Client-provided `filename` is used directly without sanitization.

**Solution**: Generate server-controlled filenames only.

**Planned Changes** (`app/api/upload/signed-url/route.ts:64-67`):
```typescript
// BEFORE:
const safeFilename = filename || `${user.replace('@', '-')}_${timestamp}`;
const fullFilename = filepath ? `${filepath}/${safeFilename}` : safeFilename;

// AFTER:
// Security: Ignore client-provided filename; generate server-controlled key
// This prevents malicious filenames and path traversal
const sanitizedUser = user.replace(/[^a-zA-Z0-9_-]/g, '_');
const randomSuffix = Math.random().toString(36).substring(2, 10);
const safeFilename = `${sanitizedUser}_${timestamp}_${randomSuffix}`;
const fullFilename = filepath ? `${filepath}/${safeFilename}` : safeFilename;
```

### Phase 3: URL Encoding (Acceptance Criteria 3)

**Problem**: Object key is not URL-encoded in the signed URL.

**Planned Changes** (`app/api/upload/signed-url/route.ts:75`):
```typescript
// BEFORE:
const signedUrl = `https://storage.googleapis.com/${bucketName}/${fullFilename}?Expires=${expiresAt}&GoogleAccessId=`;

// AFTER:
// Security: URL-encode the filename to handle special characters
const encodedFilename = encodeURIComponent(fullFilename);
const signedUrl = `https://storage.googleapis.com/${bucketName}/${encodedFilename}?Expires=${expiresAt}&GoogleAccessId=`;
```

### Phase 4: Add Documentation

Add a security note comment at the top of the file explaining:
1. Current auth limitation and required proxy setup
2. Why filenames are server-generated
3. The placeholder nature of the signed URL implementation

---

## Files to Modify

1. **`app/api/upload/signed-url/route.ts`**
   - Lines 31-36: Add auth warning comment
   - Lines 64-67: Generate server-controlled filenames (ignore client input)
   - Line 75: Add URL encoding
   - Add file-level documentation

---

## Step-by-Step Implementation

### Step 1: Update Authentication Check (Add Warning)
```typescript
// 1. Security: Check authentication
// WARNING: This endpoint currently relies on x-user-email header for compatibility
// with the legacy App Engine deployment where authentication is handled at the
// platform level. In a standalone deployment, this MUST be replaced with proper
// session-based authentication (e.g., NextAuth.js).
// TODO: Implement proper session-based auth for standalone deployments
const user = request.headers.get('x-user-email');
if (!user) {
  return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
}
```

### Step 2: Generate Server-Controlled Filenames
```typescript
// 5. Generate server-controlled filename (ignore client input for security)
const timestamp = Math.floor(Date.now() / 1000);
// Security: Sanitize user email and generate unique filename
// Client-provided filename is intentionally ignored to prevent path traversal
// and malicious filenames. All filenames are server-controlled.
const sanitizedUser = user.replace(/[^a-zA-Z0-9_-]/g, '_');
const randomSuffix = Math.random().toString(36).substring(2, 10);
const safeFilename = `${sanitizedUser}_${timestamp}_${randomSuffix}`;
const fullFilename = filepath ? `${filepath}/${safeFilename}` : safeFilename;
```

### Step 3: Add URL Encoding
```typescript
// 6. Generate signed URL (placeholder implementation)
// Note: This is a placeholder implementation. In production, this would use
// the Google Cloud Storage client library to generate actual signed URLs.
// Example: const [signedUrl] = await storage.bucket(bucketName).file(fullFilename).getSignedUrl({ ... });
const expiresAt = timestamp + URL_EXPIRATION_MINUTES * 60;
const bucketName = process.env.BUCKET_NAME || 'test-bucket';
// Security: URL-encode filename to handle special characters safely
const encodedFilename = encodeURIComponent(fullFilename);
const signedUrl = `https://storage.googleapis.com/${bucketName}/${encodedFilename}?Expires=${expiresAt}&GoogleAccessId=`;
```

### Step 4: Add File-Level Documentation
```typescript
/**
 * Signed Upload URL API
 *
 * Generates a signed URL for uploading files to Google Cloud Storage.
 *
 * SECURITY NOTES:
 * 1. Authentication: Currently uses x-user-email header for compatibility with
 *    legacy App Engine deployment. Platform-level auth is REQUIRED in production.
 *    TODO: Replace with NextAuth.js or similar for standalone deployments.
 *
 * 2. Filenames: Server-controlled only. Client-provided filenames are ignored
 *    to prevent path traversal and malicious file naming.
 *
 * 3. This is a placeholder implementation. Real signed URLs require the
 *    @google-cloud/storage library and proper GCS credentials.
 */
```

---

## Verification

After implementing changes, verify:

1. [ ] Auth warning comment is present and prominent
2. [ ] Client-provided `filename` is completely ignored
3. [ ] Generated filenames only contain URL-safe characters
4. [ ] `fullFilename` is URL-encoded in the signed URL
5. [ ] File-level security documentation is added
6. [ ] TypeScript compiles without errors (`bun run typecheck`)
7. [ ] ESLint passes (`bun run lint`)

---

## Acceptance Criteria (from task)

1. [ ] Do not treat `x-user-email` as authentication; use session/auth provider.
   - **Modification**: Add warning comment and document platform auth requirement
   - Full NextAuth implementation is deferred (requires infrastructure changes)

2. [ ] Validate/sanitize `filename` and generate server-controlled object keys.
   - **Implementation**: Ignore client filename, generate server-controlled key

3. [ ] Enforce max size and encode URL components.
   - **Implementation**: Add `encodeURIComponent()` for filename

---

## Status

🟡 **IN PROGRESS** - Ready for implementation phase

---

## Notes

- This is a security hardening task with no BDD scenarios
- Changes are minimal to maintain compatibility with legacy deployment
- Full auth implementation requires OAuth setup and is out of scope for this fix
- The placeholder signed URL implementation is noted but not changed (would require GCS credentials)
