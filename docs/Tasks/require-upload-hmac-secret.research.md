# TASK-075: require-upload-hmac-secret - Research

## Issue Summary

The `UPLOAD_HMAC_SECRET` environment variable is currently optional in the codebase. If not set, it falls back to a hardcoded development default (`'development-secret-change-in-production'`). This creates a security risk in production where the application could start with a weak, predictable secret.

## Evidence

### 1. Current Fallback Pattern in Multiple Files

**File: `app/api/upload/signed-url/route.ts:107-110`**
```typescript
const uploadKey = generateUploadToken(
  { user, timestamp, filename: fullFilename },
  process.env.UPLOAD_HMAC_SECRET || 'development-secret-change-in-production'
);
```

**File: `app/api/upload/verify/route.ts:55`**
```typescript
const secret = process.env.UPLOAD_HMAC_SECRET || 'development-secret-change-in-production';
```

**File: `app/utils/auth.ts:203`**
```typescript
const secret = process.env.UPLOAD_HMAC_SECRET || 'development-secret-change-in-production';
```

### 2. No Validation on Module Load

None of the files that consume `UPLOAD_HMAC_SECRET` validate its presence on module load. The application starts successfully even without the environment variable set.

- `app/api/upload/signed-url/route.ts` - No module-level validation
- `app/api/upload/verify/route.ts` - No module-level validation
- `app/utils/crypto.ts` - Does not export a `getHmacSecret()` function
- `app/utils/auth.ts` - No validation for `UPLOAD_HMAC_SECRET`

### 3. Existing `.env.example` Entry (Already Documented)

**File: `.env.example:23-26`**
```
# Upload Token HMAC Secret
# Used to sign upload tokens to prevent forgery and information leakage
# Generate with: openssl rand -base64 32
UPLOAD_HMAC_SECRET=change-this-to-a-random-32-byte-string
```

The `.env.example` already documents `UPLOAD_HMAC_SECRET`, but the application does not enforce its presence.

### 4. Test Environment Setup Pattern

**File: `test/typescript/steps/auth_steps.ts:124-135`**
```typescript
Given('the test environment is configured', () => {
  // Set default environment variables for testing
  if (!process.env.UPLOAD_HMAC_SECRET) {
    process.env.UPLOAD_HMAC_SECRET = 'test-secret-for-hmac-signing';
  }
  if (!process.env.AUTH_MODE) {
    process.env.AUTH_MODE = 'platform';
  }
  if (!process.env.SESSION_MAX_AGE_SECONDS) {
    process.env.SESSION_MAX_AGE_SECONDS = '3600';
  }
});
```

Tests set a default value if missing. This is appropriate for test environments but should not happen in production.

## Existing Crypto Utilities

**File: `app/utils/crypto.ts:1-132`**

This file already exports:
- `generateUploadToken(payload, secret)` - Generates signed token
- `verifyUploadToken(token, secret)` - Verifies token signature
- `isUploadTokenExpired(payload, maxAgeSeconds)` - Checks expiration

**Missing:**
- `getHmacSecret()` function that validates and returns the secret

## Existing Auth Utilities

**File: `app/utils/auth.ts:1-220`**

This file already exports:
- `getAuthMode()` - Returns 'platform' or 'session'
- `getSessionMaxAge()` - Returns session max age or defaults to 3600

**Pattern to follow:**
```typescript
export function getSessionMaxAge(): number {
  const maxAge = process.env.SESSION_MAX_AGE_SECONDS;
  return maxAge ? parseInt(maxAge, 10) : 3600;
}
```

Note: This function provides a default value, which is **not** the desired pattern for security-critical values like `UPLOAD_HMAC_SECRET`. For HMAC secrets, we want to fail fast rather than silently use a default.

## Feature File Coverage

**File: `specs/features/auth/upload_api_auth.feature`**

All scenarios in this feature file test authentication behavior (platform mode, session mode, token generation/verification). These tests already set `UPLOAD_HMAC_SECRET` via the `Given the test environment is configured` step.

**No new scenarios needed** - this task is about hardening, not new functionality. Existing scenarios will continue to pass with test-provided secrets.

## Implementation Approach

### Recommended Pattern: Fail-Fast Validation

Create a `getHmacSecret()` function that throws if the environment variable is missing:

```typescript
/**
 * Get the HMAC secret for signing upload tokens.
 * Throws if UPLOAD_HMAC_SECRET is not set.
 *
 * @throws {Error} If UPLOAD_HMAC_SECRET environment variable is not set
 * @returns The HMAC secret
 */
export function getHmacSecret(): string {
  const secret = process.env.UPLOAD_HMAC_SECRET;
  if (!secret) {
    throw new Error(
      'UPLOAD_HMAC_SECRET environment variable is required. ' +
      'Set it in your environment or .env file. ' +
      'Generate with: openssl rand -base64 32'
    );
  }
  // Warn if using the default development value
  if (secret === 'development-secret-change-in-production') {
    console.warn(
      'WARNING: Using default UPLOAD_HMAC_SECRET. ' +
      'This is insecure for production. Generate a secure random value.'
    );
  }
  return secret;
}
```

### Module-Level Validation

For routes that depend on the secret, validate at module load time:

**Option A: Top-level validation (runs on import)**
```typescript
// At top of route.ts, outside the handler
if (!process.env.UPLOAD_HMAC_SECRET) {
  throw new Error('UPLOAD_HMAC_SECRET environment variable is required');
}
```

**Option B: Lazy validation via utility function**
```typescript
// Inside the handler
const secret = getHmacSecret(); // Throws if not set
```

**Recommendation:** Use Option A for routes (fail fast on startup) and Option B for the crypto utility function (reusable across modules).

## Files to Modify

| File | Current State | Required Change |
|------|---------------|-----------------|
| `app/utils/crypto.ts` | No `getHmacSecret()` export | Add function that validates and returns secret |
| `app/api/upload/signed-url/route.ts:107-110` | Uses fallback default | Use `getHmacSecret()` from crypto.ts |
| `app/api/upload/verify/route.ts:55` | Uses fallback default | Use `getHmacSecret()` from crypto.ts |
| `app/utils/auth.ts:203` | Uses fallback default | Use `getHmacSecret()` from crypto.ts |
| `.env.example` | Already documents `UPLOAD_HMAC_SECRET` | No change needed (already present) |

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking change for deployments without env var set | High (fail-fast) | Deploy with env var set; document in release notes |
| Test environment needs env var | Low | Tests already set it via `Given the test environment is configured` |
| Development friction | Low | Local `.env` files or explicit test mode could bypass (but not recommended for security-critical values) |

## Related Tasks

- TASK-074 (`secure-x-user-email-auth`) - Added environment-gated authentication
- TASK-060 (`signed-upload-key-forgeable-and-leaky`) - Introduced HMAC-signed tokens and created `app/utils/crypto.ts`

## References

- `app/utils/crypto.ts` - Crypto utilities (currently no validation function)
- `app/utils/auth.ts` - Auth utilities (uses fallback pattern, line 203)
- `app/api/upload/signed-url/route.ts` - Token generation endpoint (line 107-110)
- `app/api/upload/verify/route.ts` - Token verification endpoint (line 55)
- `.env.example` - Environment variable template (line 23-26)
- `specs/features/auth/upload_api_auth.feature` - BDD tests for auth
- `test/typescript/steps/auth_steps.ts` - Test step that sets env vars (line 124-135)
