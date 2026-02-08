# TASK-078: timing-safe-upload-token-verify - Research

## Issue Summary

The `verifyUploadToken` function in `app/utils/crypto.ts` uses timing-unsafe string comparison (`!==`) at line 80 to verify HMAC signatures. This is vulnerable to timing attacks where an attacker can measure response times to determine the correct signature byte-by-byte.

## Evidence

### 1. Timing-Unsafe Comparison (Current Implementation)

File: `app/utils/crypto.ts:75-82`

```typescript
// Verify signature
const expectedSignature = createHmac('sha256', secret)
  .update(encodedPayload)
  .digest('base64url');

if (signature !== expectedSignature) {
  return null; // Signature mismatch - token may have been tampered with
}
```

The `signature !== expectedSignature` comparison at line 80 is a standard JavaScript string equality check, which:
- Returns `false` on the first mismatching character (short-circuit evaluation)
- Leaks information about how many prefix bytes match through timing differences
- Allows attackers to iteratively guess signatures via timing side-channel

### 2. Known Security Issue (Acknowledged in TASK-060)

File: `docs/Tasks/signed-upload-key-forgeable-and-leaky.plan.md:210`

The risk table for TASK-060 notes:
> **Timing attack on signature comparison**: Use Node.js built-in timingSafeEqual if needed (low risk for this use case)

While marked as "low risk", this was noted as a future improvement. For cryptographic signature verification, constant-time comparison is a best practice.

### 3. Usage Points

The `verifyUploadToken` function is called from:
- `app/api/upload/verify/route.ts:55` - Token verification endpoint
- `test/typescript/steps/uploads_steps.ts:224,241` - Test steps

### 4. Bun Support for timingSafeEqual

Verified via CLI:
```bash
bun --eval "import { timingSafeEqual } from 'node:crypto'; console.log(typeof timingSafeEqual)"
# Output: function
```

Bun supports Node.js `crypto.timingSafeEqual()` API, which performs constant-time buffer comparison.

## Security Implications

| Vulnerability | Impact |
|---------------|--------|
| String comparison short-circuits on first mismatch | Attacker can measure response time to determine correct prefix |
| HMAC-SHA256 signatures are 32 bytes (43 chars base64url) | Up to ~43 timing measurements needed to forge signature |
| 15-minute token expiration window | Attacker has limited time but automated attacks possible |

## Constant-Time Comparison Requirement

From Node.js documentation for `crypto.timingSafeEqual()`:
- Compares two Buffers in constant time
- Throws if buffers have different lengths (prevents length-based timing leakage)
- Essential for comparing HMAC signatures, authentication tokens, passwords

## Implementation Requirements

### Buffer Conversion Consideration

The signatures are base64url-encoded **strings**:
- `signature` (from token): base64url string
- `expectedSignature` (from HMAC): base64url string

To use `timingSafeEqual`, these must be converted to Buffers:
```typescript
import { timingSafeEqual } from 'node:crypto';

// Convert base64url strings to Buffers
const sigBuf = Buffer.from(signature, 'base64url');
const expectedBuf = Buffer.from(expectedSignature, 'base64url');

// Compare in constant time
if (sigBuf.length !== expectedBuf.length) {
  return null; // Length mismatch (timing-safe due to early return on length)
}

if (!timingSafeEqual(sigBuf, expectedBuf)) {
  return null; // Signature mismatch
}
```

### Length Check Safety

The length check `sigBuf.length !== expectedBuf.length` is **not** constant-time, but this is acceptable because:
1. Base64url encoding produces deterministic length for given byte count
2. HMAC-SHA256 always produces 32 bytes → 43 chars in base64url
3. Attackers already know the expected signature length
4. The secret comparison itself (the byte values) is what must be constant-time

## Files to Modify

| File | Action | Lines |
|------|--------|-------|
| `app/utils/crypto.ts` | Modify | 75-82 (signature comparison logic) |
| `test/utils/crypto.test.ts` | Create | Add unit test for timing-safe behavior |

## Related Code

- Current implementation: `app/utils/crypto.ts:61-82`
- Token generation: `app/utils/crypto.ts:35-52`
- Verification endpoint: `app/api/upload/verify/route.ts:54-59`
- Test usage: `test/typescript/steps/uploads_steps.ts:218-246`
- Task that introduced HMAC: `docs/Tasks/signed-upload-key-forgeable-and-leaky.*`

## References

- Node.js crypto.timingSafeEqual: https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b
- CWE-208: Observable Timing Discrepancy
- Previous HMAC implementation (TASK-060): `docs/Tasks/signed-upload-key-forgeable-and-leaky.plan.md`
