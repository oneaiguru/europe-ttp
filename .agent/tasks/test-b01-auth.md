# Task: Auth and Session Tests (B01)

## Goal
Verify auth flows: unauthenticated blocking, valid login, expired/tampered tokens, admin-only enforcement, upload auth, session isolation.

## Prerequisites
- Seed data from B00 must be complete
- Read `.agent/test-b00-seed-results.md` for persona tokens

## Tests

### AU-01: Unauthenticated access blocked
For each of these routes, request WITHOUT auth and verify 401:
- /api/admin/ttc_applicants_summary
- /api/admin/settings
- /users/get-form-data
- /users/upload-form-data (POST)

### AU-02: Valid session login
Login as superadmin@ttc.test. Verify token works on admin routes.

### AU-03: Expired/tampered token
Take a valid token, modify 1 character. Verify 401 on admin route.

### AU-04: Non-admin blocked from admin routes
Login as outsider@ttc.test. Try each admin page. Verify 403 "Permission denied".

### AU-05: Upload endpoint auth
Verify /users/upload-form-data and /api/upload/signed-url reject unauthenticated requests.

### AU-06: Session isolation
Login as applicant.alpha, save form. Login as applicant.beta, read form. Verify beta does NOT see alpha's data.

## Output
Write PASS/FAIL per test to `.agent/test-b01-auth-results.md`.

## Constraints
- Do NOT modify source code
- Read-only verification
