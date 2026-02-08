# TASK-090: Harden Session Token Verification

## Goal
Harden session token verification in `app/utils/auth.ts` to use timing-safe comparison and prevent timing attacks, matching the security hardening already applied to `verifyUploadToken` in `app/utils/crypto.ts`.

## Feature File
`specs/features/auth/upload_api_auth.feature`

## References
- File: `app/utils/auth.ts:87-155`
- File: `app/utils/crypto.ts:75-91`
- File: `specs/features/auth/upload_api_auth.feature`

## Context
The `verifyUploadToken` function in `crypto.ts` (TASK-078) was already hardened to use `timingSafeEqual()` for constant-time HMAC signature comparison. However, `verifySessionToken` in `auth.ts` still uses regular string comparison (`signature !== expectedSignature` at line 110), which is vulnerable to timing attacks.

An attacker can use timing side-channels to gradually reveal a valid HMAC signature by measuring response times, potentially forging session tokens.

## Acceptance Criteria
- [ ] `verifySessionToken` uses `timingSafeEqual` for signature comparison
- [ ] The implementation follows the same pattern as `verifyUploadToken`
- [ ] `bun run bdd:typescript specs/features/auth/upload_api_auth.feature` passes
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes

## Files to Create/Modify
- [ ] `app/utils/auth.ts` - Update `verifySessionToken` function

## Test Commands
```bash
bun run bdd:typescript specs/features/auth/upload_api_auth.feature
bun run typecheck
bun run lint
```
