# TASK-E2E-006 Research

**Scenario**
- Feature: `specs/features/e2e/deadline_and_whitelist_override.feature`
- Scenario: Applicant blocked when TTC option is expired

**Legacy behavior (deadline + whitelist)**
- Whitelist is persisted into admin config via `Admin.set_admin_config` and `whitelisted_user_emails` aggregation in `admin.py:41` and `admin.py:46`.
- Form render loads whitelist and marks users as whitelisted in `form.py:606` and `form.py:618`.
- Expiration logic for TTC select options compares `display_until` to the current timestamp; whitelisted users get a 30-day grace window via `_current_datetime_minus_30d_est` at `form.py:217`, non-whitelisted use `_current_datetime_est` at `form.py:220`, and expired options are disabled in the HTML select at `form.py:229`.
- `/users/upload-form-data` does not enforce deadlines; it simply saves the form data in `ttc_portal_user.py:403` and `ttc_portal_user.py:415`.
- Test mode bypass helper short-circuits deadline checks when enabled at `pyutils/test_mode.py:85` and `pyutils/test_mode.py:101`. BDD setup enables test mode by default in `specs/features/environment.py:59`.

**Python step implementation (current BDD behavior)**
- Applicant auth context is set in `test/python/steps/e2e_api_steps.py:17`.
- Expired TTC option check asserts 2019/2020 `display_until` in fixtures at `test/python/steps/e2e_api_steps.py:64`.
- Navigation step sets current page at `test/python/steps/e2e_api_steps.py:523`.
- Test mode disabled (real enforcement) sets `context.test_mode_enabled = False` at `test/python/steps/e2e_api_steps.py:557`.
- API submission attempt uses mock fallback (when no `api_client`) and rejects expired TTCs if test mode is disabled at `test/python/steps/e2e_api_steps.py:138`.
- Rejection assertions live at `test/python/steps/e2e_api_steps.py:400` and `test/python/steps/e2e_api_steps.py:411`.

**Fixtures**
- TTC option lookup helper uses test fixtures in `test/python/support/fixtures.py:70` and `test/python/support/fixtures.py:75`.
- `test_expired` is defined in `storage/forms/ttc_country_and_dates_test.json` with `display_until` set to `2020-01-01 00:00:00`.

**TypeScript context**
- Step implementations already exist in `test/typescript/steps/e2e_api_steps.ts`.
- Applicant auth at `test/typescript/steps/e2e_api_steps.ts:145`.
- Expired option check at `test/typescript/steps/e2e_api_steps.ts:182`.
- Navigation step at `test/typescript/steps/e2e_api_steps.ts:565`.
- Test mode disabled at `test/typescript/steps/e2e_api_steps.ts:589`.
- API submission attempt uses `testContext.testModeEnabled` and an `"expired"` value guard at `test/typescript/steps/e2e_api_steps.ts:253`.
- Rejection assertions at `test/typescript/steps/e2e_api_steps.ts:465` and `test/typescript/steps/e2e_api_steps.ts:475`.
- TypeScript fixtures are in-file arrays in `loadTestTTCOptions` at `test/typescript/steps/e2e_api_steps.ts:102` (includes `test_expired`).

**Step registry status**
- All scenario steps are registered in `test/bdd/step-registry.ts`, but Python/TypeScript paths currently point to `:1` placeholders.
- Relevant entries for this scenario are at `test/bdd/step-registry.ts:597`, `test/bdd/step-registry.ts:615`, `test/bdd/step-registry.ts:651`, `test/bdd/step-registry.ts:657`, `test/bdd/step-registry.ts:749`, `test/bdd/step-registry.ts:773`, and `test/bdd/step-registry.ts:791`.
