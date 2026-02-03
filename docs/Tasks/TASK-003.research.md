# TASK-003 Research: Password Reset

**Summary**
- Feature: `specs/features/auth/password_reset.feature`
- Scenario: Password reset via identity provider
- Missing steps: "I request a password reset for my Google account" and "I should receive a password reset prompt from the identity provider"

**Legacy Behavior (Python App)**
- No explicit password reset flow exists in legacy code; authentication is delegated to Google App Engine users.
- Login URL is created via `users.create_login_url('/')` in `ttc_portal.py:42-60` and passed into the template render.
- Login/Logout link is rendered in `ttc_portal.html:754-761` using `user_login_url`.
- The sign-in prompt is a simple button linking to `user_login_url` in `tabs/signin.html:15-39`.
- There is no "forgot password" or reset UI in legacy templates; identity provider handles it externally.

**Step Registry Status**
- Registry entries already exist but point to placeholder line numbers.
- `test/bdd/step-registry.ts:176-182` maps "I request a password reset for my Google account" to `test/python/steps/auth_steps.py:1` and `test/typescript/steps/auth_steps.ts:1`.
- `test/bdd/step-registry.ts:290-296` maps "I should receive a password reset prompt from the identity provider" to the same placeholders.

**Python Step Context**
- Existing auth steps live in `test/python/steps/auth_steps.py` and use `_fake_response` plus `context.current_page`/`context.current_user`.
- Login page step is at `test/python/steps/auth_steps.py:55-66`, authenticated step at `test/python/steps/auth_steps.py:69-85`.
- No password reset steps are implemented in this file.

**TypeScript Step Context**
- Existing auth steps live in `test/typescript/steps/auth_steps.ts` and use an in-memory `authContext` with `currentPage` and `responseHtml`.
- Login page step is at `test/typescript/steps/auth_steps.ts:35-38`, authenticated step at `test/typescript/steps/auth_steps.ts:41-48`.
- No password reset steps are implemented in this file.

**Implementation Notes**
- Because legacy code delegates auth to Google via `users.create_login_url`, the "password reset prompt" is effectively handled by the identity provider rather than the app.
- The BDD steps can model this by updating the auth context/response to represent an identity-provider reset prompt (consistent with how login/logout steps currently fake responses).
