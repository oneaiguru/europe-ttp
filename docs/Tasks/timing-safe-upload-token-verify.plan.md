# TASK-078: timing-safe-upload-token-verify - Implementation Plan

## Summary
Replace timing-unsafe string comparison (`!==`) with `crypto.timingSafeEqual()` in `verifyUploadToken` function to prevent timing attack vulnerabilities in HMAC signature verification.

## Implementation Steps

### Step 1: Import timingSafeEqual from Node.js crypto
**File:** `app/utils/crypto.ts`
**Line:** 6 (after existing `createHmac` import)

Add import:
```typescript
import { timingSafeEqual } from 'node:crypto';
```

### Step 2: Replace signature comparison logic
**File:** `app/utils/crypto.ts`
**Lines:** 75-82

Replace:
```typescript
  // Verify signature
  const expectedSignature = createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');

  if (signature !== expectedSignature) {
    return null; // Signature mismatch - token may have been tampered with
  }
```

With:
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

### Step 3: Create unit tests
**File:** `test/utils/crypto.test.ts` (new file)

Add comprehensive tests including:
1. Valid token verification passes
2. Invalid signature is rejected
3. Tampered signature is rejected
4. Empty/malformed signatures are rejected
5. Different length signatures are rejected (length mismatch)

### Step 4: Run verification commands
```bash
bun run typecheck
bun run lint
bun test test/utils/crypto.test.ts
bun run bdd:verify
```

## Files to Change

| File | Action | Change Type |
|------|--------|-------------|
| `app/utils/crypto.ts` | Modify | Add import + replace comparison logic (lines 6, 75-82) |
| `test/utils/crypto.test.ts` | Create | New unit test file |

## Test Strategy

### Unit Tests
Create `test/utils/crypto.test.ts` with:
- `verifyUploadToken` with valid token returns correct payload
- `verifyUploadToken` with invalid signature returns null
- `verifyUploadToken` with tampered payload returns null
- `verifyUploadToken` with empty signature returns null
- `verifyUploadToken` with malformed base64 returns null
- `verifyUploadToken` with wrong length signature returns null

### BDD Tests (Existing)
Existing BDD tests in `test/typescript/steps/uploads_steps.ts:218-246` already cover token verification. No changes needed—these should continue to pass.

## Risks and Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Buffer conversion fails for invalid base64url | Low | Low | `Buffer.from()` with 'base64url' encoding handles invalid input gracefully; wrapped in try/catch if needed |
| Existing tests fail | Low | Low | No API changes, only internal implementation; existing BDD tests should pass unchanged |
| Bun compatibility issue | Very Low | Low | Verified Bun supports `timingSafeEqual` via CLI test in research |
| Performance regression | Very Low | Low | `timingSafeEqual` is native code; performance comparable or better than string compare |

## Rollback Plan
If issues arise:
1. Revert `app/utils/crypto.ts` to previous version (git checkout)
2. Delete `test/utils/crypto.test.ts` if created
3. All existing tests should pass after rollback

## Verification Checklist
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes
- [ ] `bun test test/utils/crypto.test.ts` passes all tests
- [ ] `bun run bdd:verify` passes
- [ ] Existing BDD tests still pass
- [ ] Code review: timing-safe comparison is used
- [ ] Code review: import is correct (`from 'node:crypto'`)

## References
- Research notes: `docs/Tasks/timing-safe-upload-token-verify.research.md`
- Node.js timingSafeEqual docs: https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b
- Original HMAC implementation: TASK-060 (`docs/Tasks/signed-upload-key-forgeable-and-leaky.*`)
