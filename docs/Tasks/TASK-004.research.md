# TASK-004 Research

## Legacy behavior (Python)
- `TTCPortal.get` renders the portal home template and injects user/profile/report data. It pulls the current user from the App Engine users API, uses `TTCPortalUser` to load the stored home country, and looks up report permissions from `constants.LIST_OF_ADMIN_PERMISSIONS`. The template variables include `user_email_addr`, `user_home_country`, `list_of_admins`, and `user_report_permissions`. (`ttc_portal.py:26-78`)
- `TTCPortalUser.__init__` loads user data from GCS and `get_home_country()` returns the stored home country, which is used to render the profile section. (`ttc_portal_user.py:270-388`)
- Admin report permissions are defined per email in `constants.LIST_OF_ADMIN_PERMISSIONS`, and `LIST_OF_ADMINS` is derived from the keys. (`constants.py:84-222`)

## Portal home template details
- Admin report links are only rendered when the user email is in `list_of_admins`, and each link is gated by `user_report_permissions`. (`ttc_portal.html:566-637`)
- Profile details show the home country (with `#user_home_country` and `#user_home_country_iso`) and the "Logged in as" email, plus the LOGIN/LOGOUT action. (`ttc_portal.html:719-763`)

## Python step context
- The auth steps already stub the users API and can hit `context.ttc_client.get('/')` when the legacy app is importable; otherwise they fall back to a fake response. Helpers like `_stub_users_api`, `_response_body_text`, and `_fake_response` live in `test/python/steps/auth_steps.py:25-85` and can be reused by portal steps.

## TypeScript context
- There is no portal home renderer in `app/` yet; current render helpers exist only for admin and forms (`app/admin/*`, `app/forms/*`). `test/typescript/steps/portal_steps.ts` is still a skeleton.
- If a report list is needed, `app/admin/reports_list/render.ts` already defines the report link list used by admin steps.

## Step registry status
- `I open the TTC portal home` is registered at `test/bdd/step-registry.ts:116-121` pointing to `test/python/steps/portal_steps.py:1` and `test/typescript/steps/portal_steps.ts:1`.
- `I should see my profile details and available reports` is registered at `test/bdd/step-registry.ts:380-384` pointing to the same stub files.

## Notes / risks
- The fixture used by `Given I am authenticated on the TTC portal` is the applicant user (`test.applicant@example.com`). That email is **not** in `constants.LIST_OF_ADMIN_PERMISSIONS`, so the legacy template would not render the admin report links for this scenario unless the step stubs report permissions explicitly.
