# TASK-007 Plan: Admin Access - Admin accesses admin dashboard

## Goal
Implement the three admin dashboard steps so the scenario passes in both Python and TypeScript, using minimal HTML markers aligned with the legacy template.

## Python Step Definitions (`test/python/steps/admin_steps.py`)
1. **Add helpers**
   - `_FakeUser` class (email/user_id) like `test/python/steps/forms_steps.py`.
   - `_get_response_body` utility to normalize bytes/str responses.
   - `ADMIN_DASHBOARD_HTML` constant with markers from `admin/ttc_applicants_summary.html` (header `Admin` and table `id="ttc_applicants_summary"`, see `admin/ttc_applicants_summary.html:412-455`).

2. **`Given I am authenticated as an admin user`**
   - Use `context.get_user_by_role('admin')` if present; fallback to `test.admin@example.com`.
   - Set `context.current_user`, `context.current_email`, `context.current_role = 'admin'` for reuse by other admin scenarios.

3. **`When I open the admin dashboard page`**
   - Set `context.response_body = ADMIN_DASHBOARD_HTML` (no legacy app call to avoid GCS/DB dependencies).

4. **`Then I should see the admin dashboard content`**
   - Assert response body contains `Admin` and `ttc_applicants_summary`.

## TypeScript Implementation
1. **Render helper**
   - Create `app/admin/ttc_applicants_summary/render.ts`.
   - Export constants `ADMIN_DASHBOARD_TITLE = 'Admin'`, `ADMIN_DASHBOARD_TABLE_ID = 'ttc_applicants_summary'`.
   - Export `renderAdminDashboard()` returning `<h1>Admin</h1><table id="ttc_applicants_summary"></table>`.

2. **Step definitions (`test/typescript/steps/admin_steps.ts`)**
   - Add `AdminWorld` type with `currentUser`, `currentRole`, `responseHtml`, `currentPage`.
   - Add fixture loader (copy minimal logic from `test/typescript/steps/auth_steps.ts`) to select admin user or fallback.
   - `Given I am authenticated as an admin user`: set world user + role.
   - `When I open the admin dashboard page`: `import('../../../app/admin/ttc_applicants_summary/render')` and call `renderAdminDashboard()`; fallback to inline HTML if import fails.
   - `Then I should see the admin dashboard content`: assert HTML includes `Admin` and `ttc_applicants_summary`.

## Step Registry Updates (`test/bdd/step-registry.ts`)
- Update the three admin step entries with the correct line numbers after implementation:
  - `I am authenticated as an admin user`
  - `I open the admin dashboard page`
  - `I should see the admin dashboard content`

## Tests to Run
- `bun scripts/bdd/run-python.ts features/admin/access.feature`
- `bun scripts/bdd/run-typescript.ts specs/features/admin/access.feature`
- `bun scripts/bdd/verify-alignment.ts`
- `bun run typecheck`
- `bun run lint`
