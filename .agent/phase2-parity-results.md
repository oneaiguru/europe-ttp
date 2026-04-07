# Phase 2: Code Parity Audit Results

**Date:** 2026-04-07
**Scope:** Python legacy (`europe-ttp-master@44c225683f8`) vs TypeScript port (`ttp-split-experiment/app/`)

---

## CRITICAL (blocks-testing)

### 1. Admin HTML pages have NO auth checks — 6 routes
- **Files:** `app/api/admin/ttc_applicants_summary/route.ts`, `app/api/admin/ttc_applicants_integrity/route.ts`, `app/api/admin/ttc_applicants_reports/route.ts`, `app/api/admin/settings/route.ts`, `app/api/admin/post_ttc_course_feedback/route.ts`, `app/api/admin/post_sahaj_ttc_course_feedback/route.ts`
- **What's missing:** Python `Admin.get()` checks `check_permissions(_page, user_email_addr)` and `user_email_addr in LIST_OF_ADMINS` before rendering. All 6 TS routes call render functions and return HTML with zero auth middleware. These pages serve sensitive applicant data, integrity reports, and admin settings.
- **Fix:** Add `requireAdminForPage('<page>.html')` or at minimum `requireAdmin` to each route handler.

### 2. `send_submission_emails` not ported
- **File:** `app/utils/ttc-portal-user.ts`
- **What's missing:** Python `TTCPortalUser.send_submission_emails()` sends user confirmation, owner confirmation, and other emails on form submission. TS `setFormData` has a comment "Email sending is deferred to Phase 6" — the entire function is absent. Form submissions silently succeed without any email notifications.

---

## MEDIUM (functional gaps)

### 3. `setAdminConfig` replaces whitelisted emails instead of appending
- **File:** `app/utils/admin-config.ts`
- **What's missing:** Python reads existing `whitelisted_user_emails` from the current config and appends new entries. TS replaces with a fresh array from `config_params` only. If `i_whitelisted_user` is absent from params, Python keeps old entries; TS wipes them to `[]`.

### 4. `ControlParameters` incremental-update windowing not ported
- **Files:** `app/utils/reporting/user-summary.ts`, `app/utils/reporting/user-integrity.ts`
- **What's missing:** Python reads/writes `ControlParameters` to track `user_summary_last_update_datetime` and `user_integrity_last_update_datetime`, using these to filter which user files to re-process. TS skips this entirely — always does a full reload. Correct but potentially slow at scale.

### 5. `utcNowFormatted` uses UTC; Python uses server local time
- **File:** `app/utils/ttc-portal-user.ts`
- **What's missing:** `setFormData` timestamps `last_update_datetime` using `utcNowFormatted()` (UTC). Python uses `datetime.now().strftime(...)` (server local time). This will produce different timestamps for the same event.

### 6. `check_permissions` (page-level admin ACL) not ported
- **File:** `app/utils/admin-config.ts`
- **What's missing:** Python checks user against `LIST_OF_ADMIN_PERMISSIONS` dict for page-level access. The `requireAdminForPage` middleware exists in `auth-middleware.ts` but the 6 admin HTML routes above don't call it.

### 7. `/users/reporting/get-form-data-for-user` route missing
- **What's missing:** Python registers this route (`ttc_portal_user.py:430-449`) allowing admins/cron to fetch form data for any user email. No direct TS equivalent exists. `app/api/admin/reporting/user-report/get-user-application/route.ts` is a functional equivalent at a different URL.

### 8. `BUCKET_NAME` env var inconsistency within TypeScript
- **Files:** `app/utils/gcs.ts` uses `process.env.GCS_BUCKET_NAME`; `app/api/upload/signed-url/route.ts` uses `process.env.BUCKET_NAME`
- **What's missing:** Two different env var names for the same bucket. If only one is set, one code path fails.

### 9. `USER_PHOTO_FOLDER` missing from TypeScript GCS paths
- **File:** `app/utils/gcs.ts`
- **What's missing:** Python defines `USER_PHOTO_FOLDER = 'user_data/photos/'`. No equivalent in TS `GCS_PATHS`. Blocks photo upload/display if that functionality is in scope.

---

## LOW (cosmetic / minor)

### 10. Unicode normalization weaker in TS `postLoadUserIntegrity`
- **File:** `app/utils/reporting/user-integrity.ts`
- **What's missing:** Python uses `.encode('ascii', 'ignore')` which strips ALL non-ASCII characters. TS uses `.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')` which only strips combining diacritical marks. CJK, emoji, etc. survive in TS but are stripped in Python.

### 11. Several `TTCPortalUser` methods not ported
- **File:** `app/utils/ttc-portal-user.ts`
- **Missing:** `is_agreement_accepted`, `send_confirmation_to_candidate`, `set_photo_file`, `get_photo_file`, `get_public_photo_url`, `set_public_photo_url`, `get_public_url_for_image` (App Engine APIs), `username_to_email`, `set_email`, `get_is_profile_complete`

### 12. `get_form_instances` default return type differs
- **File:** `app/utils/ttc-portal-user.ts`
- **What's different:** Python returns fallback `'{}'` (string). TS returns `{}` (object).

### 13. `getUserIntegrityByUser` return type differs
- **File:** `app/utils/reporting/user-integrity.ts`
- **What's different:** Python returns raw GCS text (string). TS calls `readJson()` returning a parsed object.

### 14. Integrity retention check uses UTC Date vs Python EST string
- **File:** `app/utils/reporting/user-integrity.ts`
- **What's different:** Python compares `last_update_datetime_est` string against EST cutoff. TS compares `last_update_datetime` as UTC Date. Could exclude different records near the 730-day boundary.

### 15. Per-country form config paths not yet ported
- **What's missing:** Python dynamically loads `config/forms/<country_iso>/<form_type>.json`. TS defines `FORM_CONFIG_PREFIX` but doesn't implement country-specific form loading.

### 16. Unused `mock-data.ts` file exists
- **File:** `app/api/admin/mock-data.ts`
- **What:** Contains substantial mock data (`MOCK_SUMMARY_DATA`, `MOCK_REPORTS_DATA`, `MOCK_INTEGRITY_DATA`, `MOCK_SETTINGS_DATA`, etc.). Not imported by any route — dead code that should be removed.

---

## INTENTIONAL DIVERGENCE (no action needed)

### Cron header mechanism stricter in TS
TS `isCronRequest` checks `x-cron-secret` against env var in production, falling back to `x-appengine-cron` only in dev. Security improvement over Python's unconditional trust of `X-Appengine-Cron`.

### Rating <= 2 NaN guard added in TS
Python `user_summary.py:499` checks `_rating <= 2` but `None <= 2` crashes in Py3. TS guards with `!isNaN(rating) && rating <= 2`. Bugfix.

### TS integrity load always processes all files
No incremental filtering via `ControlParameters`. Conservative correctness — slower but no stale-data risk.

### `invertToByFormType` and related helpers are TS-only additions
New functionality for the `_by_form_type` view. May exist elsewhere in Python codebase outside audit scope.

### `app_status` / `eval_status` stored on integrity form data in TS
Python calls `get_reporting_status()` but discards the result (assigned to unused locals). TS stores them on form data — extra data that doesn't break parity.

### POST vs GET asymmetry correctly handled
Python POST handlers require admin-only (no cron). TS routes export method-specific handlers that maintain this distinction via Next.js conventions.

---

## GCS Path Parity

| Python Constant | TS `GCS_PATHS` Key | Match? |
|---|---|---|
| `USER_SUMMARY_BY_USER` | `USER_SUMMARY_BY_USER` | EXACT |
| `USER_SUMMARY_BY_FORM_TYPE` | `USER_SUMMARY_BY_FORM_TYPE` | EXACT |
| `USER_INTEGRITY_BY_USER` | `USER_INTEGRITY_BY_USER` | EXACT |
| `APPLICANT_ENROLLED_LIST` | `APPLICANT_ENROLLED_LIST` | EXACT |
| `ADMIN_CONFIG_FILE` | `ADMIN_CONFIG` | EXACT |
| `FORM_CONFIG_LOCATION` | `FORM_CONFIG_PREFIX` | EXACT |
| `USER_CONFIG_FOLDER` | `USER_CONFIG_PREFIX` | EXACT |
| `TEMP_FILES_LOCATION` | `TEMP_PREFIX` | EXACT |
| `USER_PHOTO_FOLDER` | — | MISSING |

## Edge Case Parity

| Edge Case | Status |
|---|---|
| Name/email swap in instance key parsing | MATCH |
| Name/email swap in Levenshtein comparisons | MATCH |
| Levenshtein thresholds (1 for TTC, 2/1 for post-TTC) | MATCH |
| Cron header bypass asymmetry | MATCH (TS stricter) |
| `text/plain` content-type on data responses | MATCH |
| `mock-data.ts` imports in routes | NONE FOUND (file unused) |
