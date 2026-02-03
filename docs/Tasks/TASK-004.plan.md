# TASK-004 Plan: Portal Home - View portal home

## Goal
Implement portal home BDD steps so the "View portal home" scenario passes in both Python and TypeScript while matching legacy portal behavior (profile details rendered, admin reports shown only when permitted).

## Python Step Definitions (`test/python/steps/portal_steps.py`)
1. **`When I open the TTC portal home`**
   - Resolve the current user:
     - Prefer `context.current_user` and `context.current_email` if already set by auth steps.
     - Fall back to `context.get_user_by_role('applicant')` and `test.applicant@example.com` if needed.
   - Resolve home country:
     - Use fixture user field (e.g., `home_country`) when available, default to `US`.
   - If `ttc_portal` and `context.ttc_client` are available:
     - Stub the App Engine users API (reuse the helper from `test/python/steps/auth_steps.py` or copy the minimal logic locally).
     - Call `context.ttc_client.get('/')` and store `context.response`.
     - Store `context.user_report_permissions` based on `constants.LIST_OF_ADMIN_PERMISSIONS.get(email, {})`.
   - Else fallback to a deterministic HTML string that includes:
     - `Logged in as {email}` and `LOGOUT`.
     - `id="user_home_country"` (name) and `id="user_home_country_iso"` (ISO).
     - Optional admin report links when `context.user_report_permissions` is non-empty.
     - Save to `context.response_body`.

2. **`Then I should see my profile details and available reports`**
   - Read the body from `context.response` (decode bytes) or `context.response_body`.
   - Assert profile details:
     - `Logged in as` and the current email.
     - Home country markers (`user_home_country` and/or `user_home_country_iso`).
   - Assert available reports conditionally:
     - If `context.user_report_permissions` (or the email is in `constants.LIST_OF_ADMIN_PERMISSIONS`), ensure each permitted report link appears.
     - If no permissions, allow the admin section to be absent (do not fail when there are no report links).

## TypeScript Implementation + Step Definitions (`app/portal/home/render.ts`, `test/typescript/steps/portal_steps.ts`)
1. **Render helper (`app/portal/home/render.ts`)**
   - Create `renderPortalHome({ userEmail, homeCountryIso, homeCountryName, reportLinks })` returning HTML with:
     - Profile block containing `Logged in as` + email, `LOGOUT` text.
     - `id="user_home_country"` and `id="user_home_country_iso"` markers.
     - Admin report section when `reportLinks.length > 0` (use `rel="admin"` links).
   - Optionally re-use `ADMIN_REPORTS_LIST_LINKS` from `app/admin/reports_list/render` to keep link labels consistent.

2. **`When I open the TTC portal home`**
   - Load the applicant user from `test/fixtures/test-users.json` (same approach as `auth_steps.ts`).
   - Determine `homeCountryIso` from the fixture and map to a display name (at minimum handle `US` -> `United States`, `CA` -> `Canada`; default to ISO when unknown).
   - Decide report links:
     - If the user role is admin (or you explicitly decide to test admin), use `ADMIN_REPORTS_LIST_LINKS`.
     - Otherwise keep an empty list.
   - Try to import `renderPortalHome` and render HTML; fall back to an inline HTML string with the same markers if the module is missing.
   - Store `responseHtml` (and optionally `currentUser`/`reportLinks`) on the Cucumber world.

3. **`Then I should see my profile details and available reports`**
   - Assert `responseHtml` contains `Logged in as`, the user email, `LOGOUT`, and the home country markers.
   - If `reportLinks` were provided, assert each link href/label is present; otherwise accept an empty admin section.

## Step Registry Updates (`test/bdd/step-registry.ts`)
- Update line numbers after implementation for:
  - `I open the TTC portal home`
  - `I should see my profile details and available reports`

## Tests to Run
- `bun scripts/bdd/run-python.ts specs/features/portal/home.feature`
- `bun scripts/bdd/run-typescript.ts specs/features/portal/home.feature`
- `bun scripts/bdd/verify-alignment.ts`
- `bun run typecheck`
- `bun run lint`
