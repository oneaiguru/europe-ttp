# TASK-071: fix-ts-bdd-upload-form-auth

## Goal
Fix the TypeScript BDD test for upload form API to include the required `x-user-email` authentication header.

## Feature File
`specs/features/api/upload_form.feature`

## References
- `test/typescript/steps/api_steps.ts:83-103` - The step `I submit form data to the upload form API` missing auth header
- `app/users/upload-form-data/route.ts:26-39` - `requireAuth` function that checks for `x-user-email` header
- `test/typescript/steps/auth_steps.ts:47-55` - Sets `authContext.currentUser` but api_steps doesn't use it
- `specs/features/api/upload_form.feature:7-10` - Feature scenario expecting authenticated submission

## Current Issue
The BDD test `I submit form data to the upload form API` calls the POST endpoint without including the `x-user-email` header that was added as part of TASK-059 (upload-form-data-missing-auth-and-validation). This causes the API to return 401 instead of 200, making the test fail.

The test scenario starts with `Given I am authenticated on the TTC portal` which sets `authContext.currentUser`, but the api_steps.ts doesn't read from this context.

## Acceptance Criteria
- [ ] The TypeScript BDD step `I submit form data to the upload form API` includes the `x-user-email` header
- [ ] The step reads the user email from `authContext.currentUser.email`
- [ ] The scenario in `specs/features/api/upload_form.feature` passes
- [ ] `bun run bdd:verify` passes (no orphan steps)
- [ ] `bun run bdd:typescript specs/features/api/upload_form.feature` passes

## Files to Create/Modify
- [ ] `test/typescript/steps/api_steps.ts` - Import authContext, add x-user-email header to request

## Test Commands
```bash
bun run bdd:typescript specs/features/api/upload_form.feature
bun run bdd:verify
```
