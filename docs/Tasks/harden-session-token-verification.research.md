# TASK-090: Harden Session Token Verification - Research

## Summary
The `verifySessionToken` function in `app/utils/auth.ts` uses timing-unsafe string comparison (`!==` at line 110) for HMAC signature verification. This is vulnerable to timing attacks where an attacker can gradually reveal valid signatures by measuring response times. The `verifyUploadToken` function in `app/utils/crypto.ts` was already hardened in TASK-078 to use `crypto.timingSafeEqual()` for constant-time comparison.

## Current Implementation Analysis

### Vulnerable Code: `app/utils/auth.ts:105-112`

```typescript
// Verify signature
const expectedSignature = createHmac('sha256', secret)
  .update(encodedPayload)
  .digest('base64url');

if (signature !== expectedSignature) {
  return null;
}
```

**Issue:** The `!==` operator performs short-circuit string comparison which leaks timing information proportional to the position of the first differing character.

### Reference Implementation: `app/utils/crypto.ts:75-91`

The hardened pattern from TASK-078:

```typescript
// Verify signature using constant-time comparison to prevent timing attacks
const expectedSignature = createHmac('sha256', secret)
  .update(encodedPayload)
  .digest('base64url');

// Convert base64url strings to Buffers for timing-safe comparison
const sigBuf = Buffer.from(signature, 'base64url');
const expectedBuf = Buffer.from(expectedSignature, 'base64url');

// Length check is acceptable here since HMAC-SHA256 always produces 32 bytes (43 chars base64url)
if (sigBuf.length !== expectedBuf.length) {
  return null;
}

if (!timingSafeEqual(sigBuf, expectedBuf)) {
  return null; // Signature mismatch - token may have been tampered with
}
```

**Key differences:**
1. Imports `timingSafeEqual` from 'crypto'
2. Converts base64url signatures to Buffers first
3. Performs length check (safe because HMAC-SHA256 produces fixed-length output)
4. Uses `timingSafeEqual()` for constant-time buffer comparison

### Test Coverage

The feature file `specs/features/auth/upload_api_auth.feature` includes:
- Scenario: "Session mode accepts valid bearer token" (line 25-29)
- Scenario: "Session mode rejects tampered token" (line 53-57)
- Scenario: "Verify session token with valid signature" (line 64-68)

Test implementation in `test/typescript/steps/auth_steps.ts`:
- `Given` step for tampered token generation (line 192-201)
- `When` step for verifySessionToken call (line 283-288)
- `Then` steps for result validation (line 290-296)

## Dependencies

### Imports Required
`app/utils/auth.ts` already imports from `crypto`:
```typescript
import { createHmac, randomBytes } from 'crypto';
```

Need to add `timingSafeEqual` to the import.

### Function Signature (unchanged)
```typescript
export function verifySessionToken(
  token: string,
  secret: string,
  maxAgeSeconds?: number
): string | null
```

## Implementation Scope

### Files to Modify
1. `app/utils/auth.ts` - Update `verifySessionToken` function (lines 105-112)

### Files Not Requiring Changes
- `specs/features/auth/upload_api_auth.feature` - Tests already cover tampered token rejection
- `test/typescript/steps/auth_steps.ts` - Tests already implement verification scenarios
- `app/utils/crypto.ts` - Reference only

## Risks

1. **Breaking Change:** None - the function signature and return values remain unchanged
2. **Performance Impact:** Negligible - `timingSafeEqual` has similar performance to `!==` for fixed-size buffers
3. **Compatibility:** `timingSafeEqual` is available in Node.js and Bun crypto modules

## References

- Vulnerable code: `app/utils/auth.ts:110`
- Reference implementation: `app/utils/crypto.ts:75-91`
- Feature spec: `specs/features/auth/upload_api_auth.feature`
- Test steps: `test/typescript/steps/auth_steps.ts:192-201, 283-296`
- Related task: TASK-078 (timing-safe-upload-token-verify)
