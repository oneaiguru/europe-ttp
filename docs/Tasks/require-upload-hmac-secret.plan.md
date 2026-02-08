# TASK-075: require-upload-hmac-secret - Implementation Plan

## Summary

Add fail-fast validation for `UPLOAD_HMAC_SECRET` environment variable to prevent the application from starting with a weak, predictable HMAC signing secret.

## Implementation Steps

### Step 1: Add `getHmacSecret()` to crypto.ts

**File:** `app/utils/crypto.ts`

**Action:** Add a new exported function at the end of the file (after `isUploadTokenExpired`):

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

### Step 2: Update signed-url route to use `getHmacSecret()`

**File:** `app/api/upload/signed-url/route.ts`

**Changes:**
1. Update import to include `getHmacSecret`:
   ```typescript
   import { generateUploadToken, getHmacSecret } from '../../../utils/crypto';
   ```

2. Replace line 107-110:
   ```typescript
   // OLD:
   const uploadKey = generateUploadToken(
     { user, timestamp, filename: fullFilename },
     process.env.UPLOAD_HMAC_SECRET || 'development-secret-change-in-production'
   );

   // NEW:
   const uploadKey = generateUploadToken(
     { user, timestamp, filename: fullFilename },
     getHmacSecret()
   );
   ```

### Step 3: Update verify route to use `getHmacSecret()`

**File:** `app/api/upload/verify/route.ts`

**Changes:**
1. Update import to include `getHmacSecret`:
   ```typescript
   import { verifyUploadToken, isUploadTokenExpired, getHmacSecret } from '../../../utils/crypto';
   ```

2. Replace line 55:
   ```typescript
   // OLD:
   const secret = process.env.UPLOAD_HMAC_SECRET || 'development-secret-change-in-production';
   const payload = verifyUploadToken(key, secret);

   // NEW:
   const payload = verifyUploadToken(key, getHmacSecret());
   ```

### Step 4: Verify `.env.example` (No Action Needed)

**File:** `.env.example`

The file already documents `UPLOAD_HMAC_SECRET` at lines 23-26. No change required.

## Test Execution

After implementing the changes, run the following commands:

```bash
# Verify step registry alignment
bun run bdd:verify

# Run the upload auth feature tests
bun run bdd:typescript specs/features/auth/upload_api_auth.feature

# Type checking
bun run typecheck

# Linting
bun run lint
```

## Expected Behavior

### Success Case
When `UPLOAD_HMAC_SECRET` is set:
- All existing tests pass
- No errors on application startup
- Tokens are signed and verified correctly

### Failure Case (Missing Environment Variable)
When `UPLOAD_HMAC_SECRET` is NOT set:
- Application fails to start with clear error message
- Error message includes instructions to generate a secret

### Warning Case (Development Default)
When `UPLOAD_HMAC_SECRET='development-secret-change-in-production'`:
- Application starts but logs console warning
- Warning indicates the secret should be changed for production

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking deployments without env var set | Medium | High | Deploy with env var set; error message is clear |
| Tests fail due to missing env var | Low | Low | Tests set `UPLOAD_HMAC_SECRET` via `Given the test environment is configured` step |
| Development friction | Low | Low | Local development can use the documented default in `.env` |

## Rollback Plan

If issues arise:
1. Revert changes to the three files
2. Application will return to previous fallback behavior

## Files to Change

| File | Lines | Change Type |
|------|-------|-------------|
| `app/utils/crypto.ts` | Add after line 131 | Add function |
| `app/api/upload/signed-url/route.ts` | Lines 18, 107-110 | Import + Update usage |
| `app/api/upload/verify/route.ts` | Lines 13, 55-56 | Import + Update usage |

## Completion Criteria

- [ ] `getHmacSecret()` added to `app/utils/crypto.ts`
- [ ] `signed-url/route.ts` uses `getHmacSecret()`
- [ ] `verify/route.ts` uses `getHmacSecret()`
- [ ] `bun run bdd:typescript specs/features/auth/upload_api_auth.feature` passes
- [ ] `bun run bdd:verify` passes
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes
