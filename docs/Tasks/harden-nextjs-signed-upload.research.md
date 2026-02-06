# harden-nextjs-signed-upload: Research Findings

## Task Summary
Make Next.js signed-upload endpoint use real auth and safe object keys.

## Current Implementation Analysis

### File: `app/api/upload/signed-url/route.ts`

#### Issue 1: Weak Authentication (Lines 31-36)
```typescript
// 1. Security: Check authentication
const user = request.headers.get('x-user-email');
if (!user) {
  return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
}
```

**Problem**: The endpoint uses `x-user-email` header as authentication.
- Anyone can set this header to any email address
- No actual authentication verification
- Allows unauthorized file upload access

**Legacy Comparison**: The Python code at `pyutils/upload.py:67-71` uses:
```python
user = users.get_current_user()
if not user:
    self.response.status = 401
    self.response.write(json.dumps({'error': 'Authentication required'}))
    return
```

This uses Google App Engine's built-in `users.get_current_user()` which provides real authentication via Google Accounts.

#### Issue 2: Filename Sanitization (Lines 64-67)
```typescript
const timestamp = Math.floor(Date.now() / 1000);
const safeFilename = filename || `${user.replace('@', '-')}_${timestamp}`;
const fullFilename = filepath ? `${filepath}/${safeFilename}` : safeFilename;
```

**Problem**: If `filename` is provided by the client, it's used directly without sanitization.
- Only the `user` part has `@` replaced
- The `filename` parameter could contain path traversal or special characters
- Should sanitize or ignore client-provided filename entirely

**Legacy Comparison**: `pyutils/upload.py:96` uses server-controlled prefix:
```python
filename = filepath + self.request.get('filename', default_filename_prefix + '_{}'.format(int(time.time())))
```

The legacy code still allows client filename but prefixes it with user email.

#### Issue 3: URL Encoding (Line 75)
```typescript
const signedUrl = `https://storage.googleapis.com/${bucketName}/${fullFilename}?Expires=${expiresAt}&GoogleAccessId=`;
```

**Problem**: `fullFilename` is not URL-encoded.
- If filename contains spaces or special characters, the URL will be malformed
- Could lead to unexpected behavior or security issues

#### Issue 4: Placeholder Implementation (Lines 69-72)
```typescript
// Note: This is a placeholder implementation. In production, this would use
// the Google Cloud Storage client library to generate actual signed URLs.
```

**Current State**: This is NOT a real signed URL implementation. It just returns a fake URL string.

## Available Authentication Options in Next.js 14

### Option 1: NextAuth.js (Recommended)
- Industry standard for Next.js authentication
- Supports Google OAuth and other providers
- Provides `getServerSession()` for API routes
- Would match the legacy Google Accounts authentication

**Implementation Pattern**:
```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  const user = session.user.email;
  // ...
}
```

**Required Files**:
- `lib/auth.ts` - Auth configuration
- `app/api/auth/[...nextauth]/route.ts` - NextAuth API route
- Environment variables for OAuth credentials

### Option 2: Middleware with Custom Headers
- Use Next.js middleware to verify session
- Set a secure, signed cookie
- Verify the cookie in API routes

### Option 3: Google Identity Services (Direct)
- Use Google's OAuth directly
- More complex but matches legacy auth model
- Manual token verification required

## Security Requirements

### 1. Authentication Must Verify Identity
- `x-user-email` header is NOT authentication
- Must use session/token verification
- NextAuth.js with Google OAuth is the recommended path

### 2. Filenames Must Be Server-Controlled
- Either:
  a) Ignore client-provided `filename` entirely and generate server-side
  b) Strictly sanitize any client input (remove all non-alphanumeric, limit length)
- Recommended: Generate server-side using user ID + timestamp + random suffix

### 3. Object Keys Must Be URL-Safe
- Use `encodeURIComponent()` for filename components
- Or restrict to URL-safe characters only

### 4. Signed URLs Must Be Real
- Current implementation returns a fake URL
- Must use `@google-cloud/storage` library to generate actual signed URLs
- Include expiration, content-type validation, and size limits

## Legacy Pattern Reference

**File**: `pyutils/upload.py:59-111`

The `SignedUrlHandler` class implements:
1. Real authentication via `users.get_current_user()`
2. Filepath validation (no `..`, no leading `/`, regex `^[\w\-/]+$`)
3. Content-type whitelist
4. Server-side filename generation with user prefix
5. Real signed URL generation with expiration and size limits
6. Database tracking of uploads

## Implementation Notes

- This is a Next.js 14 App Router project
- Uses TypeScript
- Currently has no auth library installed
- Would need to add `next-auth` or similar
- Would need to add `@google-cloud/storage` for real signed URLs

## References

- Current file: `app/api/upload/signed-url/route.ts`
- Legacy reference: `pyutils/upload.py`
- NextAuth docs: https://next-auth.js.org/
- GCS signed URLs: https://cloud.google.com/storage/docs/access-control/signed-urls
