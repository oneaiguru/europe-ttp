# TASK-E2E-006 Plan: Deadline Enforcement and Whitelist Override

## Scope
Implement the scenario **“Applicant blocked when TTC option is expired”** in both Python and TypeScript. The step logic already exists; primary work is updating the step registry to point to the correct line numbers and then verifying BDD passes.

## Step Registry Update (First in I phase)
Update `test/bdd/step-registry.ts` entries for this scenario to real line numbers:
- `test mode is disabled (real deadline enforcement)`
  - Python: `test/python/steps/e2e_api_steps.py:557`
  - TypeScript: `test/typescript/steps/e2e_api_steps.ts:589`
  - Feature: `specs/features/e2e/deadline_and_whitelist_override.feature:8`
- `TTC option {string} has display_until in the past`
  - Python: `test/python/steps/e2e_api_steps.py:64`
  - TypeScript: `test/typescript/steps/e2e_api_steps.ts:182`
  - Feature: `specs/features/e2e/deadline_and_whitelist_override.feature:9`
- `I am authenticated as applicant with email {string}`
  - Python: `test/python/steps/e2e_api_steps.py:17`
  - TypeScript: `test/typescript/steps/e2e_api_steps.ts:145`
  - Feature: `specs/features/e2e/deadline_and_whitelist_override.feature:10`
- `I navigate to the TTC application form`
  - Python: `test/python/steps/e2e_api_steps.py:523`
  - TypeScript: `test/typescript/steps/e2e_api_steps.ts:565`
  - Feature: `specs/features/e2e/deadline_and_whitelist_override.feature:11`
- `I attempt to submit TTC application via API for {string}`
  - Python: `test/python/steps/e2e_api_steps.py:138`
  - TypeScript: `test/typescript/steps/e2e_api_steps.ts:253`
  - Feature: `specs/features/e2e/deadline_and_whitelist_override.feature:18`
- `the submission should be rejected with deadline error`
  - Python: `test/python/steps/e2e_api_steps.py:400`
  - TypeScript: `test/typescript/steps/e2e_api_steps.ts:465`
  - Feature: `specs/features/e2e/deadline_and_whitelist_override.feature:19`
- `the form should not be marked as submitted`
  - Python: `test/python/steps/e2e_api_steps.py:411`
  - TypeScript: `test/typescript/steps/e2e_api_steps.ts:475`
  - Feature: `specs/features/e2e/deadline_and_whitelist_override.feature:20`

## Python Step Definitions
No new Python code expected. Validate existing implementations:
- `@given('test mode is disabled (real deadline enforcement)')` sets `context.test_mode_enabled = False` (`test/python/steps/e2e_api_steps.py:557`).
- `@given('TTC option "{ttc_value}" has display_until in the past')` asserts expired fixture and stores option (`test/python/steps/e2e_api_steps.py:64`).
- `@given('I am authenticated as applicant with email "{email}"')` sets user context (`test/python/steps/e2e_api_steps.py:17`).
- `@given('I navigate to the TTC application form')` sets `context.current_page` (`test/python/steps/e2e_api_steps.py:523`).
- `@when('I attempt to submit TTC application via API for "{ttc_value}"')` returns 403 when expired and test mode disabled (`test/python/steps/e2e_api_steps.py:138`).
- `@then('the submission should be rejected with deadline error')` asserts rejection (`test/python/steps/e2e_api_steps.py:400`).
- `@then('the form should not be marked as submitted')` asserts not submitted (`test/python/steps/e2e_api_steps.py:411`).

If any behavior differs after registry update, adjust these implementations in-place and re-run Python BDD.

## TypeScript Step Definitions
No new TypeScript code expected. Validate existing implementations:
- `Given('test mode is disabled (real deadline enforcement)')` (`test/typescript/steps/e2e_api_steps.ts:589`).
- `Given('TTC option {string} has display_until in the past')` (`test/typescript/steps/e2e_api_steps.ts:182`).
- `Given('I am authenticated as applicant with email {string}')` (`test/typescript/steps/e2e_api_steps.ts:145`).
- `Given('I navigate to the TTC application form')` (`test/typescript/steps/e2e_api_steps.ts:565`).
- `When('I attempt to submit TTC application via API for {string}')` (`test/typescript/steps/e2e_api_steps.ts:253`).
- `Then('the submission should be rejected with deadline error')` (`test/typescript/steps/e2e_api_steps.ts:465`).
- `Then('the form should not be marked as submitted')` (`test/typescript/steps/e2e_api_steps.ts:475`).

If alignment fails, update the relevant step body to mirror the Python logic (expired + testModeDisabled → reject).

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
- Update `docs/coverage_matrix.md` to mark TypeScript coverage for this scenario.
- Mark TASK-E2E-006 complete in `IMPLEMENTATION_PLAN.md`.
- Log updates in `docs/SESSION_HANDOFF.md`.
- Remove `docs/Tasks/ACTIVE_TASK.md` after successful completion.
