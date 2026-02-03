# TASK-006 Research: Portal Tabs - Render tabbed HTML

## Legacy behavior (Python)
- Tabs handler: `tabs.py:28-68` (`class Tabs`, `get(self, obj)`).
- Template resolution: `tabs.py:30` loads Jinja template by name (`obj`) from repo root (`JINJA_ENVIRONMENT` uses `FileSystemLoader(os.path.dirname(__file__))`).
- Auth/user context:
  - `tabs.py:31-40` uses `users.get_current_user()`.
  - If authenticated: sets `user_email_addr`, `user_logout_url`, `user_login_url` empty.
  - If not authenticated: sets `user_email_addr` empty, `user_logout_url` empty, `user_login_url = users.create_login_url(callback_url)` where `callback_url` is request param (`tabs.py:39-40`).
- Geo/user home context:
  - `tabs.py:42-51` tries to read `X-AppEngine-Country`, `X-Appengine-City`, `X-AppEngine-Region` headers; on failure uses empty strings.
  - `tabs.py:53-55` sets `user_home_country` + `user_home_country_iso` from request params, defaulting to `user_country` (from headers or empty).
- Template render inputs: `tabs.py:57-68` passes `user_email_addr`, `user_logout_url`, `user_login_url`, `user_country`, `user_city`, `user_state`, `user_city_state_country`, `user_home_country_iso`, `user_home_country`, `countries=constants.COUNTRIES`.

## Portal usage (where tabs are requested)
- `ttc_portal.html:160-195` defines `displayPageContents` that loads tab templates via AJAX:
  - If login required and `user_email_addr` empty, requests `tabs/signin.html` with `callback_url` (lines 170-182) and sets `pageurl = 'signin.html'`.
  - Otherwise requests `tabs/<pageurl>` with `user_home_country_iso` and `user_home_country` taken from DOM (`#user_home_country_iso`, `#user_home_country`) (lines 187-193).

## Tab templates that use user context
- `tabs/welcome.html:27-73` uses `user_home_country_iso` and `user_home_country` for conditional messaging and the home country display.
- `tabs/contact.html:35-47` shows `{{user_home_country}} TTC Desk` and switches email based on `user_home_country_iso`.
- `tabs/signin.html:34-39` uses `{{ user_login_url }}` for the sign-in link.
- `tabs/settings.html:284` uses `{{ user_country or 'us' }}` in a JS config; earlier JS comments reference `user_country` (lines 48-50).

## Step registry status
- `test/bdd/step-registry.ts` already includes entries for:
  - `I request a tab template page` at `test/bdd/step-registry.ts:194-198` with placeholder `portal_steps` line numbers.
  - `I should see the rendered tab content with user context` at `test/bdd/step-registry.ts:470-480` with placeholder `portal_steps` line numbers.

## TypeScript context
- No existing portal tabs renderer found under `app/` (only `app/portal/home/render.ts` and `app/portal/disabled/render.ts`).
- Existing portal render patterns:
  - `app/portal/home/render.ts` renders HTML strings from options (user email, home country, report links).
  - `app/portal/disabled/render.ts` provides a small HTML snippet with a constant message.

## Notes / implications
- The legacy tabs handler renders arbitrary templates by path (e.g., `tabs/welcome.html`) and relies on request params for `user_home_country` / `user_home_country_iso`.
- "Rendered tab content with user context" can be validated by checking for `user_home_country` text (welcome/contact templates) or `user_login_url` (signin template) in the HTML output.
