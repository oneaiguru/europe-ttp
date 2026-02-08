# TASK-094: harden-session-auth-secret-and-expiry - Research

## Issues Found

### 1. Insecure Default Secret Fallback (app/utils/auth.ts:212)

**Current Code:**
```typescript
const secret = process.env.UPLOAD_HMAC_SECRET || 'development-secret-change-in-production';
```

**Problems:**
- Uses a weak, predictable fallback secret that could allow attackers to forge session tokens
- The fallback value `'development-secret-change-in-production'` is publicly visible in the source code
- If `UPLOAD_HMAC_SECRET` is misconfigured in production, the system would silently fall back to the weak secret

**Pattern to Follow:**
The `getHmacSecret()` function in `app/utils/crypto.ts:149-166` already implements the correct pattern:
```typescript
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

This pattern:
- Throws an error if the environment variable is not set (fail-fast)
- Warns if using the obvious default value (but still allows it for testing)
- Already used in `app/api/upload/signed-url/route.ts:109` and `app/api/upload/verify/route.ts:55`

### 2. No Validation on getSessionMaxAge() (app/utils/auth.ts:44-47)

**Current Code:**
```typescript
export function getSessionMaxAge(): number {
  const maxAge = process.env.SESSION_MAX_AGE_SECONDS;
  return maxAge ? parseInt(maxAge, 10) : 3600;
}
```

**Problems:**
- `parseInt()` returns `NaN` if the environment variable is not a valid integer
- No minimum/maximum bounds checking
- No validation that the value is positive

**Potential Issues:**
- If `SESSION_MAX_AGE_SECONDS='invalid'`, returns `NaN` which could cause unexpected behavior in expiration checks
- If `SESSION_MAX_AGE_SECONDS='-1'`, returns negative value (immediate expiration)
- If `SESSION_MAX_AGE_SECONDS='999999999'`, returns excessively long session duration

### 3. Missing Import

The `app/utils/auth.ts` file needs to import `getHmacSecret` from `crypto.ts` to use the hardened pattern.

## Current Test Coverage

### BDD Tests (specs/features/auth/upload_api_auth.feature)
- 12 scenarios covering platform and session authentication modes
- Tests valid tokens, invalid tokens, expired tokens, tampered tokens
- Python steps are stubs (auth_steps.py:177-288)
- TypeScript steps are implemented (auth_steps.ts:138-320)

### Unit Tests
- No dedicated unit test file for auth utilities (no `test/utils/auth.test.ts`)
- Crypto utilities have comprehensive unit tests (test/utils/crypto.test.ts:211-228)

## Files to Modify

| File | Line(s) | Change |
|------|---------|--------|
| `app/utils/auth.ts` | 9 | Add import of `getHmacSecret` from `crypto.ts` |
| `app/utils/auth.ts` | 44-47 | Add validation to `getSessionMaxAge()` |
| `app/utils/auth.ts` | 212 | Replace fallback pattern with `getHmacSecret()` |
| `test/utils/auth.test.ts` | NEW | Create unit tests for auth utilities |

## Environment Variables

| Variable | Current Default | Required After |
|----------|-----------------|----------------|
| `UPLOAD_HMAC_SECRET` | `'development-secret-change-in-production'` (fallback) | Required (throws if missing) |
| `SESSION_MAX_AGE_SECONDS` | `3600` (fallback) | Optional, but validated if set |

## Related Work

- **TASK-075** (require-upload-hmac-secret): Added `getHmacSecret()` to crypto.ts, updated upload routes
- **TASK-090** (harden-session-token-verification): Added timing-safe comparison to session token verification
- **TASK-074** (secure-x-user-email-auth): Added environment-gated authentication modes
