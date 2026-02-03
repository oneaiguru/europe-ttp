# TASK-001 Plan: Login with Google account

## Scope
Implement the three auth steps for the login scenario in Python and TypeScript, update step registry line numbers, and unblock the Python 2.7 test runner (remove f-strings in existing test steps).

## Step registry updates
- Update entries in `test/bdd/step-registry.ts` for:
  - `I am on the TTC portal login page`
  - `I sign in with a valid Google account`
  - `I should be redirected to the TTC portal home`
- Fill exact line numbers after implementing step definitions:
  - Python: `test/python/steps/auth_steps.py:LINE`
  - TypeScript: `test/typescript/steps/auth_steps.ts:LINE`

## Python plan
1. Unblock Python 2.7 imports:
   - Replace f-strings in `test/python/steps/e2e_api_steps.py` (around the first TTC option checks) with `.format(...)` so Behave can import step modules.

2. Implement `test/python/steps/auth_steps.py`:
   - Add `from behave import given, when, then` and `import ttc_portal`.
   - Create a small helper to patch the App Engine Users API used in `TTCPortal.get` (`ttc_portal.py:42-59`):
     - Stub `ttc_portal.users.get_current_user` to return `None` or a test user.
     - Stub `ttc_portal.users.create_login_url` and `create_logout_url` to return predictable URLs (e.g., `/login`, `/logout`) to avoid SDK dependencies.
   - Create a lightweight user stub with `.email()` and `.user_id()` methods (use a fixture email as the ID).
   - Step implementations:
     - `Given I am on the TTC portal login page`:
       - Set `context.current_user = None`.
       - Patch users API to return `None`.
       - `context.response = context.ttc_client.get('/')`.
       - Optionally set `context.current_page = 'login'`.
       - Assert response contains `LOGIN` (template renders login when `user_email_addr` empty, `ttc_portal.html:754-761`).
     - `When I sign in with a valid Google account`:
       - Use fixtures (`context.get_user_by_role('applicant')` from `test/python/support/fixtures.py`) to choose the email.
       - Patch users API to return the stub user.
       - `context.response = context.ttc_client.get('/')`.
       - Set `context.current_page = 'home'`.
     - `Then I should be redirected to the TTC portal home`:
       - Assert `context.response.status` is `200`.
       - Assert response body includes the user email and `LOGOUT` (template uses `user_email_addr`, `ttc_portal.html:754-757`).
   - Keep code Python 2.7 compatible (no f-strings).

## TypeScript plan
1. Implement `test/typescript/steps/auth_steps.ts` with an in-memory context (similar to `test/typescript/steps/e2e_api_steps.ts`):
   - Define `authContext` with `currentUser`, `currentPage`, and `responseHtml`.
   - Load fixtures from `test/fixtures/test-users.json` via `fs.readFileSync` (or inline a minimal applicant fixture that matches the JSON).
2. Step implementations:
   - `Given I am on the TTC portal login page`:
     - Set `authContext.currentUser = undefined`, `currentPage = 'login'`, and `responseHtml` containing `LOGIN`.
   - `When I sign in with a valid Google account`:
     - Set `currentUser` to the applicant fixture.
     - Set `currentPage = 'home'`, `responseHtml` containing the email and `LOGOUT`.
   - `Then I should be redirected to the TTC portal home`:
     - Assert `currentPage === 'home'` and `responseHtml` includes email and `LOGOUT`.

## Verification plan
- Python (must pass before TS):
  - `bun scripts/bdd/run-python.ts specs/features/auth/login.feature`
- TypeScript:
  - `bun scripts/bdd/run-typescript.ts specs/features/auth/login.feature`
- Alignment:
  - `bun scripts/bdd/verify-alignment.ts`
- Quality:
  - `bun run typecheck`
  - `bun run lint`

## Tracking updates (after implementation)
- Update `docs/coverage_matrix.md`.
- Update `IMPLEMENTATION_PLAN.md`.
- Append `docs/SESSION_HANDOFF.md`.
- Remove `docs/Tasks/ACTIVE_TASK.md`.
