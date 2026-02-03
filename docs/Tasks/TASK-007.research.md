# TASK-007 Research: Admin Access - Admin accesses admin dashboard

## Summary
Legacy admin access is handled by `admin.py` (webapp2). Requests to `/admin/<page>` are permission-checked against `constants.LIST_OF_ADMIN_PERMISSIONS`; unauthorized responses render `<b>UN-AUTHORIZED</b>`. The “admin dashboard” maps to the summary report template `admin/ttc_applicants_summary.html` (header “Admin”, table `#ttc_applicants_summary`).

## Legacy Behavior (Python)
- **Handler + auth flow**: `admin.py` `Admin.check_permissions` and `Admin.get` perform permission checks and render templates (unauthorized → `<b>UN-AUTHORIZED</b>`).
  - `admin.py:140-155` (`check_permissions`)
  - `admin.py:184-210` (GET path logic + unauthorized response)
- **Admin dashboard page**: `admin/ttc_applicants_summary.html` renders header “Admin” and table `id="ttc_applicants_summary"`.
  - `admin/ttc_applicants_summary.html:412-455`
  - Expected route: `/admin/ttc_applicants_summary.html` (Admin handler splits `obj` to determine page)
- **Admin reports list page**: `admin/ttc_applicants_reports.html` renders header “Admin: TTC Report” and report dropdown (`#select_report`) with options (e.g., “Show All”, “no_prereq”, “not_ready”).
  - `admin/ttc_applicants_reports.html:768-820`
  - Expected route: `/admin/ttc_applicants_reports.html`
- **Admin settings page**: `admin/admin_settings.html` renders header “Admin Settings”.
  - `admin/admin_settings.html:403-407`
  - Expected route: `/admin/admin_settings.html`

## Data/Dependency Notes
- **TTC list HTML**: `Admin.get_ttc_list_html` loads `ttc_country_and_dates.json` via GCS path `constants.FORM_CONFIG_LOCATION + 'ttc_country_and_dates.json'` (may fail locally if GCS not stubbed).
  - `admin.py:82-138`
  - Local fixture exists: `storage/forms/ttc_country_and_dates_test.json`
- **Reporting timestamps**: `Admin.get_user_reporting_last_updated_datetime` calls `ControlParameters.fetch()` and `gcs.stat()` on summary/integrity files.
  - `admin.py:158-173`
  - May need stubbing in tests to avoid GCS/DB access.

## Permissions + Test Users
- **Permissions list**: `constants.LIST_OF_ADMIN_PERMISSIONS` defines allowed emails + report permissions.
  - `constants.py:84-220`
- **Admin list**: `LIST_OF_ADMINS = LIST_OF_ADMIN_PERMISSIONS.keys()`.
  - `constants.py:222`
- **Fixture admin**: `test/fixtures/test-users.json` includes `test.admin@example.com` (role `admin`), but this email is **not** present in `LIST_OF_ADMIN_PERMISSIONS`. Tests will need to bypass/patch permissions or inject this email into the permissions map at runtime.

## Step Registry Status
Entries already exist but point to unimplemented files/line 1:
- `I am authenticated as an admin user` → `test/bdd/step-registry.ts:32` → `test/python/steps/admin_steps.py:1`, `test/typescript/steps/admin_steps.ts:1`
- `I open the admin dashboard page` → `test/bdd/step-registry.ts:128` → `test/python/steps/admin_steps.py:1`, `test/typescript/steps/admin_steps.ts:1`
- `I should see the admin dashboard content` → `test/bdd/step-registry.ts:428` → `test/python/steps/admin_steps.py:1`, `test/typescript/steps/admin_steps.ts:1`

## TypeScript Context
- `test/typescript/steps/admin_steps.ts` is a skeleton only.
- No admin UI exists under `app/` yet (only `app/forms/**`). Likely needs new render helper or fallback HTML (similar to patterns in `test/typescript/steps/forms_steps.ts`).

## Implementation Notes (for next phase)
- Use `context.admin_client` from `test/python/features/environment.py` to call admin routes (see `test/python/features/environment.py:20-42`).
- Stub `admin.users.get_current_user`, `create_logout_url`, `create_login_url` (pattern in `test/python/steps/auth_steps.py`) to simulate admin authentication.
- Patch `constants.LIST_OF_ADMIN_PERMISSIONS` (or `Admin.check_permissions`) to allow `test.admin@example.com` during tests.
- If GCS causes failures, stub `Admin.get_ttc_list_html` and/or `Admin.get_user_reporting_last_updated_datetime` to return deterministic values for BDD checks.
