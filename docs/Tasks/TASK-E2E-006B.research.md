# TASK-E2E-006B Research

**Scenario**
- Feature: `specs/features/e2e/deadline_and_whitelist_override.feature`
- Scenario: Whitelisted applicant can submit past deadline

**Legacy behavior (whitelist + grace period)**
- Admin whitelist config is persisted into the admin config file via `Admin.set_admin_config` by aggregating `i_whitelisted_user` emails into `whitelisted_user_emails` (`admin.py:41-54`).
- Form rendering loads `constants.ADMIN_CONFIG_FILE`, reads `whitelisted_user_emails`, and marks the *current user* as whitelisted when their email is present (`form.py:606-620`).
- `Form.get_html_for_question` computes both “now” and “now - 30 days” (`form.py:34-36`). When a TTC option has `display_until`, it expires immediately for non-whitelisted users but uses the 30‑day grace window for whitelisted users (`form.py:214-231`). This ties whitelist checks to the applicant’s email (the current user rendering the form).
- The `/users/upload-form-data` POST handler does not enforce deadlines; it saves form data and returns success (`ttc_portal_user.py:403-419`). Deadline enforcement appears to be tied to form rendering / client-side option availability.

**Python step context**
- Whitelist mutation steps in `test/python/steps/e2e_api_steps.py`: add to whitelist (`250-259`), user NOT whitelisted (`262-266`), user whitelisted (`269-274`).
- Assertion `the user should be in the whitelist config` checks `context.current_email` against `context.whitelist` (`387-392`). In this scenario, `current_email` is set by `I am authenticated as admin` (`27-34`), so the assertion currently targets the admin, not the applicant.
- `the applicant should be able to submit within grace period` only inspects `context.response.status` (`395-400`). The most recent response comes from the whitelist add step unless another submission is triggered.
- `I attempt to submit TTC application via API` only checks `test_mode_enabled` + expired; it does **not** account for whitelist/grace period (`138-174`).

**TypeScript context**
- Whitelist steps in `test/typescript/steps/e2e_api_steps.ts`: add to whitelist (`338-344`), user NOT whitelisted (`347-348`), user whitelisted (`351-355`).
- Assertion `the user should be in the whitelist config` checks `testContext.currentEmail` (`450-452`). After admin auth this is the admin email, mirroring the Python mismatch.
- `the applicant should be able to submit within grace period` only checks `testContext.response.status` (`456-462`).
- Submission attempt logic for `I attempt to submit TTC application via API` ignores whitelist and only checks `testModeEnabled` + expired (`253-269`).
- No whitelist-related application code exists under `app/` (search for “whitelist” returned no matches).

**Step registry**
- Steps are registered in `test/bdd/step-registry.ts`, but line numbers are placeholder `:1` values:
  - `the user should be in the whitelist config` (`639-644`)
  - `the applicant should be able to submit within grace period` (`645-649`)
