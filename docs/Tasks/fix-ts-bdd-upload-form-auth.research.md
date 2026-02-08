# TASK-071: fix-ts-bdd-upload-form-auth - Research

## Summary
The TypeScript BDD test for the upload form API is missing the required `x-user-email` authentication header that was added in TASK-059. The API endpoint returns 401 without this header.

## Current State Analysis

### API Endpoint Authentication (`app/users/upload-form-data/route.ts`)
- **Line 26-39**: `requireAuth` function checks for `x-user-email` header
- **Line 30**: `const user = request.headers.get('x-user-email');`
- **Line 31-32**: Returns `null` if header is missing (causes 401)
- **Line 110-117**: POST handler calls `requireAuth` first, returns 401 if auth fails

### Test Step Implementation (`test/typescript/steps/api_steps.ts`)
- **Line 83-103**: `When I submit form data to the upload form API`
- **Line 93-100**: Creates Request with only `content-type` header
- **Missing**: `x-user-email` header

### Auth Context (`test/typescript/steps/auth_steps.ts`)
- **Line 17-22**: `authContext` object exported with `currentUser` property
- **Line 47-55**: `Given I am authenticated on the TTC portal` sets `authContext.currentUser`
- **Line 48-52**: Default user email is `test.applicant@example.com`

### Feature File (`specs/features/api/upload_form.feature`)
- **Line 8**: `Given I am authenticated on the TTC portal` - sets up auth context
- **Line 9**: `When I submit form data to the upload form API` - should use auth context

## Root Cause
`test/typescript/steps/api_steps.ts` doesn't import `authContext` from `auth_steps.ts` and doesn't include the `x-user-email` header when constructing the Request.

## Implementation Approach
1. Import `authContext` from `auth_steps.ts` in `api_steps.ts`
2. Add `x-user-email` header to the Request headers object
3. Read email from `authContext.currentUser?.email`

## Constraints
- Legacy code is read-only (not applicable for this task)
- Must run `bun run bdd:verify` after changes
- Must run `bun run bdd:typescript specs/features/api/upload_form.feature` to verify fix

## Files to Change
- `test/typescript/steps/api_steps.ts:83-103` - Add auth header to Request
