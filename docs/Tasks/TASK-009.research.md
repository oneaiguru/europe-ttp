# TASK-009 Research: Admin Reports Pages

## Summary
The legacy “reports list” is not a standalone admin page; it is the **Admin section** inside the TTC portal home (`ttc_portal.html`). When an authenticated user is in `LIST_OF_ADMINS`, the template renders an Admin header and conditionally shows report links based on `user_report_permissions` (pulled from `constants.LIST_OF_ADMIN_PERMISSIONS`). The available report pages are rendered as `<a rel="admin" href="...">` links such as **TTC Report**, **TTC Integrity Report**, **Post TTC Report**, **Post Sahaj TTC Report**, and **Admin Settings**.

## Legacy Behavior (Python)
- **Portal handler**: `TTCPortal.get` loads `ttc_portal.html`, determines the current user, and sets `user_report_permissions` from `constants.LIST_OF_ADMIN_PERMISSIONS` based on email, then passes it (and `list_of_admins`) to the template.  
  - `ttc_portal.py:26-78`
- **Admin reports list rendering**: The Admin section is only shown when `user_email_addr in list_of_admins`. Individual report links render when the report filename is in `user_report_permissions`.  
  - `ttc_portal.html:566-637`
- **Rendered report links (conditional)**:  
  - `ttc_applicants_reports.html` → “TTC Report”  
  - `ttc_applicants_integrity.html` → “TTC Integrity Report”  
  - `post_ttc_course_feedback_summary.html` → “Post TTC Report”  
  - `post_sahaj_ttc_course_feedback_summary.html` → “Post Sahaj TTC Report”  
  - `admin_settings.html` → “Admin Settings”  
  - `ttc_applicants_summary.html` is present but commented out (not rendered).  
  - `ttc_portal.html:572-637`

## Permissions Data
- `constants.LIST_OF_ADMIN_PERMISSIONS` defines per-admin `report_permissions` and is the source of `user_report_permissions`.  
  - `constants.py:84-140`
- `LIST_OF_ADMINS` is derived from the keys of `LIST_OF_ADMIN_PERMISSIONS`.  
  - `constants.py:222`

## TypeScript Context
- No TypeScript render exists for an admin reports list page. The only admin render helper is for the admin dashboard summary.  
  - `app/admin/ttc_applicants_summary/render.ts:1-6`
- Admin unauthorized rendering helper exists (used by admin steps).  
  - `app/admin/permissions/render.ts:1-5`
- Step definitions for admin reports list are **missing** in both Python and TypeScript step files.  
  - `test/python/steps/admin_steps.py:1-116`  
  - `test/typescript/steps/admin_steps.ts:1-72`

## Step Registry Status
Entries exist but point to placeholder line numbers:
- `I open the admin reports list page` → `test/bdd/step-registry.ts:134-139`
- `I should see the list of available report pages` → `test/bdd/step-registry.ts:446-451`

## Implementation Notes (for Planning)
- The “admin reports list page” maps most closely to the **Admin section** within the TTC portal home. A minimal render for tests can output the admin header plus the list of report links (at least the five visible links in `ttc_portal.html`).
- For Python BDD, either:
  - call `context.ttc_client.get('/')` with `ttc_portal.users` stubbed to an admin user and assert the expected link labels/targets, **or**
  - use a simplified HTML stub similar to the admin dashboard step (if portal rendering is too heavy).
- For TypeScript BDD, a new render helper (e.g., `app/admin/reports_list/render.ts`) can mirror the legacy link list; step definitions should assert the link labels or hrefs exist in the rendered HTML.
