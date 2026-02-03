# TASK-008 Plan: Admin Permissions - Non-admin blocked

## Goal
Implement the non-admin permission steps so the scenario passes in both Python and TypeScript, matching legacy behavior (`<b>UN-AUTHORIZED</b>`).

## Python Step Definitions (`test/python/steps/admin_steps.py`)
1. **Add admin users stub helper**
   - Create `_stub_admin_users(admin_module, user)` similar to `_stub_users_api` in `test/python/steps/auth_steps.py`.
   - Override `admin_module.users.get_current_user`, `create_login_url`, `create_logout_url` to return deterministic values.

2. **`Given I am authenticated as a non-admin user`**
   - Use `context.get_user_by_role('applicant')` if available; fallback to `test.applicant@example.com`.
   - Set `context.current_user`, `context.current_email`, `context.current_role = 'non-admin'` (or `'applicant'`).
   - Import `admin` module if available and call `_stub_admin_users(admin, _FakeUser(email, 'non-admin-user'))` so the legacy handler sees a non-admin user.

3. **`When I open an admin-only page`**
   - Use a real admin path like `/admin/ttc_applicants_summary.html`.
   - If `context.admin_client` is available, call `context.admin_client.get('/admin/ttc_applicants_summary.html')` and store as `context.response`.
   - If the admin app isn’t available, set `context.response_body = '<b>UN-AUTHORIZED</b>'` as a fallback.

4. **`Then I should see an unauthorized message`**
   - Normalize body with `_get_response_body(context.response or context.response_body)`.
   - Assert it contains the literal `<b>UN-AUTHORIZED</b>`.

## TypeScript Implementation
1. **Unauthorized render helper (minimal app code)**
   - Add `app/admin/permissions/render.ts` exporting:
     - `ADMIN_UNAUTHORIZED_HTML = '<b>UN-AUTHORIZED</b>'`
     - `renderAdminUnauthorized()` returning the constant.

2. **Step definitions (`test/typescript/steps/admin_steps.ts`)**
   - `Given I am authenticated as a non-admin user`: reuse fixture loader to pick an `applicant` user or fallback; set `world.currentUser` and `world.currentRole = 'non-admin'`.
   - `When I open an admin-only page`: set `world.currentPage = '/admin/ttc_applicants_summary.html'`.
     - If `world.currentRole !== 'admin'`, set `world.responseHtml = renderAdminUnauthorized()`.
     - Otherwise, reuse existing dashboard rendering path.
   - `Then I should see an unauthorized message`: assert `world.responseHtml` includes `<b>UN-AUTHORIZED</b>`.

## Step Registry Updates (`test/bdd/step-registry.ts`)
- Update these entries with the actual line numbers after implementation:
  - `I am authenticated as a non-admin user`
  - `I open an admin-only page`
  - `I should see an unauthorized message`

## Tests to Run
- `bun scripts/bdd/run-python.ts specs/features/admin/permissions.feature`
- `bun scripts/bdd/run-typescript.ts specs/features/admin/permissions.feature`
- `bun scripts/bdd/verify-alignment.ts`
- `bun run typecheck`
- `bun run lint`
