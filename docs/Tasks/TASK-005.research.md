# TASK-005 Research

## Legacy behavior (Python)
- `disabled.py` defines the `Disabled` webapp2 handler for `/disabled`. It logs, reads App Engine geo headers, looks up the current user via the users API, optionally pulls the home country via `TTCPortalUser`, and renders `disabled.html` with user/geo/constant context. (`disabled.py:25-69`)
- The disabled app only registers the `/disabled` route, and `app.yaml` maps `/disabled` to `disabled.app` with login required. (`disabled.py:72-76`, `app.yaml:71-74`)

## Disabled template details
- The primary notice text on the page is: “The TTC Portal is not available on Mobile. Please use the portal from a Desktop web browser.” (`disabled.html:153-165`)
- The left menu renders “Logged in as” with `user_email_addr` and toggles LOGIN/LOGOUT links based on whether the email is present. (`disabled.html:101-125`)

## Python step context
- `test/python/steps/portal_steps.py` already provides helpers (`_get_ttc_portal`, `_stub_users_api`, `_fake_response`, `_response_body_text`) and the portal home step uses `context.ttc_client` when available. (`test/python/steps/portal_steps.py:18-135`)
- Behave environment only wires `context.ttc_client` for `ttc_portal.app`; there is no disabled client, so steps that hit `/disabled` will need to instantiate `TestApp(disabled.app)` themselves or extend the environment. (`test/python/features/environment.py:16-45`, `disabled.py:72-76`)

## TypeScript context
- `test/typescript/steps/portal_steps.ts` currently only handles portal home rendering and assertions; there is no disabled-page logic yet. (`test/typescript/steps/portal_steps.ts:1-130`)
- No disabled page/render module exists under `app/`; the only portal renderer is `app/portal/home/render.ts`. A new renderer or page will be needed for the disabled notice. (`app/portal/home/render.ts`)

## Step registry status
- `the TTC portal is in disabled mode` is registered but points to `test/python/steps/portal_steps.py:1` and `test/typescript/steps/portal_steps.ts:1`. (`test/bdd/step-registry.ts:560-564`)
- `I visit the disabled page` is registered but points to `test/python/steps/portal_steps.py:1` and `test/typescript/steps/portal_steps.ts:1`. (`test/bdd/step-registry.ts:512-516`)
- `I should see the disabled notice` is registered but points to `test/python/steps/portal_steps.py:1` and `test/typescript/steps/portal_steps.ts:1`. (`test/bdd/step-registry.ts:440-444`)

## Notes / risks
- The legacy disabled page does not contain the word “disabled”; the most explicit notice is the mobile availability message. Any assertion for the “disabled notice” step should likely target that line unless updated copy is introduced.
