# TASK-025: User Form Data Upload - Research

## Task Context
- **Feature**: `specs/features/user/form_data_upload.feature`
- **Scenario**: "Upload form data"
- **Steps to implement**:
  1. `Given I am authenticated on the TTC portal` (✅ EXISTS - auth_steps)
  2. `When I upload form data for a specific form instance` (❌ NEEDS IMPLEMENTATION)
  3. `Then my form data should be stored for that instance` (❌ NEEDS IMPLEMENTATION)

---

## 1. Legacy Python Implementation

### Primary Source File
**`ttc_portal_user.py`** - Lines 36-89 (`set_form_data` method)

### Key Implementation Details

#### 1.1 Core Method: `TTCPortalUser.set_form_data()`
- **Location**: `ttc_portal_user.py:36-89`
- **Signature**:
  ```python
  def set_form_data(self, f_type, f_instance, f_data, f_instance_page_data, f_instance_display)
  ```

#### 1.2 Data Storage Structure
The legacy system stores form data in a nested dictionary structure:

```python
self.form_data[f_type][_instance] = {
    'data': f_data,                           # Actual form field values
    'form_instance_page_data': f_instance_page_data,  # Page metadata
    'form_instance_display': f_instance_display,      # Display label
    'is_agreement_accepted': bool,
    'is_form_submitted': bool,
    'send_confirmation_to_candidate': bool,
    'is_form_complete': bool,
    'last_update_datetime': 'YYYY-MM-DD HH:MM:SS'
}
```

Key behaviors:
- Default instance is `'default'` if not specified
- Non-default instances also write to `'default'` for easy retrieval
- `is_form_complete` is computed by checking if all fields have non-empty values
- Email sending triggered on form submission (`is_form_submitted == True`)

#### 1.3 API Endpoint
**`/users/upload-form-data`** (POST) - `ttc_portal_user.py:403-419`

Request parameters:
- `form_type` - Form type identifier (e.g., 'ttc_application')
- `form_instance` - Instance identifier (defaults to 'default')
- `form_data` - JSON string of form field data
- `form_instance_page_data` - JSON string of page metadata
- `form_instance_display` - Display label for the instance
- `user_home_country_iso` - User's home country (from request header or param)

#### 1.4 User Data Persistence
- **`save_user_data()`** method (lines 321-338): Serializes user to JSON and saves to GCS
- **`load_user_data()`** method (lines 309-319): Loads user JSON from GCS
- Storage path pattern: `constants.USER_CONFIG_LOCATION + email + '.json'`

---

## 2. TypeScript Context

### 2.1 Existing Implementation Structure
The TypeScript codebase follows Next.js 14 App Router patterns.

#### Parallel Directory Structure
```
Legacy Python                    TypeScript (To Create/Monify)
───────────────────────────────────────────────────────────
ttc_portal_user.py              →  app/users/upload-form-data/route.ts
                                →  lib/users/form-data.ts (data access layer)
```

#### Existing API Pattern (from `test/typescript/steps/api_steps.ts`)
The TypeScript tests expect:
- API endpoint at `/users/upload-form-data`
- POST handler accepting JSON payload
- Response status 200 on success

### 2.2 Existing Similar Implementation
**`test/typescript/steps/api_steps.ts:69-93`** shows:
- Form submissions from fixtures (`test/fixtures/form-submissions.json`)
- Payload structure with `form_type`, `form_instance`, `form_data`, etc.
- Dynamic import of route handler: `import('../../../app/users/upload-form-data/route')`

### 2.3 Data Layer Pattern
No existing TypeScript data layer exists for user form data. Need to create:
- Prisma schema for user form data (if using database)
- OR file-based storage matching legacy GCS pattern

---

## 3. Step Registry Status

From `test/bdd/step-registry.ts:506-511`:

```typescript
'I upload form data for a specific form instance': {
  pattern: /^I\ upload\ form\ data\ for\ a\ specific\ form\ instance$/,
  python: 'test/python/steps/user_steps.py:1',     // ❌ Skeleton only
  typescript: 'test/typescript/steps/user_steps.ts:1', // ❌ Skeleton only
  features: ['specs/features/user/form_data_upload.feature:9'],
}
```

From `test/bdd/step-registry.ts:548-553`:

```typescript
'my form data should be stored for that instance': {
  pattern: /^my\ form\ data\ should\ be\ stored\ for\ that\ instance$/,
  python: 'test/python/steps/user_steps.py:1',     // ❌ Skeleton only
  typescript: 'test/typescript/steps/user_steps.ts:1', // ❌ Skeleton only
  features: ['specs/features/user/form_data_upload.feature:10'],
}
```

---

## 4. Implementation Notes

### 4.1 Python Step Implementation Pattern
From `test/python/steps/api_steps.py:121-163`:
- Uses `StubUser` to mock Google App Engine `users.get_current_user()`
- Patches `TTCPortalUser` storage methods (`load_user_data`, `save_user_data`)
- Uses webtest `TestApp` to call the legacy endpoint
- Stores response in `context.response` for verification

### 4.2 Test Data Requirements
From `test/python/steps/api_steps.py:81-118`:
- Form submission data from fixtures
- User email resolution from `context.current_user` or submission
- Home country resolution with fallback to 'US'

### 4.3 Key Differences from Existing API Steps
- This feature specifically tests the **user-facing** `/users/upload-form-data` endpoint
- Existing `api_steps.py` tests the `/api/upload-form` endpoint (legacy/internal)
- User steps need to verify the **user's stored data**, not just API response

### 4.4 What Makes This Step Different
1. **User-scoped**: Tests data persistence per user, not just API acceptance
2. **Storage verification**: Must verify `get_form_data()` returns stored values
3. **Multi-instance support**: Tests storage/retrieval for specific form instances

---

## 5. Verification Strategy

### Python Verification
1. Mock `TTCPortalUser` storage to use in-memory dict
2. Call `set_form_data()` with test data
3. Call `get_form_data()` to verify storage
4. Check `form_data` dictionary structure

### TypeScript Verification
1. Mock/stub the route handler or data layer
2. Verify payload construction
3. In full integration: verify database/file storage
4. For BDD tests: verify response status and in-memory storage

---

## Summary

**Legacy Behavior**: `TTCPortalUser.set_form_data()` stores form data in a nested dictionary structure with metadata fields, then persists to GCS JSON file.

**Key Files**:
- Legacy: `ttc_portal_user.py:36-89` (set_form_data), `ttc_portal_user.py:403-419` (API endpoint)
- Python tests: `test/python/steps/user_steps.py` (needs implementation)
- TS tests: `test/typescript/steps/user_steps.ts` (needs implementation)
- TS implementation: `app/users/upload-form-data/route.ts` (needs creation)

**Implementation Approach**:
- Python: Use `TTCPortalUser` class directly with mocked storage
- TypeScript: Create API route and data layer following Next.js patterns
- Both: Verify data can be stored and retrieved for specific form instances
