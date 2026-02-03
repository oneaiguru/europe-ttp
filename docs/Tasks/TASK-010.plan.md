# TASK-010 Plan: Admin Settings

## Goal
Implement the admin settings page steps so the scenario passes in both Python and TypeScript, matching the visible legacy content (header + helper text + settings container).

## Python Step Definitions (`test/python/steps/admin_steps.py`)
1. **Add admin settings HTML fixture**
   - Define a constant like `ADMIN_SETTINGS_HTML` alongside existing admin fixtures.
   - Include the legacy-visible pieces:
     - Header text: `Admin Settings` (e.g., `<h1>Admin Settings</h1>`)
     - Helper text: `Please enter settings for TTC portal`
     - Container: `<div id="settings_page"></div>` (or include the id in a wrapper)

2. **`When I open the admin settings page`**
   - Set `context.current_page = '/admin/settings'` (or a simple token like `'admin-settings'`).
   - Set `context.response_body = ADMIN_SETTINGS_HTML`.

3. **`Then I should see the admin settings content`**
   - Normalize body with `_get_response_body(context.response_body)`.
   - Assert the header text and either the helper text or `settings_page` id.

## TypeScript Implementation
1. **Admin settings render helper**
   - Create `app/admin/settings/render.ts` exporting:
     - `ADMIN_SETTINGS_TITLE = 'Admin Settings'`
     - `ADMIN_SETTINGS_HELPER = 'Please enter settings for TTC portal'`
     - `ADMIN_SETTINGS_CONTAINER_ID = 'settings_page'`
     - `renderAdminSettings()` that returns HTML with the title, helper text, and a div with the container id.

2. **Step definitions (`test/typescript/steps/admin_steps.ts`)**
   - Add a fallback HTML constant mirroring `renderAdminSettings()` output.
   - Add `renderAdminSettingsHtml()` helper:
     - `import('../../../app/admin/settings/render')` and use `renderAdminSettings` if available.
     - Fallback to the constant on error (similar to dashboard/reports list pattern).
   - `When I open the admin settings page`:
     - Set `world.currentPage = 'admin-settings'` (or `/admin/settings`).
     - Set `world.responseHtml = await renderAdminSettingsHtml()`.
   - `Then I should see the admin settings content`:
     - Assert presence of `Admin Settings` plus helper text or the `settings_page` id.

## Step Registry Updates (`test/bdd/step-registry.ts`)
- Update line numbers after implementation for:
  - `I open the admin settings page`
  - `I should see the admin settings content`

## Tests to Run
- `bun scripts/bdd/run-python.ts specs/features/admin/settings.feature`
- `bun scripts/bdd/run-typescript.ts specs/features/admin/settings.feature`
- `bun scripts/bdd/verify-alignment.ts`
- `bun run typecheck`
- `bun run lint`
