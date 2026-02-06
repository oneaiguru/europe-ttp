# TASK-059: upload-form-data-missing-auth-and-validation

## Goal
Require authentication and validate input on the upload-form-data POST route to prevent misuse and unsafe echoing of user input.

## Legacy Reference
- File: `app/users/upload-form-data/route.ts`
- Lines: 64-76 (POST handler)
- Review: `docs/review/REVIEW_DRAFTS.md:160-168`

## Current Issues
The `/users/upload-form-data` POST route currently:
1. **No authentication** - Anyone can POST without being logged in
2. **No authorization** - No check that the user owns the data they're submitting
3. **Echoes raw input** - Returns the entire payload in the response (`received: normalized`)
4. **No field validation** - Accepts any keys via `[key: string]: unknown`
5. **No size limits** - No max payload size enforcement
6. **Silent failures** - Returns empty object `{}` on parse errors (hard to debug)

## Acceptance Criteria
1. **Authentication Required**:
   - [ ] Route validates user is authenticated (check session/auth token)
   - [ ] Returns 401 Unauthorized if not authenticated

2. **Input Validation**:
   - [ ] Define allowed fields (whitelist) with proper types
   - [ ] Reject unknown fields with 400 Bad Request
   - [ ] Validate field types (strings within length limits, valid JSON for data fields)

3. **Authorization**:
   - [ ] Verify user owns the form_instance being submitted (if provided)
   - [ ] Prevent cross-user data submission (user can only submit for themselves)

4. **Safe Response**:
   - [ ] Do NOT echo back the entire payload in production
   - [ ] Return minimal response (e.g., `{ ok: true, id: <submission_id> }`)
   - [ ] Or return only sanitized/validated fields

5. **Error Handling**:
   - [ ] Return proper error responses (400, 401, 403) with meaningful messages
   - [ ] Log parse failures appropriately (don't silently return empty objects)

## Step Definitions Required
None - this is a security hardening task for existing code, not new BDD features.

## Files to Modify
- [ ] `app/users/upload-form-data/route.ts` - Add auth, validation, and safer responses

## Test Commands
```bash
# Manual testing (or add tests):
# 1. Try POST without auth -> should return 401
# 2. Try POST with invalid fields -> should return 400
# 3. Try POST for another user's form_instance -> should return 403
# 4. Valid POST should succeed without echoing raw input
bun run typecheck
bun run lint
```

## Implementation Notes
1. Consider using Next.js middleware or a helper for auth checks
2. Look at `app/api/upload/signed-url/route.ts` for auth pattern (x-user-email header warning)
3. Define a strict interface for allowed fields instead of `[key: string]: unknown`
4. Consider adding a max payload size limit (e.g., 1-5 MB for form data)
5. The "echoing" issue in line 71 (`received: normalized`) is a security concern for production

## Rollback Plan
If implementation breaks existing functionality:
1. Keep the current response shape but add auth/validations
2. Add feature flag to disable strict field validation if needed
3. Revert to previous implementation if critical paths break
