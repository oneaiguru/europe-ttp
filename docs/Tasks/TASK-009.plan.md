# TASK-009 Plan: Admin Reports Pages

## Goal
Implement the admin reports list steps so the scenario passes in both Python and TypeScript, matching the legacy TTC portal Admin section link list.

## Python Step Definitions (`test/python/steps/admin_steps.py`)
1. **Add admin reports list HTML fixture**
   - Define a constant like `ADMIN_REPORTS_LIST_HTML` with a minimal HTML snippet.
   - Include an `Admin` header and anchors for the legacy report links:
     - `ttc_applicants_reports.html` → “TTC Report”
     - `ttc_applicants_integrity.html` → “TTC Integrity Report”
     - `post_ttc_course_feedback_summary.html` → “Post TTC Report”
     - `post_sahaj_ttc_course_feedback_summary.html` → “Post Sahaj TTC Report”
     - `admin_settings.html` → “Admin Settings”
   - Exclude the commented-out `ttc_applicants_summary.html` link (not rendered in legacy).

2. **`When I open the admin reports list page`**
   - Set `context.current_page = '/admin/reports'` (or a simple token like `'admin-reports-list'`).
   - Populate `context.response_body = ADMIN_REPORTS_LIST_HTML` (consistent with existing admin dashboard stub style).

3. **`Then I should see the list of available report pages`**
   - Normalize body using `_get_response_body(context.response_body)`.
   - Assert the presence of each report label and/or href. Prefer checking hrefs + labels for robustness.

## TypeScript Implementation
1. **Admin reports list render helper**
   - Create `app/admin/reports_list/render.ts` exporting:
     - `ADMIN_REPORTS_LIST_LINKS` (array of `{ href, label }`), or individual constants.
     - `renderAdminReportsList()` returning HTML with a header plus anchors for each report link.
   - Use the same labels and hrefs as legacy.

2. **Step definitions (`test/typescript/steps/admin_steps.ts`)**
   - Add a fallback HTML constant (mirroring `renderAdminReportsList()` output).
   - Add `renderAdminReportsListHtml()` helper:
     - `import('../../../app/admin/reports_list/render')` and use `renderAdminReportsList` if available.
     - Fall back to the constant on error.
   - `When I open the admin reports list page`:
     - Set `world.currentPage = 'admin-reports-list'` (or `/admin/reports`).
     - Set `world.responseHtml = await renderAdminReportsListHtml()`.
   - `Then I should see the list of available report pages`:
     - Assert presence of all five labels and their hrefs.
     - Optionally assert the `Admin` header is present.

## Step Registry Updates (`test/bdd/step-registry.ts`)
- Update line numbers after implementation for:
  - `I open the admin reports list page`
  - `I should see the list of available report pages`

## Tests to Run
- `bun scripts/bdd/run-python.ts specs/features/admin/reports_pages.feature`
- `bun scripts/bdd/run-typescript.ts specs/features/admin/reports_pages.feature`
- `bun scripts/bdd/verify-alignment.ts`
- `bun run typecheck`
- `bun run lint`
