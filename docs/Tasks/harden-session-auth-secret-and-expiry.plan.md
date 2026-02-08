# TASK-094: harden-session-auth-secret-and-expiry - Implementation Plan

## Summary
Remove insecure default secret fallback from `app/utils/auth.ts` and add validation for `SESSION_MAX_AGE_SECONDS` environment variable.

## Implementation Steps

### Step 1: Add import for `getHmacSecret` from crypto.ts
**File:** `app/utils/auth.ts:9`
- Add `getHmacSecret` to the existing import from `crypto`
- Change: `import { createHmac, randomBytes, timingSafeEqual } from 'crypto';`
- To: `import { createHmac, randomBytes, timingSafeEqual } from 'crypto';`
- Then add: `import { getHmacSecret } from './crypto';`

### Step 2: Refactor `getSessionMaxAge()` with validation
**File:** `app/utils/auth.ts:44-47`

Current implementation:
```typescript
export function getSessionMaxAge(): number {
  const maxAge = process.env.SESSION_MAX_AGE_SECONDS;
  return maxAge ? parseInt(maxAge, 10) : 3600;
}
```

New implementation:
```typescript
/**
 * Get the session token max age from environment.
 * Defaults to 3600 seconds (1 hour).
 * Validates the value and throws if invalid.
 *
 * @throws {Error} If SESSION_MAX_AGE_SECONDS is set but not a valid positive integer
 * @returns The session token max age in seconds
 */
export function getSessionMaxAge(): number {
  const maxAge = process.env.SESSION_MAX_AGE_SECONDS;
  if (!maxAge) {
    return 3600;
  }

  const parsed = parseInt(maxAge, 10);
  if (isNaN(parsed)) {
    throw new Error(
      'SESSION_MAX_AGE_SECONDS must be a valid integer. Got: ' + maxAge
    );
  }

  if (parsed < 1) {
    throw new Error(
      'SESSION_MAX_AGE_SECONDS must be a positive integer. Got: ' + parsed
    );
  }

  // Reasonable upper bound: 30 days
  const MAX_MAX_AGE = 30 * 24 * 60 * 60; // 2,592,000 seconds
  if (parsed > MAX_MAX_AGE) {
    throw new Error(
      'SESSION_MAX_AGE_SECONDS must be at most 30 days (2,592,000 seconds). Got: ' + parsed
    );
  }

  return parsed;
}
```

### Step 3: Replace insecure fallback in `getAuthenticatedUser()`
**File:** `app/utils/auth.ts:212`

Current implementation:
```typescript
const secret = process.env.UPLOAD_HMAC_SECRET || 'development-secret-change-in-production';
```

New implementation:
```typescript
const secret = getHmacSecret();
```

This will use the existing `getHmacSecret()` from `crypto.ts` which:
- Throws if `UPLOAD_HMAC_SECRET` is not set
- Warns if using the obvious default value

### Step 4: Create unit tests for auth utilities
**File:** `test/utils/auth.test.ts` (new file)

Follow the pattern from `test/utils/crypto.test.ts`. Test cases to include:

1. `getSessionMaxAge()` tests:
   - Returns 3600 when SESSION_MAX_AGE_SECONDS is not set
   - Returns parsed value when SESSION_MAX_AGE_SECONDS is valid
   - Throws when SESSION_MAX_AGE_SECONDS is "invalid" (NaN)
   - Throws when SESSION_MAX_AGE_SECONDS is "-1" (negative)
   - Throws when SESSION_MAX_AGE_SECONDS is "0" (zero)
   - Throws when SESSION_MAX_AGE_SECONDS exceeds 30 days

2. `getAuthMode()` tests:
   - Returns 'platform' by default
   - Returns 'session' when AUTH_MODE=session
   - Returns 'platform' for any other value

3. `generateSessionToken()` tests:
   - Generates token with payload.signature format
   - Tokens are deterministic for same input
   - Different tokens for different inputs
   - Handles special characters in email

4. `verifySessionToken()` tests:
   - Verifies valid token
   - Returns null for invalid signature
   - Returns null for expired token
   - Returns null for malformed tokens

5. `extractBearerToken()` tests:
   - Extracts token from "Bearer <token>" header
   - Returns null for missing header
   - Returns null for malformed header

6. `getAuthenticatedUser()` tests:
   - Session mode: returns user for valid token
   - Session mode: returns null for invalid token
   - Platform mode: returns user for valid x-user-email
   - Platform mode: returns null for missing x-user-email

### Step 5: Remove unused crypto import
**File:** `app/utils/auth.ts:10`

After replacing the manual secret handling with `getHmacSecret()`, we may not need all crypto imports directly. However, `verifySessionToken()` still uses `createHmac` and `timingSafeEqual`, so keep the import.

## Files to Change

| File | Change |
|------|--------|
| `app/utils/auth.ts` | Add import for `getHmacSecret` |
| `app/utils/auth.ts` | Add validation to `getSessionMaxAge()` |
| `app/utils/auth.ts` | Replace insecure fallback in `getAuthenticatedUser()` |
| `test/utils/auth.test.ts` | Create new unit test file |

## Test Commands

```bash
# Run unit tests
bun test test/utils/auth.test.ts

# Run BDD tests for auth
bun run bdd:python specs/features/auth/upload_api_auth.feature
bun run bdd:typescript specs/features/auth/upload_api_auth.feature

# Verify step registry alignment
bun run bdd:verify

# Type checking
bun run typecheck

# Linting
bun run lint
```

## Risks / Rollback

### Risks
1. **Breaking change for deployments without UPLOAD_HMAC_SECRET set:**
   - Previously would silently use insecure default
   - Now will throw error on startup
   - **Mitigation:** Error message includes instructions to generate secret

2. **Breaking change for invalid SESSION_MAX_AGE_SECONDS:**
   - Previously would return NaN or use the invalid value
   - Now will throw error
   - **Mitigation:** Clear error message explains valid range

### Rollback
If issues arise:
1. Revert changes to `app/utils/auth.ts`
2. Delete `test/utils/auth.test.ts`
3. The old insecure behavior will be restored

## Acceptance Criteria Completion

- [ ] `getAuthenticatedUser()` in session mode uses `getHmacSecret()` instead of fallback
- [ ] `getSessionMaxAge()` validates the environment variable and throws on invalid values
- [ ] Test coverage for secret validation and max age validation
- [ ] All scenarios in `specs/features/auth/upload_api_auth.feature` pass (Python + TypeScript)
- [ ] `bun run bdd:verify` passes (no orphan steps)
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes
