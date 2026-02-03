# TASK-024 Research: Upload Form API

## Legacy Behavior (Python)

### Primary Endpoint
- **Route:** `/users/upload-form-data` (POST)
- **Handler:** `UsersService.post`
- **Location:** `ttc_portal_user.py:395-419` (request handling) and route registration `ttc_portal_user.py:465-472`.
- **Input parameters (from request):**
  - `form_type`
  - `form_instance`
  - `form_data` (JSON string, parsed via `json.loads`)
  - `form_instance_page_data` (JSON string, parsed via `json.loads`)
  - `form_instance_display` (string)
  - `user_home_country_iso` (optional, otherwise falls back to `X-AppEngine-Country` header or empty string)
- **Behavior summary:**
  - Looks up the authenticated user via `users.get_current_user()` (email is required).
  - Creates `TTCPortalUser` for the email, sets home country, calls `set_form_data(...)` with parsed JSON, then `save_user_data()`.
  - No explicit response body is written; webapp2 defaults to 200 OK with empty body.

### Data Storage & Side Effects
- **Form processing:** `TTCPortalUser.set_form_data` (`ttc_portal_user.py:36-89`).
  - Stores form data under `form_data[form_type][instance]`, mirrors to `default` when instance ≠ `default`.
  - Computes `is_form_complete`, `is_form_submitted`, `is_agreement_accepted`, `send_confirmation_to_candidate`.
  - Sets `name` from `i_name` or `i_fname + i_lname`.
  - Sets `last_update_datetime`.
  - If `is_form_submitted` is true, triggers `send_submission_emails`.
- **Home country:** `TTCPortalUser.set_home_country` (`ttc_portal_user.py:289-291`) updates `config['i_home_country']`.
- **Persistence:** `TTCPortalUser.save_user_data` (`ttc_portal_user.py:321-336`) writes JSON to GCS using `constants.USER_CONFIG_LOCATION + email + '.json'`.

### Secondary/Legacy Stub
- **Route:** `/api/upload-form` registered in `api.py` (`api.py:330`).
- **Handler:** `UploadForm` (`api.py:43+`) appears incomplete with placeholder logic (`????`) and no clear behavior.

## BDD/Test Context

### Feature & Steps
- **Feature file:** `specs/features/api/upload_form.feature`
- **Step registry entries:**
  - `I submit form data to the upload form API` → `test/python/steps/api_steps.py:1`, `test/typescript/steps/api_steps.ts:1` (`test/bdd/step-registry.ts:494-498`).
  - `the API should accept the form submission` → `test/python/steps/api_steps.py:1`, `test/typescript/steps/api_steps.ts:1` (`test/bdd/step-registry.ts:554-558`).

### Fixtures
- `test/fixtures/test-config.json` defines `api_endpoints.upload_form_data` as `/users/upload-form-data`.
- `test/fixtures/form-submissions.json` contains sample `form_type` and `data` objects but does **not** include `form_instance_page_data` fields.

### Python Test Harness
- Behave environment only creates `context.admin_client`, `context.api_client`, and `context.ttc_client` (`test/python/features/environment.py:16-42`).
- There is **no** pre-built `ttc_portal_user` test client, so calling `/users/upload-form-data` will require creating a client or invoking the handler directly within step definitions.
- Auth steps stub `google.appengine.api.users` in other modules (see `test/python/steps/auth_steps.py`), so a similar stub will be needed for `ttc_portal_user` to provide `users.get_current_user()`.

## TypeScript Context
- No existing Next.js API route or app code referencing `/users/upload-form-data` or `/api/upload-form` was found under `app/`.
- `test/typescript/steps/api_steps.ts` is a skeleton only; other TS steps use in-memory state and fixtures (see `test/typescript/steps/auth_steps.ts` for pattern).

## Open Questions / Notes
- **Endpoint choice:** Fixtures point to `/users/upload-form-data`, while `/api/upload-form` exists but is incomplete. This suggests steps should target `/users/upload-form-data` unless the plan explicitly chooses to implement the API stub instead.
- **Email side effects:** `set_form_data` can trigger SendGrid when `i_form_submitted` is true. Test data should avoid `i_form_submitted = true` unless SendGrid is stubbed.
