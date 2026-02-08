# TASK-075: require-upload-hmac-secret

## Goal
Require and validate `UPLOAD_HMAC_SECRET` environment variable for upload token signing/verification.

## Feature File
`specs/features/auth/upload_api_auth.feature` (already exists from TASK-074)

## Legacy Reference
None - this is new security hardening for the Next.js migration

## Step Definitions Required
None - reuse existing steps from `test/typescript/steps/auth_steps.ts` and `test/typescript/steps/uploads_steps.ts`

## Acceptance Criteria
- [ ] `UPLOAD_HMAC_SECRET` is required in `.env.example`
- [ ] `app/api/upload/signed-url/route.ts` validates secret is set on startup
- [ ] `app/api/upload/verify/route.ts` validates secret is set on startup
- [ ] `app/utils/crypto.ts` exports `getHmacSecret()` that throws if not set
- [ ] All scenarios pass (TypeScript BDD)
- [ ] `bun run bdd:verify` passes
- [ ] `bun run typecheck` passes

## Files to Create/Modify
- [ ] `.env.example` - add `UPLOAD_HMAC_SECRET` documentation
- [ ] `app/utils/crypto.ts` - add `getHmacSecret()` validation
- [ ] `app/api/upload/signed-url/route.ts` - validate on module load
- [ ] `app/api/upload/verify/route.ts` - validate on module load

## Test Commands
```bash
bun run bdd:typescript specs/features/auth/upload_api_auth.feature
bun run bdd:verify
bun run typecheck
```

## Context
From TASK-074 (`secure-x-user-email-auth`), the upload endpoints now support HMAC-signed tokens. However, the `UPLOAD_HMAC_SECRET` is not currently required, which could lead to runtime errors if not configured. This task ensures the application fails fast with a clear error message when the secret is not configured.
