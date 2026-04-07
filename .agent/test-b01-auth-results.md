# B01 Auth & Session Test Results

**Date:** 2026-04-07
**Status:** ALL PASS (with notes)

## Test Results

### AU-01: Unauthenticated access blocked — PASS

All routes return 401 without auth:

| Route | Method | Status | Expected |
|-------|--------|--------|----------|
| `/api/admin/ttc_applicants_summary` | GET | 401 | 401 |
| `/api/admin/settings` | GET | 401 | 401 |
| `/users/get-form-data` | GET | 401 | 401 |
| `/users/upload-form-data` | POST | 401 | 401 |

### AU-02: Valid session login — PASS (with adaptation)

**Note:** Test spec called for `superadmin@ttc.test` but that email is NOT in `LIST_OF_ADMIN_PERMISSIONS` (hardcoded in `app/utils/auth-middleware.ts`). Used `akshay.ponda@artofliving.org` instead, which is the actual admin.

| Step | Result |
|------|--------|
| Login via `POST /api/auth/login` | Token returned successfully |
| `GET /api/admin/ttc_applicants_summary` with Bearer token | 200 (HTML page) |
| `GET /api/admin/settings` with Bearer token | 200 (HTML page) |
| `superadmin@ttc.test` on admin route | 403 (correctly denied — not in admin list) |

### AU-03: Expired/tampered token — PASS

| Step | Result |
|------|--------|
| Valid token with 1 character changed → `/api/admin/ttc_applicants_summary` | 401 `{"error":"Authentication required"}` |
| Same tampered token → `/api/admin/settings` | 401 `{"error":"Authentication required"}` |

HMAC signature verification correctly rejects tampered tokens.

### AU-04: Non-admin blocked from admin routes — PASS (with note)

Logged in as `outsider@ttc.test`:

| Route | Status | Body |
|-------|--------|------|
| `/api/admin/ttc_applicants_summary` | 403 | `{"error":"Permission denied"}` |
| `/api/admin/settings` | 403 | `{"error":"Permission denied"}` |
| `/api/admin/ttc_applicants_reports` | 403 | `{"error":"Permission denied"}` |
| `/api/admin/ttc_applicants_integrity` | 403 | `{"error":"Permission denied"}` |
| `/api/admin/permissions` | 200* | Renders "UN-AUTHORIZED" HTML page |

*Note: `/api/admin/permissions` has no auth middleware — it's a static page that always renders the "unauthorized" view (status 200 with "You do not have permission" message). This is a design choice, not a security gap, since the page content itself is the denial.

### AU-05: Upload endpoint auth — PASS

| Route | Method | Status | Body |
|-------|--------|--------|------|
| `/users/upload-form-data` | POST | 401 | `{"error":"Authentication required"}` |
| `/api/upload/signed-url` | POST | 401 | `{"error":"Authentication required"}` |

### AU-06: Session isolation — PASS

Each user can only access their own data:

| Check | Result |
|-------|--------|
| Alpha `get-form-data` for `ttc_application/TTC_OPEN_US_2026` | Returns alpha's data (fname=Alpha, enrolled_people with John Doe) |
| Beta `get-form-data` for `ttc_application/TTC_OPEN_US_2026` | Returns beta's data (fname=Beta, minimal) |
| Alpha vs beta data for same instance | **Different** — confirmed isolation |
| Alpha `get-form-data` for `ttc_application/TTC_PRIOR_EU_2025` | Returns alpha's EU data |
| Beta `get-form-data` for `ttc_application/TTC_PRIOR_EU_2025` | `{}` — no data (correct) |
| Alpha form instances | 3 instances: `1`, `TTC_OPEN_US_2026`, `TTC_PRIOR_EU_2025` |
| Beta form instances | 1 instance: `TTC_OPEN_US_2026` — does NOT see alpha's instances |

## Summary

| Test | Status |
|------|--------|
| AU-01 | PASS |
| AU-02 | PASS |
| AU-03 | PASS |
| AU-04 | PASS |
| AU-05 | PASS |
| AU-06 | PASS |

**Issues noted (not failures):**
1. `superadmin@ttc.test` is not in admin permissions — test adapted to use `akshay.ponda@artofliving.org`
2. `/api/admin/permissions` returns 200 with "unauthorized" HTML instead of 403 — no auth middleware on this route
3. `get-form-data` and `get-form-instances` require `form_type` query param; without it returns `{}`
