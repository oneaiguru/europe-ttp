# TASK-E2E-006B Plan: Whitelisted Applicant Submits Past Deadline

## Scope
Implement the scenario **“Whitelisted applicant can submit past deadline”** in both Python and TypeScript. This requires:
- Tracking the *whitelisted applicant* email separately from the current admin user.
- Allowing submissions for whitelisted applicants when the deadline is expired but within grace period.
- Updating step registry line numbers for all steps used by this scenario.

## Step Registry Update (First in I phase)
Update `test/bdd/step-registry.ts` entries for the scenario with real line numbers (recalculate after code edits):
- `test mode is disabled`
  - Python: `test/python/steps/e2e_api_steps.py:548`
  - TypeScript: `test/typescript/steps/e2e_api_steps.ts:577`
  - Feature: `specs/features/e2e/deadline_and_whitelist_override.feature:24`
- `TTC option {string} has display_until in the past`
  - Python: `test/python/steps/e2e_api_steps.py:64`
  - TypeScript: `test/typescript/steps/e2e_api_steps.ts:182`
  - Feature: `specs/features/e2e/deadline_and_whitelist_override.feature:25`
- `user {string} is NOT whitelisted`
  - Python: `test/python/steps/e2e_api_steps.py:262`
  - TypeScript: `test/typescript/steps/e2e_api_steps.ts:347`
  - Feature: `specs/features/e2e/deadline_and_whitelist_override.feature:26`
- `I am authenticated as admin`
  - Python: `test/python/steps/e2e_api_steps.py:33`
  - TypeScript: `test/typescript/steps/e2e_api_steps.ts:157`
  - Feature: `specs/features/e2e/deadline_and_whitelist_override.feature:27`
- `I add {string} to the whitelist via API`
  - Python: `test/python/steps/e2e_api_steps.py:250`
  - TypeScript: `test/typescript/steps/e2e_api_steps.ts:338`
  - Feature: `specs/features/e2e/deadline_and_whitelist_override.feature:28`
- `the user should be in the whitelist config`
  - Python: `test/python/steps/e2e_api_steps.py:387`
  - TypeScript: `test/typescript/steps/e2e_api_steps.ts:450`
  - Feature: `specs/features/e2e/deadline_and_whitelist_override.feature:29`
- `the applicant should be able to submit within grace period`
  - Python: `test/python/steps/e2e_api_steps.py:395`
  - TypeScript: `test/typescript/steps/e2e_api_steps.ts:456`
  - Feature: `specs/features/e2e/deadline_and_whitelist_override.feature:30`

## Python Step Definitions
Files: `test/python/steps/e2e_api_steps.py`

1. **Track whitelist target email**
   - In `user "{email}" is NOT whitelisted`, `user "{email}" is whitelisted`, and `I add "{email}" to the whitelist via API`, store the email on context (e.g., `context.whitelist_target_email = email.lower()`).

2. **Whitelist-aware submission logic**
   - Update `step_attempt_submit_via_api` to allow submissions for whitelisted users when expired and `test_mode_enabled` is `False`.
   - Use something like:
     - `is_whitelisted = current_email in whitelist`
     - `grace_expired = getattr(context, 'whitelist_grace_expired', False)`
     - If expired + test mode disabled:
       - allow when whitelisted AND not grace_expired
       - otherwise reject as today

3. **Fix whitelist assertion to target applicant**
   - Update `step_assert_user_whitelisted` to check `context.whitelist_target_email` (fallback to `context.current_email` if unset).

4. **Trigger applicant submission in grace period**
   - Update `step_assert_can_submit_grace` to:
     - Temporarily switch `context.current_email` (and role) to the whitelisted applicant.
     - Call `step_attempt_submit_via_api` using the current TTC option (`context.current_ttc_option['value']`) or default to `"test_expired"`.
     - Assert success, then restore prior context.

## TypeScript Step Definitions
Files: `test/typescript/steps/e2e_api_steps.ts`

1. **Add whitelist target to test context**
   - Extend `testContext` type with `whitelistTargetEmail?: string` (and optionally `whitelistGraceExpired?: boolean` for parity).
   - Initialize in the testContext object.

2. **Track whitelist target email**
   - In `user {string} is NOT whitelisted`, `user {string} is whitelisted`, and `I add {string} to the whitelist via API`, set `testContext.whitelistTargetEmail = email.toLowerCase()`.

3. **Whitelist-aware submission logic**
   - Update `When('I attempt to submit TTC application via API for {string}')`:
     - Determine `isWhitelisted` from `testContext.currentEmail` + `testContext.whitelist`.
     - Use a grace flag (default `false`) to allow submission when expired + testModeDisabled and whitelisted.

4. **Fix whitelist assertion to target applicant**
   - Update `Then('the user should be in the whitelist config')` to use `testContext.whitelistTargetEmail ?? testContext.currentEmail`.

5. **Trigger applicant submission in grace period**
   - Update `Then('the applicant should be able to submit within grace period')` to:
     - Temporarily set `testContext.currentEmail` to `whitelistTargetEmail`.
     - Call the same submission logic (either by invoking the existing step handler logic or extracting into a helper).
     - Assert a 200 response, then restore prior context.

## Verification Commands (I phase)
Run in this order, stopping on first failure:
```bash
bun scripts/bdd/run-python.ts specs/features/e2e/deadline_and_whitelist_override.feature
bun scripts/bdd/run-typescript.ts specs/features/e2e/deadline_and_whitelist_override.feature
bun scripts/bdd/verify-alignment.ts
bun run typecheck
bun run lint
```

## Tracking Updates (I phase)
- Update `docs/coverage_matrix.md` for this scenario (TypeScript column).
- Mark TASK-E2E-006B complete in `IMPLEMENTATION_PLAN.md`.
- Log updates in `docs/SESSION_HANDOFF.md`.
- Remove `docs/Tasks/ACTIVE_TASK.md` after successful completion.
