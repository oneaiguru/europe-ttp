# TASK-028: User Config Management - Research

## Task Context
- **Task ID**: TASK-028
- **Feature**: `specs/features/user/config_management.feature`
- **Priority**: p2
- **Scenarios**: 2 (Get config, Update config)

## Legacy Behavior Analysis

### Python Implementation Location

**File**: `/workspace/ttc_portal_user.py`

#### Key Methods:

1. **`get_config()`** (line 301-302)
   - Returns `self.config` dictionary
   - Simple getter for user configuration
   - Called via `/users/get-config` endpoint

2. **`set_config(config_params)`** (line 296-299)
   - Updates `self.config` with provided params
   - Special handling for `i_home_country` - calls `set_home_country()`
   - Must be followed by `save_user_data()` to persist

3. **`initialize_user(data)`** (line 340-354)
   - Loads config from data dict: `self.config = data.get('config', {})`
   - Initializes config to empty dict if not present

4. **`save_user_data()`** (line 321-338)
   - Persists entire user object to GCS as JSON
   - File location: `constants.USER_CONFIG_LOCATION + self.email + '.json'`

#### HTTP Endpoints:

**GET `/users/get-config`** (line 461-462)
- Handler: `UsersService.get()`
- Returns: JSON dump of `ttc_user.get_config()`
- Authentication: Requires authenticated Google user via `users.get_current_user()`

**POST `/users/set-config`** (line 420-424)
- Handler: `UsersService.post()`
- Parameters: `config_params` (JSON string)
- Process:
  1. Parse `config_params` from request
  2. Call `ttc_user.set_config(config_params)`
  3. Call `ttc_user.save_user_data()`

### Config Dictionary Structure

Based on legacy code:
- `self.config['i_home_country']` - User's home country ISO code
- Other config keys may be added dynamically via `set_config()`
- Stored in user JSON file alongside: `email`, `name`, `photo_file`, `form_data`, `is_profile_complete`, `home_country`

## Existing TypeScript Context

### Current Implementation:
- **File**: `/workspace/test/typescript/steps/user_steps.ts`
- **Status**: Only has form data upload steps implemented
- **Missing**: No config management steps yet

### Mock User Class:
The `MockTTCPortalUser` class in user_steps.ts already has:
- `public config: Record<string, unknown> = {}`
- `initializeUser()` method that sets config to empty dict
- Needs to add: `getConfig()` and `setConfig()` methods

## Step Registry Status

Current entries in `/workspace/test/bdd/step-registry.ts`:
- Line 206-211: `I request my user configuration` - Points to placeholder (line 1)
- Line 308-313: `I should receive my saved configuration` - Points to placeholder (line 1)
- Line 500-505: `I update my user configuration` - Points to placeholder (line 1)
- Line 542-547: `my configuration should be saved` - Points to placeholder (line 1)

**Status**: All 4 steps are placeholder implementations pointing to line 1.

## Implementation Notes

### Python Step Implementation:
1. Extend `MockTTCPortalUser` class in `test/python/steps/user_steps.py`:
   - Add `get_config()` method returning `self.config`
   - Add `set_config(config_params)` method updating `self.config`
   - Handle `i_home_country` special case if needed

2. Create step definitions:
   - `when('I request my user configuration')` - Store config in context
   - `then('I should receive my saved configuration')` - Assert config exists
   - `when('I update my user configuration')` - Call set_config with test data
   - `then('my configuration should be saved')` - Verify config was updated

### TypeScript Step Implementation:
1. Extend `MockTTCPortalUser` class in `test/typescript/steps/user_steps.ts`:
   - Add `getConfig(): Record<string, unknown>` method
   - Add `setConfig(configParams: Record<string, unknown>): void` method

2. Create matching step definitions with same logic

### Test Data:
- Use test user email: `test.applicant@example.com` (from fixtures)
- Sample config: `{ i_home_country: 'US' }`
- Test update: `{ i_home_country: 'IN' }`

## Verification Plan

After implementation:
1. Run Python BDD: `bun scripts/bdd/run-python.ts specs/features/user/config_management.feature`
2. Run TypeScript BDD: `bun scripts/bdd/run-typescript.ts specs/features/user/config_management.feature`
3. Verify step registry alignment: `bun scripts/bdd/verify-alignment.ts`

## References

- Legacy endpoint: `/users/get-config`, `/users/set-config`
- TTCPortalUser class: `ttc_portal_user.py:296-302`, `ttc_portal_user.py:420-424`, `ttc_portal_user.py:461-462`
- Constants: `constants.USER_CONFIG_LOCATION` (GCS path for user config files)
