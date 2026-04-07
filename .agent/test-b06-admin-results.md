# B06 Admin Config and Permissions Test Results

**Date:** 2026-04-07
**Status:** PASS (6/6)

## Test Results

| # | Test | Status | Details |
|---|------|--------|---------|
| 1 | Config round-trip | PASS | POST set-config returned `{"ok":true}` (200). GET get-config returned config with `test_key:"test_value"` and `i_whitelisted_user` containing `newuser@test.com` |
| 2 | Permissions enforcement | PASS | Non-admin (`summaryadmin@ttc.test`) got 403 with `{"error":"Permission denied"}`. Admin (`akshay.ponda@artofliving.org`) got 200 with full page HTML (16,807 bytes) |
| 3 | Permissions page public | PASS | GET `/api/admin/permissions` without auth returned 200 (522 bytes). Page contains "UN-AUTHORIZED" permissions text |
| 4 | TTC list renders | PASS | TTC dropdown has 5 options: US TTC June 2026, Canada TTC February 2026, India TTC April 2026, India TTC January 2026, Europe TTC August 2025 |
| 5 | Timestamps display | PASS | Integrity page shows "Last updated 2026-04-07 11:29:26". Reports page shows "Last updated 2026-04-07 11:29:25". Summary page has "Last Updated (EST)" column header |
| 6 | Settings page functional | PASS | GET `/api/admin/settings` returned 200 (11,973 bytes). Page contains `postDoneMessage("Your settings have been retrieved")` |

## Evidence

### API Responses

**Config set:** `{"ok":true}` (HTTP 200)
**Config get:** `{"test_key":"test_value","i_whitelisted_user":[{"i_whitelisted_user_email":"newuser@test.com"}]}` (HTTP 200)

**Non-admin access:** `{"error":"Permission denied"}` (HTTP 403)
**Admin access:** Full HTML page (HTTP 200)

**Public permissions page:** HTML with "UN-AUTHORIZED" text (HTTP 200)

### TTC Dropdown Options
1. `TTC_OPEN_US_2026` - US TTC June 2026
2. `TTC_EXPIRED_CA_2026` - Canada TTC February 2026
3. `TTC_GRACE_IN_2026` - India TTC April 2026
4. `TTC_CLOSED_IN_2026` - India TTC January 2026
5. `TTC_PRIOR_EU_2025` - Europe TTC August 2025 (selected)

### Timestamps
- Integrity: "Last updated 2026-04-07 11:29:26" (from `user_integrity_by_user.json` GCS metadata)
- Reports: "Last updated 2026-04-07 11:29:25" (from `user_summary_by_user.json` GCS metadata)
- Summary: "Last Updated (EST)" table column header present

### Settings Page
- HTTP 200, full admin settings page rendered
- Contains `postDoneMessage("Your settings have been retrieved")` for config retrieval UX

## Screenshots

- `.agent/screenshots/b06-ttc-summary.png` - TTC applicants summary page with dropdown
- `.agent/screenshots/b06-settings.png` - Admin settings page
- `.agent/screenshots/b06-integrity.png` - Integrity page with timestamps
- `.agent/screenshots/b06-reports.png` - Reports page with timestamps
