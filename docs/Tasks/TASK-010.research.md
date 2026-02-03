# TASK-010 Research: Admin Settings

## Summary
The legacy admin settings page is a Jinja template (`admin/admin_settings.html`) rendered by the `Admin` handler in `admin.py`. Access is gated by `check_permissions('admin_settings.html')` plus membership in `LIST_OF_ADMINS`. The template includes a visible header (“Admin Settings”), helper text (“Please enter settings for TTC portal”), and a main container `div` with `id="settings_page"` that holds inputs like the `i_whitelisted_user` repeater.

## Legacy Behavior (Python)
- **Admin handler routing/rendering**: `Admin.get` checks permissions, then loads a Jinja template using `obj` from the route and renders it with user/location/reporting data. Unauthorized users receive `<b>UN-AUTHORIZED</b>`.  
  - `admin.py:184-239`
- **Admin settings config endpoints**: `/admin/get-config` and `/admin/set-config` are only allowed when `check_permissions('admin_settings.html')` is true. These endpoints fetch/store `ADMIN_CONFIG_FILE` and are the backing data for the admin settings page.  
  - `admin.py:176-189`, `admin.py:41-80`
- **Admin settings template**: The HTML template includes the visible “Admin Settings” header, the helper text “Please enter settings for TTC portal”, and the main container `id="settings_page"` where settings inputs render.  
  - `admin/admin_settings.html:404-416`
- **Permissions data**: `constants.LIST_OF_ADMIN_PERMISSIONS` includes `admin_settings.html` within `report_permissions`, enabling access for specific admins.  
  - `constants.py:84-124`

## TypeScript Context
- There is no admin settings render helper yet. Existing admin render helpers cover the dashboard summary and report list only.  
  - `app/admin/ttc_applicants_summary/render.ts:1-6`  
  - `app/admin/reports_list/render.ts:1-16`
- Admin step definitions in TypeScript do not include admin settings steps; they only cover dashboard, reports list, and unauthorized flows.  
  - `test/typescript/steps/admin_steps.ts:1-144`

## Step Registry Status
Entries exist but point to placeholder line numbers:
- `I open the admin settings page` → `test/bdd/step-registry.ts:140-145`
- `I should see the admin settings content` → `test/bdd/step-registry.ts:434-438`

## Implementation Notes (for Planning)
- For BDD tests, a minimal HTML stub can mirror the legacy template by including **“Admin Settings”** and either the helper text or a stable element like `settings_page`.
- TypeScript will likely need a new render helper (e.g., `app/admin/settings/render.ts`) similar to the existing admin dashboard/report list renderers.
