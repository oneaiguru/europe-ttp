# TASK-001 Research: Login with Google account

## Legacy behavior summary
- Login is delegated to Google App Engine Users API; there is no dedicated login handler in the app code.
- The portal home route `/` is configured with `login: required` in `app.yaml`, so App Engine handles redirects to the Google login flow.
- In `ttc_portal.py` (`TTCPortal.get`), the handler checks `users.get_current_user()` and sets login/logout URLs accordingly:
  - If a user exists, it sets `user_email_addr`, `user_logout_url = users.create_logout_url('/')`, and `user_login_url = ''`.
  - If no user exists, it sets `user_login_url = users.create_login_url('/')` and clears `user_email_addr`.
- The template `ttc_portal.html` renders a LOGIN link when `user_email_addr` is empty and LOGOUT when present.

## Code locations (legacy)
- `ttc_portal.py:30-78` (class `TTCPortal`, method `get`) for user lookup and login/logout URL selection.
- `ttc_portal.html:740-762` renders logged-in user email and the LOGIN/LOGOUT link.
- `app.yaml:15-18` shows `/` is `login: required` (GAE enforced auth redirect).

## Test harness context (Python)
- `test/python/features/environment.py:16-75` sets `context.ttc_client = TestApp(ttc_portal.app)` and resets `context.current_user` per scenario.
- `test/fixtures/test-users.json` contains test users (e.g., `test.applicant@example.com`) that can serve as a "valid Google account" fixture.

## TypeScript context
- `test/typescript/steps/auth_steps.ts` is currently a skeleton with no step definitions.
- `test/typescript/steps/e2e_api_steps.ts` shows the existing pattern: an in-memory `testContext` object with `currentUser/currentEmail/currentRole` used for stateful steps (no Next.js app wiring yet).

## Step registry status
- `test/bdd/step-registry.ts` already contains the relevant step mappings:
  - `I am on the TTC portal login page` (`test/bdd/step-registry.ts:50-54`)
  - `I sign in with a valid Google account` (`test/bdd/step-registry.ts:482-486`)
  - `I should be redirected to the TTC portal home` (`test/bdd/step-registry.ts:278-282`)

## Implementation notes
- Because login is external (GAE Users API), Python steps will need to simulate authenticated vs unauthenticated states (likely by stubbing `google.appengine.api.users.get_current_user()` or setting equivalent test env) before calling `context.ttc_client.get('/')` and asserting the rendered response contains LOGIN/LOGOUT or the user email.
- In TypeScript, there is no live app or router yet; most likely these steps should mirror the in-memory `testContext` approach to track "current page" and "signed-in user".
- Blocker noted in task: Python BDD currently fails to start due to Python 2.7 f-strings in `test/python/steps/e2e_api_steps.py:60` (SyntaxError). This must be fixed before Behave can run.
