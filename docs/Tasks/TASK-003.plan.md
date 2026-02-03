# TASK-003 Plan: Password Reset

## Goal
Implement password reset request steps so the password reset scenario passes in both Python and TypeScript, matching legacy behavior where the identity provider (Google) owns the reset flow and the app only surfaces the prompt.

## Python Step Definitions (`test/python/steps/auth_steps.py`)
1. **`When I request a password reset for my Google account`**
   - Identify the email to reset:
     - Use `context.get_user_by_role('applicant')` when available; fall back to `test.applicant@example.com`.
     - Store `context.current_email` for consistency with other auth steps.
   - Set `context.current_page = 'password_reset'`.
   - Do **not** call `context.ttc_client` because the legacy app has no reset endpoint.
   - Set `context.response = _fake_response('PASSWORD RESET PROMPT')` to model the external identity provider prompt.

2. **`Then I should receive a password reset prompt from the identity provider`**
   - Assert `context.response` is set and status is 200 (same pattern as other `Then` steps).
   - Assert response body includes `PASSWORD RESET PROMPT`.
   - Optionally assert `context.current_page == 'password_reset'`.

## TypeScript Step Definitions (`test/typescript/steps/auth_steps.ts`)
1. **`When I request a password reset for my Google account`**
   - Use `getUserByRole('applicant')` or fallback to `test.applicant@example.com`.
   - Optionally store `authContext.currentUser` or introduce `authContext.passwordResetEmail` (extend type) for clarity.
   - Set `authContext.currentPage = 'password_reset'`.
   - Set `authContext.responseHtml = 'PASSWORD RESET PROMPT'`.

2. **`Then I should receive a password reset prompt from the identity provider`**
   - Assert `authContext.currentPage === 'password_reset'`.
   - Assert `authContext.responseHtml` is set and includes `PASSWORD RESET PROMPT`.

## Step Registry Updates (`test/bdd/step-registry.ts`)
- Update line numbers after implementation for:
  - `I request a password reset for my Google account`
  - `I should receive a password reset prompt from the identity provider`

## Tests to Run
- `bun scripts/bdd/run-python.ts specs/features/auth/password_reset.feature`
- `bun scripts/bdd/run-typescript.ts specs/features/auth/password_reset.feature`
- `bun scripts/bdd/verify-alignment.ts`
- `bun run typecheck`
- `bun run lint`
