# TASK-078: timing-safe-upload-token-verify

## Goal
Replace timing-unsafe string comparison (`===`) in `verifyUploadToken` with a constant-time HMAC comparison to prevent timing attacks on token signature verification.

## Legacy Reference
- File: `app/utils/crypto.ts`
- Lines: 80-81 (signature comparison)

## Context
The current `verifyUploadToken` function in `app/utils/crypto.ts` uses a simple string equality check (`signature !== expectedSignature`) to verify HMAC signatures. This is vulnerable to timing attacks where an attacker can measure response times to determine the correct signature byte-by-byte.

For cryptographic signature verification, constant-time comparison is essential to prevent leaking information about the signature through timing differences.

## Acceptance Criteria
- [ ] Replace `signature !== expectedSignature` with constant-time HMAC comparison
- [ ] Use Node.js `crypto.timingSafeEqual()` for secure comparison
- [ ] Ensure comparison only proceeds when both buffers have the same length
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes
- [ ] Add unit test or BDD test demonstrating timing-safe behavior

## Files to Create/Modify
- [ ] `app/utils/crypto.ts` - Update `verifyUploadToken` function

## Test Commands
```bash
bun run typecheck
bun run lint
bun test test/utils/crypto.test.ts  # Create if needed
```

## References
- Node.js crypto.timingSafeEqual: https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b
- CWE-208: Observable Timing Discrepancy
- TASK-060 previously introduced the HMAC token system
