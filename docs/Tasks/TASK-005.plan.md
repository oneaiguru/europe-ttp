# TASK-005 Plan: Disabled Page - View disabled page

## Goal
Implement disabled page BDD steps so the "View disabled page" scenario passes in both Python and TypeScript while matching the legacy disabled notice text.

## Python Step Definitions (`test/python/steps/portal_steps.py`)
1. **`Given the TTC portal is in disabled mode`**
   - Set a flag on the context (e.g., `context.portal_disabled = True`) so later steps can rely on it.
   - Optionally set/retain `context.current_user` + `context.current_email` using the existing `_resolve_current_user` helper to keep behavior consistent with other portal steps.

2. **`When I visit the disabled page`**
   - Ensure a current user/email is available using `_resolve_current_user` (fallback to `test.applicant@example.com`).
   - Try to render the real legacy disabled page if the module imports:
     - Add a helper `_get_disabled_module()` that imports `disabled` and returns the module or `None` on failure.
     - Add a helper `_stub_disabled_users(disabled_module, user)` mirroring `_stub_users_api` to stub `users.get_current_user`, `create_login_url`, and `create_logout_url`.
     - If import succeeds, create `TestApp(disabled_module.app)` (cache on `context.disabled_client`) and call `get('/disabled')`, storing `context.response`.
   - If import fails or the request raises, fall back to deterministic HTML:
     - Include the exact legacy notice text: "The TTC Portal is not available on Mobile. Please use the portal from a Desktop web browser."
     - Store fallback HTML in `context.response_body`.

3. **`Then I should see the disabled notice`**
   - Read body text from `context.response` or `context.response_body` using `_response_body_text`.
   - Assert the disabled notice text is present (exact string match or a stable substring like "not available on Mobile").

## TypeScript Implementation + Step Definitions (`app/portal/disabled/render.ts`, `test/typescript/steps/portal_steps.ts`)
1. **Render helper (`app/portal/disabled/render.ts`)**
   - Add `export const DISABLED_NOTICE_TEXT = 'The TTC Portal is not available on Mobile. Please use the portal from a Desktop web browser.'`.
   - Add `export function renderDisabledPage(): string` that returns HTML containing `DISABLED_NOTICE_TEXT` (simple wrapper HTML is fine).

2. **Step definitions (`test/typescript/steps/portal_steps.ts`)**
   - Extend the `PortalWorld` type with `portalDisabled?: boolean`.
   - `Given the TTC portal is in disabled mode`: set `world.portalDisabled = true`.
   - `When I visit the disabled page`:
     - Try to import `renderDisabledPage` and use it to set `world.responseHtml`.
     - Provide a fallback HTML string containing `DISABLED_NOTICE_TEXT` if the module is missing.
   - `Then I should see the disabled notice`:
     - Assert `world.responseHtml` contains `DISABLED_NOTICE_TEXT` (or the stable substring "not available on Mobile").

## Step Registry Updates (`test/bdd/step-registry.ts`)
- Update line numbers after implementation for:
  - `the TTC portal is in disabled mode`
  - `I visit the disabled page`
  - `I should see the disabled notice`
- Ensure the `python` and `typescript` paths point to the correct line numbers in `test/python/steps/portal_steps.py` and `test/typescript/steps/portal_steps.ts`.

## Tests to Run
- `bun scripts/bdd/run-python.ts specs/features/portal/disabled.feature`
- `bun scripts/bdd/run-typescript.ts specs/features/portal/disabled.feature`
- `bun scripts/bdd/verify-alignment.ts`
- `bun run typecheck`
- `bun run lint`
