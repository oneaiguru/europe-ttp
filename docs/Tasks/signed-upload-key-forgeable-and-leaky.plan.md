# TASK-060: signed-upload-key-forgeable-and-leaky - Implementation Plan

## Summary
Replace the forgeable base64-encoded upload key with an HMAC-signed token to prevent token forgery and information leakage.

## Security Problem (from `app/api/upload/signed-url/route.ts:107-108`)
```typescript
// CURRENT (VULNERABLE):
const uploadKey = Buffer.from(`${user}:${timestamp}:${fullFilename}`).toString('base64');
```

This token:
1. Is reversible via base64 decode (information leakage)
2. Can be forged by encoding arbitrary user/timestamp/filename values
3. Has no cryptographic integrity check

## Chosen Approach: HMAC-Signed Tokens (Stateless)

Following the research recommendation, we'll use HMAC-signed tokens because:
- No new database infrastructure needed
- Uses Node.js built-in `crypto` module
- Matches current token pattern (just adds signature)
- Can migrate to database-backed tokens later if needed

## Token Format

```
token = base64url(payload) + "." + base64url(hmac_sha256(secret, payload))
```

Where `payload = base64(user) + ":" + timestamp + ":" + base64(fullFilename)`

Example:
```
payload = "dGVzdC51c2VyQGV4YW1wbGUuY29t:1737899970:cGhvdG9zL3Rlc3RfdXNlcl8xNzM3ODk5OTcwX2FiY2RlZmc="
token = "abc123.xyz789"
```

## Implementation Steps

### Step 1: Create Crypto Utility Module
**File**: `app/utils/crypto.ts` (new)

```typescript
import { createHmac, randomBytes } from 'crypto';

/**
 * Generate a cryptographically signed token for upload tracking
 * Format: base64url(payload) + "." + base64url(hmac_sha256(secret, payload))
 */
export function generateUploadToken(payload: UploadPayload, secret: string): string {
  // Encode payload components to base64 to prevent delimiter confusion
  const encodedPayload = `${Buffer.from(payload.user).toString('base64')}:${payload.timestamp}:${Buffer.from(payload.filename).toString('base64')}`;
  const signature = createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');
  return `${Buffer.from(encodedPayload).toString('base64url')}.${signature}`;
}

/**
 * Verify an upload token signature
 * Returns the decoded payload if valid, null if invalid
 */
export function verifyUploadToken(token: string, secret: string): UploadPayload | null {
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  // Verify signature
  const expectedSignature = createHmac('sha256', secret)
    .update(Buffer.from(encodedPayload, 'base64url').toString())
    .digest('base64url');

  if (signature !== expectedSignature) return null;

  // Decode payload
  const decoded = Buffer.from(encodedPayload, 'base64url').toString();
  const [userB64, timestamp, filenameB64] = decoded.split(':');
  if (!userB64 || !timestamp || !filenameB64) return null;

  return {
    user: Buffer.from(userB64, 'base64').toString(),
    timestamp: parseInt(timestamp, 10),
    filename: Buffer.from(filenameB64, 'base64').toString(),
  };
}

interface UploadPayload {
  user: string;
  timestamp: number;
  filename: string;
}
```

### Step 2: Update Signed URL Route
**File**: `app/api/upload/signed-url/route.ts:107-108`

Replace line 107-108:
```typescript
// OLD:
const uploadKey = Buffer.from(`${user}:${timestamp}:${fullFilename}`).toString('base64');

// NEW:
import { generateUploadToken } from '@/utils/crypto';

const uploadKey = generateUploadToken(
  { user, timestamp, filename: fullFilename },
  process.env.UPLOAD_HMAC_SECRET || 'development-secret-change-in-production'
);
```

### Step 3: Add Environment Variable Documentation
**File**: `.env.local.example` (or create if not exists)

Add:
```
# HMAC secret for signing upload tokens
# Generate with: openssl rand -base64 32
UPLOAD_HMAC_SECRET=change-this-to-a-random-32-byte-string
```

### Step 4: Create Token Verification Utility (for Future Use)
**File**: `app/api/upload/verify/route.ts` (new, optional but recommended)

This endpoint can be used by future post-upload handlers:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyUploadToken } from '@/utils/crypto';

export async function POST(request: NextRequest) {
  const { key } = await request.json();
  const secret = process.env.UPLOAD_HMAC_SECRET || 'development-secret-change-in-production';

  const payload = verifyUploadToken(key, secret);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
  }

  // Check expiration (15 minutes)
  const now = Math.floor(Date.now() / 1000);
  if (now - payload.timestamp > 15 * 60) {
    return NextResponse.json({ error: 'Token expired' }, { status: 403 });
  }

  return NextResponse.json({ valid: true, payload: { filename: payload.filename } });
}
```

### Step 5: Update Tests
**File**: `test/typescript/steps/uploads_steps.ts`

The tests currently use mock data and don't validate the internal format of the upload key. However, we should add a test to verify the key is NOT plain base64:

Add new step:
```typescript
Then('the upload key should not be decodable as plain base64', async function (this: World) {
  if (!this.uploadKey) {
    throw new Error('No upload key was generated');
  }

  // New format should contain a dot separator (payload.signature)
  if (!this.uploadKey.includes('.')) {
    throw new Error('Upload key should be HMAC-signed (contain dot separator)');
  }

  // Attempting to decode as base64 should not reveal user email
  const parts = this.uploadKey.split('.');
  const decoded = Buffer.from(parts[0], 'base64').toString();

  // Should NOT contain plain user email (should be double-encoded)
  if (decoded.includes(this.userEmail || '')) {
    throw new Error('Upload key should not contain plain user email');
  }
});
```

## Files to Create/Modify

| File | Action | Lines |
|------|--------|-------|
| `app/utils/crypto.ts` | Create | ~50 lines |
| `app/api/upload/signed-url/route.ts` | Modify | 107-108 (2 lines) |
| `.env.local.example` | Modify/Create | Add 3 lines |
| `app/api/upload/verify/route.ts` | Create (optional) | ~30 lines |
| `test/typescript/steps/uploads_steps.ts` | Modify | Add ~15 lines |

## Test Commands

```bash
# Run BDD tests for uploads
bun run bdd:typescript specs/features/uploads/photo_upload.feature
bun run bdd:typescript specs/features/uploads/document_upload.feature

# Verify alignment
bun run bdd:verify

# Type checking
bun run typecheck

# Linting
bun run lint
```

## Risks

| Risk | Mitigation |
|------|------------|
| Secret not set in production | Add fallback + warning log, document in README |
| Token format change breaks existing clients | This is pre-production code; no backward compatibility needed |
| HMAC secret rotation not supported | Document rotation procedure; future enhancement |
| Timing attack on signature comparison | Use Node.js built-in timingSafeEqual if needed (low risk for this use case) |

## Rollback Plan

If issues arise:
1. Revert `app/api/upload/signed-url/route.ts` lines 107-108 to original base64 encoding
2. Remove `app/utils/crypto.ts`
3. Tests will continue to pass (they don't validate internal format)

## Success Criteria

- [ ] Token contains dot separator (payload.signature format)
- [ ] Token is not reversible to extract user email without the secret
- [ ] Token verification rejects forged tokens
- [ ] Token verification accepts valid tokens
- [ ] All BDD tests pass
- [ ] Type checking passes
- [ ] Linting passes
