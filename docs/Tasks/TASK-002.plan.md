# TASK-002 Plan: Logout from portal

## Goal
Implement logout flow steps so the logout scenario passes in both Python and TypeScript, matching legacy portal behavior (logout link returns to `/` with the login state).

## Python Step Definitions (`test/python/steps/auth_steps.py`)
1. **`Given I am authenticated on the TTC portal`**
   - Use `context.get_user_by_role('applicant')` when available; fall back to `test.applicant@example.com`.
   - Set `context.current_user`, `context.current_email`, and `context.current_page = 'home'`.
   - If `ttc_portal` + `context.ttc_client` exist:
     - Call `_stub_users_api(ttc_portal_module, StubUser(email))`.
     - `context.response = context.ttc_client.get('/')`.
   - Else set `context.response = _fake_response('Logged in as {email} LOGOUT')`.
   - Assert response body includes `LOGOUT` (and optionally the email) to verify authenticated state.

2. **`When I sign out of the TTC portal`**
   - Clear `context.current_user` and `context.current_email`.
   - Set `context.current_page = 'login'`.
   - If `ttc_portal` + `context.ttc_client` exist:
     - Call `_stub_users_api(ttc_portal_module, None)`.
     - Simulate logout redirect by fetching `/`: `context.response = context.ttc_client.get('/')`.
   - Else set `context.response = _fake_response('LOGIN')`.

3. **`Then I should be redirected to the TTC portal login page`**
   - Assert `context.response` is set and status is 200 (same pattern as `step_redirected_home`).
   - Assert response body includes `LOGIN`.
   - Optionally assert `context.current_page == 'login'` and `LOGOUT` is not present.

## TypeScript Step Definitions (`test/typescript/steps/auth_steps.ts`)
1. **`Given I am authenticated on the TTC portal`**
   - Use `getUserByRole('applicant')` or fallback to `test.applicant@example.com`.
   - Set `authContext.currentUser`, `authContext.currentPage = 'home'`, and `authContext.responseHtml = 'Logged in as {email} LOGOUT'`.

2. **`When I sign out of the TTC portal`**
   - Clear `authContext.currentUser`.
   - Set `authContext.currentPage = 'login'`.
   - Set `authContext.responseHtml = 'LOGIN'`.

3. **`Then I should be redirected to the TTC portal login page`**
   - Assert `authContext.currentPage === 'login'`.
   - Assert `authContext.responseHtml` is set and includes `LOGIN`.
   - Optionally assert `LOGOUT` is not present.

## Step Registry Updates (`test/bdd/step-registry.ts`)
- Update line numbers after implementation for:
  - `I am authenticated on the TTC portal`
  - `I sign out of the TTC portal`
  - `I should be redirected to the TTC portal login page`

## Tests to Run
- `bun scripts/bdd/run-python.ts specs/features/auth/logout.feature`
- `bun scripts/bdd/run-typescript.ts specs/features/auth/logout.feature`
- `bun scripts/bdd/verify-alignment.ts`
- `bun run typecheck`
- `bun run lint`
