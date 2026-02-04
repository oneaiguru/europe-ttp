# TASK-029: Admin Gets Form Data for User - Research

## Task Information
- **Task ID**: TASK-029
- **Feature File**: `specs/features/user/reporting_get_form_data.feature`
- **Scenario**: Admin gets form data for user

---

## Research Findings

### 1. Python Implementation (Legacy)

#### Location
- **File**: `reporting/user_summary.py`
- **Key Function**: `get_user_summary_by_user()` at line 70
- **Endpoint**: `/reporting/user-summary/get-by-user`

#### Implementation Details

The legacy Python code has a `Reporting` class that handles admin-only form data retrieval:

```python
# File: reporting/user_summary.py:70-74
def get_user_summary_by_user(self):
    _f = gcs.open(constants.USER_SUMMARY_BY_USER)
    _contents = _f.read()
    _f.close()
    return _contents
```

**Authentication Check** (lines 44-50):
```python
user = users.get_current_user()
if user:
    user_email_addr = user.email()
else:
    user_email_addr = ""

if not is_cron and user_email_addr not in constants.LIST_OF_ADMINS:
    self.response.write("<b>UN-AUTHORIZED</b>")
```

**Key Points**:
- Admin-only endpoint protected by checking `user_email_addr in constants.LIST_OF_ADMINS`
- Returns JSON content from GCS file `constants.USER_SUMMARY_BY_USER`
- The data contains user summaries with form data aggregated by user email
- Data includes all form types: `ttc_application`, `ttc_evaluation`, `post_ttc_self_evaluation_form`, etc.

#### Data Structure
The returned JSON contains:
```python
_user_data_by_email[_ue] = {
    _ft: {  # form_type (e.g., 'ttc_application')
        _fi: {  # form_instance
            'data': {...},
            'form_instance_page_data': {...},
            'is_form_submitted': bool,
            'is_form_complete': bool,
            'last_update_datetime': str,
            'reporting': {
                'reporting_status': str,
                'evaluations': {},
                # ... other reporting fields
            }
        }
    }
}
```

---

### 2. TypeScript Implementation Context

#### Current State
- **No existing implementation** for this feature
- API directory exists at `app/api/` but is empty
- Existing API pattern: `app/users/upload-form-data/route.ts` shows Next.js 14 App Router API route structure

#### Target Location
- **New file needed**: `app/api/admin/reporting/user-form-data/route.ts` (or similar)
- Or: `app/admin/[userId]/form-data/route.ts` following Next.js patterns

#### Existing Patterns to Follow

From `app/users/upload-form-data/route.ts`:
- Uses Next.js 14 App Router API route pattern
- Exports named HTTP method functions (`POST`, `GET`)
- Returns `Response.json()` for JSON responses
- Handles payload normalization for JSON and form-encoded data

---

### 3. Step Registry Status

#### Current Registry Entry
**File**: `test/bdd/step-registry.ts:200-205`

```typescript
'I request form data for a specific user via reporting': {
  pattern: /^I\ request\ form\ data\ for\ a\ specific\ user\ via\ reporting$/,
  python: 'test/python/steps/user_steps.py:1',    // TODO: needs actual line number
  typescript: 'test/typescript/steps/user_steps.ts:1',  // TODO: needs actual line number
  features: ['specs/features/user/reporting_get_form_data.feature:9'],
},
```

**Status**: Placeholder entries (line number = 1) - steps not yet implemented

---

### 4. Authentication Patterns

#### Python Auth
- Uses Google App Engine `users.get_current_user()`
- Checks against `constants.LIST_OF_ADMINS`

#### TypeScript Auth Context
**File**: `test/typescript/steps/auth_steps.ts:18-22`

```typescript
export const authContext: {
  currentUser?: TestUser;
  currentPage?: string;
  passwordResetEmail?: string;
  responseHtml?: string;
} = {};
```

**Test Users**: `test/fixtures/test-users.json` includes admin user:
```json
{
  "email": "test.admin@example.com",
  "role": "admin",
  "home_country": "US",
  "name": "Test Admin",
  "password": "test_password_123"
}
```

#### Missing Auth Step
The feature file uses `Given I am authenticated as an admin user` but this step doesn't exist yet in:
- `test/python/steps/auth_steps.py`
- `test/typescript/steps/auth_steps.ts`

---

## Summary

### What Needs Implementation

1. **Python BDD Steps** (in `test/python/steps/user_steps.py`):
   - `Given I am authenticated as an admin user`
   - `When I request form data for a specific user via reporting`
   - `Then I should receive that user's form data`

2. **TypeScript BDD Steps** (in `test/typescript/steps/user_steps.ts`):
   - Same three steps as Python

3. **TypeScript Implementation** (new API route):
   - Create admin-only API endpoint for retrieving user form data
   - Implement admin authentication check
   - Return form data for specified user
   - Follow Next.js 14 App Router patterns

### Key Implementation Notes

1. **Admin Authentication**: Both Python and TypeScript implementations need to verify the user is an admin before returning data
2. **User Specification**: The feature mentions "a specific user" - the API needs to accept a user identifier parameter
3. **Data Format**: Should return structured form data similar to the legacy `get_user_summary_by_user()` response
4. **Test Data**: Will need to set up test users with form data for the scenario to verify

---

## Files Referenced

### Legacy Python Files
- `reporting/user_summary.py` - Main implementation
- `constants.py` - Contains `LIST_OF_ADMINS` and `USER_SUMMARY_BY_USER` constants
- `ttc_portal_user.py` - TTCPortalUser class for user data management

### Test Files
- `specs/features/user/reporting_get_form_data.feature` - Feature file
- `test/fixtures/test-users.json` - Test user data including admin
- `test/python/steps/user_steps.py` - Python BDD steps (to be extended)
- `test/typescript/steps/user_steps.ts` - TypeScript BDD steps (to be extended)
- `test/bdd/step-registry.ts` - Step registry (needs updates)

### Target TypeScript Files
- `app/api/admin/reporting/user-form-data/route.ts` - NEW (API endpoint)
- Or alternative: `app/admin/api/users/[email]/form-data/route.ts`
