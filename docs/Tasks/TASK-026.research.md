# TASK-026 Research: User Get Form Data

## Legacy Implementation Analysis

### 1. Python Method: `TTCPortalUser.get_form_data()`

**Location**: `/workspace/ttc_portal_user.py:212`

```python
def get_form_data(self, f_type, f_instance):
    logging.info('[get_form_data] called f_type = {f_type} f_instance = {f_instance}'.format(**locals()))
    logging.info('[get_form_data] email = ' + self.email)
    _instance = 'default'
    _form_data = {}
    if f_instance and f_instance.strip() != '':
        _instance = f_instance
    if f_type in self.form_data and _instance in self.form_data[f_type]:
        return self.form_data[f_type][_instance]['data']
    return _form_data
```

**Key Logic**:
- Accepts `f_type` (form type) and `f_instance` (form instance) parameters
- Defaults to `'default'` instance if `f_instance` is empty
- Returns the `'data'` field from `self.form_data[f_type][_instance]`
- Returns empty dict `{}` if no data found
- Logs the method call and user email

### 2. API Endpoint: `/users/get-form-data`

**Location**: `/workspace/ttc_portal_user.py:454-457`

```python
if self.request.path == '/users/get-form-data':
    _form_type = self.request.get('form_type')
    _form_instance = self.request.get('form_instance')
    self.response.write(json.dumps(_ttc_user.get_form_data(_form_type, _form_instance)))
```

**Key Logic**:
- Retrieves `form_type` and `form_instance` from query parameters
- Calls `TTCPortalUser.get_form_data()` with these parameters
- Returns JSON response with the form data
- Requires user authentication (handled in outer scope)

### 3. Related Method: `TTCPortalUser.set_form_data()`

**Location**: `/workspace/ttc_portal_user.py:36-89`

**Key Details**:
- Stores form data in `self.form_data[f_type][f_instance]` structure
- Stores complete form record with keys:
  - `'data'` - actual form field values
  - `'form_instance_page_data'` - page metadata
  - `'form_instance_display'` - display name
  - `'is_agreement_accepted'` - boolean
  - `'is_form_submitted'` - boolean
  - `'is_form_complete'` - boolean
  - `'last_update_datetime'` - timestamp
- Always stores to `'default'` instance as well for easy retrieval

### 4. Data Structure

```python
self.form_data = {
    'ttc_application': {
        'default': {
            'data': {'i_fname': 'John', 'i_lname': 'Doe', ...},
            'form_instance_page_data': {...},
            'form_instance_display': 'test_us_future',
            'is_agreement_accepted': True,
            'is_form_submitted': False,
            'is_form_complete': False,
            'last_update_datetime': '2024-01-01 00:00:00'
        },
        'test_us_future': {...}  # same as default when created
    }
}
```

## Test Implementation Context

### Already Available in `test/python/steps/user_steps.py`:

1. **MockTTCPortalUser class** (lines 27-93):
   - Has `get_form_data(f_type, f_instance)` method that returns stored data
   - Has `set_form_data()` method for storing test data
   - Compatible with legacy interface

2. **Form data upload step** (lines 133-201):
   - `@when('I upload form data for a specific form instance')`
   - Stores form data using `set_form_data()`
   - Sets `context.uploaded_form_data` with upload details

3. **Verification step** (lines 204-242):
   - `@then('my form data should be stored for that instance')`
   - Verifies data was stored correctly
   - Shows pattern for verification

### TypeScript Implementation Context

**Location**: `/workspace/test/typescript/steps/user_steps.ts`

Already has:
- `MockTTCPortalUser` class with `getFormData()` method (lines 73-78)
- Form upload step: `When('I upload form data for a specific form instance')` (lines 157-182)
- Verification step: `Then('my form data should be stored for that instance')` (lines 184-219)

## Step Definitions Needed

### Step 1: "I have previously saved form data for a form instance"

**Purpose**: Set up test context with existing form data

**Implementation approach**:
- Reuse existing fixture loading mechanism
- Call `set_form_data()` to store test data
- Store form type and instance in context for later retrieval

**Data to use**:
- Can reuse form submissions from `/workspace/test/fixtures/form-submissions.json`
- Example: `{'form_type': 'ttc_application', 'form_instance': 'default', 'data': {...}}`

### Step 2: "I request that form data"

**Purpose**: Simulate the API call to retrieve form data

**Implementation approach**:
- Get user from context (create if not exists)
- Retrieve form type and instance from context
- Call `user.get_form_data(f_type, f_instance)`
- Store result in context for verification

### Step 3: "I should receive the stored form data"

**Purpose**: Verify the retrieved data matches what was stored

**Implementation approach**:
- Assert data was retrieved
- Compare retrieved data with original stored data
- Verify all expected fields are present

## File Locations

- **Legacy Python**: `/workspace/ttc_portal_user.py`
  - `get_form_data()` method: line 212
  - API endpoint: line 454

- **Python Steps**: `/workspace/test/python/steps/user_steps.py`
  - MockTTCPortalUser class: lines 27-93
  - Form upload step: lines 133-201
  - Verification step: lines 204-242

- **TypeScript Steps**: `/workspace/test/typescript/steps/user_steps.ts`
  - MockTTCPortalUser class: lines 28-107
  - Form upload step: lines 157-182
  - Verification step: lines 184-219

- **Fixtures**: `/workspace/test/fixtures/form-submissions.json`

## Implementation Notes

1. The steps should follow the same pattern as the upload steps (TASK-025)
2. MockTTCPortalUser already implements the necessary methods
3. No need to test actual GAE functionality - mock is sufficient
4. The steps should demonstrate the data round-trip: store → retrieve → verify
