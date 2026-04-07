# Task: Port TTCPortalUser Class

## Goal
Create a TypeScript class that loads/saves per-user JSON data from GCS, matching the Python `TTCPortalUser` class exactly.

## Context
The legacy Python app stores all user data (form submissions, profile, config) as a single JSON file per user in GCS at `user_data/{email}.json`. The `TTCPortalUser` class is the data model — constructor loads from GCS, methods read/write form data, `saveUserData()` writes back. Every route that touches user data uses this class. The TS app currently has no persistence — this class enables it.

## Read These Files First
1. `/Users/m/Downloads/europe-ttp-master@44c225683f8/ttc_portal_user.py` (full file, ~477 lines) — the Python class to port. Focus on:
   - `__init__` and `initialize_user` (lines 356-371, 340-354) — constructor pattern
   - `load_user_data` / `save_user_data` (lines 309-338) — GCS read/write
   - `set_form_data` (lines 36-88) — form persistence with completeness check
   - `get_form_data` / `get_form_instances` (lines 212-232) — data retrieval
   - `is_form_submitted` / `is_form_complete` (lines 234-256) — boolean checks
   - `set_config` / `get_config` (lines 296-302) — user preferences
   - `set_home_country` / `get_home_country` (lines 289-294)
2. `/Users/m/ttp-split-experiment/app/utils/gcs.ts` — the GCS utility (created in Task 1.1). Use `readJson()` and `writeJson()` for persistence.
3. `/Users/m/ttp-split-experiment/app/utils/auth.ts` (lines 1-10) — import style reference

## Changes Required

**Create `app/utils/ttc-portal-user.ts`:**

Port the following from `ttc_portal_user.py`:

| Python method | TS method | Notes |
|---|---|---|
| `__init__(self, user_email)` | `static async create(email: string)` | Async factory — can't do async in constructor. Calls `loadUserData`. |
| `initialize_user(self, data)` | `private initializeUser(data)` | Sets all fields from loaded JSON |
| `load_user_data(self, user_email)` | `private async loadUserData(email)` | Uses `readJson(GCS_PATHS.USER_CONFIG_PREFIX + email + '.json')` |
| `save_user_data(self)` | `async saveUserData()` | Uses `writeJson(path, this.toJSON())` — do NOT call `JSON.stringify()` here, `writeJson()` already handles serialization |
| `set_form_data(self, f_type, f_instance, ...)` | `setFormData(formType, formInstance, data, pageData, display)` | Port completeness check, `is_form_submitted`, `is_form_complete` flags, `last_update_datetime` |
| `get_form_data(self, f_type, f_instance)` | `getFormData(formType, formInstance)` | Returns stored answers dict |
| `get_form_instances(self, f_type)` | `getFormInstances(formType)` | Returns instance list with page_data and display |
| `is_form_submitted(self, f_type, f_instance)` | `isFormSubmitted(formType, formInstance)` | Boolean check |
| `is_form_complete(self, f_type, f_instance)` | `isFormComplete(formType, formInstance)` | Boolean check |
| `set_config` / `get_config` | `setConfig(params)` / `getConfig()` | User preferences |
| `set_home_country` / `get_home_country` | `setHomeCountry(country)` / `getHomeCountry()` | |
| `get_email` | `getEmail()` | |

**Key implementation details:**
- `setFormData` must check completeness: iterate all fields, if any is null/empty string → `is_form_complete = false` (Python lines 53-56)
- `setFormData` must set `is_agreement_accepted`, `is_form_submitted`, `send_confirmation_to_candidate` from `i_agreement_accepted`, `i_form_submitted`, `i_send_confirmation_to_candidate` in form_data (Python lines 58-60). Use a `str2bool` helper: truthy strings → true.
- `setFormData` must store `default` copy when instance != 'default' (Python line 82-83)
- `setFormData` must set `last_update_datetime` to current UTC time as `YYYY-MM-DD HH:MM:SS` (Python line 75)
- **SKIP** `send_submission_emails` — email is deferred to Phase 6
- **SKIP** `get_public_photo_url` / `set_photo_file` — photo handling deferred

**Export:** `TTCPortalUser` class + `GCS_PATHS` re-export from gcs.ts for convenience.

## Constraints
- Do NOT add email sending logic
- Do NOT add photo URL logic (App Engine Images API not available)
- Do NOT modify any existing files
- Use `Date` for datetime, format to `YYYY-MM-DD HH:MM:SS` string when saving (matching Python `strftime`)
- Handle GCS NotFoundError gracefully in `loadUserData` — initialize with empty data (matching Python lines 317-319)

## Verification
- `npx tsc --noEmit` must pass

## Completion
- Commit with message: `feat: port TTCPortalUser class for GCS-backed user persistence`
- Report: files changed, verification result
