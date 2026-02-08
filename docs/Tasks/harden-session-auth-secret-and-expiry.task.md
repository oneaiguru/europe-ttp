# TASK-094: harden-session-auth-secret-and-expiry

## Goal
Remove the insecure default secret fallback from `app/utils/auth.ts` and ensure session authentication uses the same hardened secret handling pattern as `app/utils/crypto.ts`.

## Feature File
`specs/features/auth/upload_api_auth.feature`

## Legacy Reference
N/A (new auth module)

## Step Definitions Required
- Existing steps in `test/python/steps/auth_steps.py`
- Existing steps in `test/typescript/steps/auth_steps.ts`

## Current Issues (from app/utils/auth.ts)

1. **Line 212 - Insecure default secret fallback:**
   ```typescript
   const secret = process.env.UPLOAD_HMAC_SECRET || 'development-secret-change-in-production';
   ```
   - Should use `getHmacSecret()` from `crypto.ts` which throws if not set
   - The fallback weak secret could allow attackers to forge session tokens

2. **No validation on getSessionMaxAge():**
   - Returns 3600 (1 hour) by default without validation
   - No minimum/maximum bounds checking

3. **getSessionMaxAge() may return NaN:**
   ```typescript
   return maxAge ? parseInt(maxAge, 10) : 3600;
   ```
   - If `SESSION_MAX_AGE_SECONDS` is not a valid integer, `parseInt` returns `NaN`

## Acceptance Criteria
- [ ] `getAuthenticatedUser()` in session mode uses `getHmacSecret()` instead of fallback
- [ ] `getSessionMaxAge()` validates the environment variable and throws on invalid values
- [ ] Test coverage for secret validation and max age validation
- [ ] All scenarios in `specs/features/auth/upload_api_auth.feature` pass (Python + TypeScript)
- [ ] `bun run bdd:verify` passes (no orphan steps)
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes

## Files to Create/Modify
- [ ] `app/utils/auth.ts` - Remove insecure fallback, add validation

## Test Commands
```bash
bun run bdd:python specs/features/auth/upload_api_auth.feature
bun run bdd:typescript specs/features/auth/upload_api_auth.feature
bun run bdd:verify
bun run typecheck
bun run lint
```
