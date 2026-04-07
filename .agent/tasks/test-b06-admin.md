# Task: Admin Config and Permissions (B06)

## Goal
Verify admin config CRUD, page-level permissions, TTC list rendering, and timestamp display.

## Prerequisites
- Seed data from B00 complete
- Use admin email from LIST_OF_ADMIN_PERMISSIONS (e.g., akshay.ponda@artofliving.org)

## Tests

### Config round-trip
1. Login as admin
2. POST /api/admin/admin/set-config with {"config_params":{"test_key":"test_value","i_whitelisted_user":[{"i_whitelisted_user_email":"newuser@test.com"}]}}
3. GET /api/admin/admin/get-config
4. Verify test_key present AND i_whitelisted_user present

### Permissions enforcement
1. Login as summaryadmin@ttc.test (NOT in LIST_OF_ADMIN_PERMISSIONS)
2. Try /api/admin/ttc_applicants_summary → expect 403
3. Login as akshay.ponda@artofliving.org (IS in list)
4. Try same page → expect 200

### Permissions page public
GET /api/admin/permissions WITHOUT auth → expect 200 (not 401). This page is the unauthorized UX.

### TTC list renders
Use Playwright to open /api/admin/ttc_applicants_summary with admin auth. Verify TTC dropdown has options (not empty). Screenshot.

### Timestamps display
Verify admin pages show "Last updated" text (from GCS file metadata).

### Settings page functional
Use Playwright to open /api/admin/settings with admin auth. Verify "Your settings have been retrieved" message. Screenshot.

## Output
Write PASS/FAIL per test to `.agent/test-b06-admin-results.md`. Screenshots to `.agent/screenshots/`.
