# TASK-002 Research: Logout from portal

## Summary
Legacy logout is handled through the Google App Engine users API. The TTC portal handler renders `ttc_portal.html` for all paths; when a user is authenticated it exposes a logout URL (`users.create_logout_url('/')`) and renders a “LOGOUT” link. When unauthenticated, it exposes a login URL (`users.create_login_url('/')`) and renders a “LOGIN” link instead. There is no dedicated logout handler in the legacy app — logging out is a link to the App Engine logout URL that redirects back to `/` where the portal renders the login state.

## Legacy Behavior (Python)
- **Portal handler**: Determines current user, sets logout/login URLs, and renders the portal template.
  - `ttc_portal.py:42-74`
  - If `users.get_current_user()` returns a user → `user_logout_url = users.create_logout_url('/')` and `user_login_url = ''`.
  - If no user → `user_login_url = users.create_login_url('/')` and `user_logout_url = ''`.
- **Template login/logout UI**: The portal page shows “LOGOUT” when `user_email_addr` is present, otherwise shows “LOGIN”.
  - `ttc_portal.html:752-761`

## Existing Step Definitions (Python)
- `test/python/steps/auth_steps.py` already stubs the users API and provides login-related steps:
  - Users API stubs: `test/python/steps/auth_steps.py:33-37`
  - Login page step: `test/python/steps/auth_steps.py:55-67`
  - Sign-in step: `test/python/steps/auth_steps.py:69-84`
  - Redirect-to-home assertion: `test/python/steps/auth_steps.py:86-100`

## TypeScript Context
- Auth steps currently use a simple in-memory context and fallback HTML strings (no Next.js page exists yet):
  - `test/typescript/steps/auth_steps.ts:12-59`
- No `app/` login/logout page or render helper exists yet (grep for `login`/`portal` in `app/` returned none).

## Step Registry Status
Entries exist, but are mapped to placeholder line numbers:
- `I am authenticated on the TTC portal` → `test/bdd/step-registry.ts:44-48` (points to `test/python/steps/auth_steps.py:1` and `test/typescript/steps/auth_steps.ts:1`).
- `I sign out of the TTC portal` → `test/bdd/step-registry.ts:488-492` (points to line `1` placeholders).
- `I should be redirected to the TTC portal login page` → `test/bdd/step-registry.ts:284-288` (points to line `1` placeholders).

## Implementation Notes (for Planning)
- Logout in legacy is a **link** (App Engine logout URL) that redirects back to `/` where the portal renders the unauthenticated state with a “LOGIN” link.
- Python steps can reuse `_stub_users_api` and `context.ttc_client.get('/')` to simulate signed-in vs signed-out states, similar to the existing login steps.
- TypeScript steps can mirror the existing login step style by setting `currentPage = 'login'` and `responseHtml = 'LOGIN'` when signed out.
