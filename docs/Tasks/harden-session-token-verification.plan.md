# TASK-090: Harden Session Token Verification - Implementation Plan

## Summary
Replace timing-unsafe string comparison in `verifySessionToken` with constant-time `crypto.timingSafeEqual()` to prevent timing attacks on HMAC signature verification. This follows the same hardening pattern already applied to `verifyUploadToken` in `app/utils/crypto.ts` (TASK-078).

## Implementation Steps

### Step 1: Add `timingSafeEqual` to crypto imports
**File:** `app/utils/auth.ts:9`

Change:
```typescript
import { createHmac, randomBytes } from 'crypto';
```

To:
```typescript
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
```

### Step 2: Replace signature verification logic
**File:** `app/utils/auth.ts:105-112`

Change:
```typescript
  // Verify signature
  const expectedSignature = createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');

  if (signature !== expectedSignature) {
    return null;
  }
```

To:
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

## Rationale

1. **Timing Attack Vulnerability:** The `!==` operator performs short-circuit comparison that leaks timing information proportional to the position of the first differing character. An attacker can use this to gradually forge valid HMAC signatures.

2. **Consistency:** The same hardening was applied to `verifyUploadToken` in TASK-078. Using the same pattern improves code consistency and maintainability.

3. **No Breaking Changes:** Function signature and return values remain unchanged. Existing tests continue to pass without modification.

## Files to Change
1. `app/utils/auth.ts` - Add import, update verification logic (lines 9, 105-112)

## Tests to Run
```bash
# Verify BDD tests pass (including tampered token rejection)
bun run bdd:typescript specs/features/auth/upload_api_auth.feature

# Type checking
bun run typecheck

# Linting
bun run lint

# Step registry alignment
bun run bdd:verify
```

## Risks / Rollback

| Risk | Mitigation |
|------|------------|
| None - function signature unchanged | N/A |
| `timingSafeEqual` unavailable | Already available in Bun crypto module (same as Node.js) |
| Performance regression | Negligible - similar performance for fixed-size buffers |

**Rollback:** Revert `app/utils/auth.ts` to previous version if unexpected issues occur.

## Verification
- [ ] Import includes `timingSafeEqual`
- [ ] Signature verification uses buffer conversion + `timingSafeEqual`
- [ ] BDD tests pass (especially "Session mode rejects tampered token")
- [ ] typecheck passes
- [ ] lint passes
- [ ] bdd:verify passes
