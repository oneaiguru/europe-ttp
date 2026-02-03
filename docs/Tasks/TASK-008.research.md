# TASK-008 Research: Admin Permissions - Non-admin blocked

## Summary
Legacy admin access is handled by `admin.py` (webapp2). Any request to `/admin/<page>` runs `Admin.check_permissions`; users not in `constants.LIST_OF_ADMIN_PERMISSIONS` (or lacking the page in `report_permissions`) receive the literal HTML `<b>UN-AUTHORIZED</b>`. This same unauthorized response is returned if the user is not listed in `LIST_OF_ADMINS`.

## Legacy Behavior (Python)
- **Permission check**: `Admin.check_permissions` validates the user email against `constants.LIST_OF_ADMIN_PERMISSIONS` and allowed `report_permissions`.  
  - `admin.py:140-155`
- **Unauthorized response**: If `check_permissions` fails, `Admin.get` writes `<b>UN-AUTHORIZED</b>` and skips template rendering. It also writes the same unauthorized HTML when the email is not in `constants.LIST_OF_ADMINS`.  
  - `admin.py:184-210`
- **Admin-only pages**: Page name is derived from the request path (`obj.split('/')[-1]`), expected under `/admin/<page>`, e.g. `/admin/ttc_applicants_summary.html`.  
  - `admin.py:191-205`

## Permissions Data
- `constants.LIST_OF_ADMIN_PERMISSIONS` defines allowed admin emails and per-page permissions.  
  - `constants.py:84-220`
- `LIST_OF_ADMINS` is derived from the permission keys.  
  - `constants.py:222`
- The fixture non-admin users (e.g., `test.applicant@example.com`) are **not** in `LIST_OF_ADMIN_PERMISSIONS`, so legacy behavior is to return `<b>UN-AUTHORIZED</b>` for any admin page.  
  - `test/fixtures/test-users.json` (applicant roles)

## Step Definitions Status (Python)
- `test/python/steps/admin_steps.py` implements admin-only steps, but **no** steps for non-admin authentication, admin-only page access, or unauthorized message.  
  - `test/python/steps/admin_steps.py:1-71`
- `context.admin_client` is available via `test/python/features/environment.py` for calling admin routes.  
  - `test/python/features/environment.py:13-43`
- Existing stubbing pattern for `users.get_current_user`, `create_login_url`, `create_logout_url` is in `test/python/steps/auth_steps.py`.  
  - `test/python/steps/auth_steps.py:34-52`

## TypeScript Context
- `test/typescript/steps/admin_steps.ts` only covers the admin dashboard scenario; there is **no** permission guard or non-admin handling.  
  - `test/typescript/steps/admin_steps.ts:1-72`
- The only admin UI render helper is `app/admin/ttc_applicants_summary/render.ts` (dashboard HTML).  
  - `app/admin/ttc_applicants_summary/render.ts:1-6`

## Step Registry Status
Entries exist but point to placeholder line numbers:
- `I am authenticated as a non-admin user` → `test/bdd/step-registry.ts:26-30`
- `I open an admin-only page` → `test/bdd/step-registry.ts:74-78`
- `I should see an unauthorized message` → `test/bdd/step-registry.ts:374-378`

## Implementation Notes (for Planning)
- Non-admin flow can target any admin page (e.g., `/admin/ttc_applicants_summary.html`); legacy should return `<b>UN-AUTHORIZED</b>` when `check_permissions` fails or email is not in `LIST_OF_ADMINS`.
- For Python BDD, mimic the auth stubbing used in `test/python/steps/auth_steps.py` to set a non-admin user and call `context.admin_client.get(...)`.
- For TypeScript BDD, a minimal in-step permission check could assert unauthorized output without real app routing (no existing admin access control code).
