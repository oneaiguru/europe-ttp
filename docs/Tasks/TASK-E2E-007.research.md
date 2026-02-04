# TASK-E2E-007: Draft Save and Resume - Research Findings

## Overview
This task implements draft save and resume functionality for TTC forms, allowing applicants to save partial applications and resume them later after logout/login.

## Feature File Analysis

**Feature**: `specs/features/e2e/draft_save_and_resume.feature`

**Scenarios**:
1. **Save partial application and resume after logout** - Tests that draft data persists across sessions
2. **Multiple drafts for different forms** - Tests that users can have separate drafts for different form types

**Unique Steps Required** (not yet in registry):
- `I fill in the TTC application form partially with:` (parameterized with table)
- `I save the application as draft`
- `I should see my draft data persisted`
- `I complete the remaining required fields and submit`
- `I save a partial TTC application as draft`
- `I save a partial evaluator profile as draft`
- `I navigate to the TTC application form`
- `I should see the TTC application draft data`
- `I navigate to the evaluator profile form`
- `I should see the evaluator profile draft data`

**Steps Already in Registry**:
- `I am authenticated as a TTC applicant` ✓
- `I sign out of the TTC portal` ✓
- `I sign in with a valid Google account` ✓
- `I open the TTC application form` ✓ (may need variant for "navigate")
- `the application should be marked as submitted` ✓

---

## Python Implementation (Legacy Code)

### Key Files Found

#### 1. `/workspace/form.py` (Lines 604-781)
**Purpose**: Main form rendering and instance management

**Key Functions**:
- `get_html_for_question()` - Renders form questions, handles `is_form_instance_identifier` attribute
- `Form.get()` - Main GET handler that:
  - Retrieves `form_instance_list` via `_ttc_user.get_form_instances(form_type)` (line 627)
  - Stores instances in `form_instance_list` array
  - Shows form instance selector UI when multiple instances exist (lines 640-704)
  - Renders each page with `is_form_instance_identifier` attribute (line 731)

**Form Instance Selector Logic** (lines 627-704):
```python
_form_instances = _ttc_user.get_form_instances(form_type)
if len(_form_instances) > 0:
    for _fi in _form_instances:
        form_instance_list.append(_fi)
        _display = _form_instances[_fi]['display']
        _page_data = _form_instances[_fi]['page_data']
```

**Draft Data Storage**: Form instances are stored with:
- `display`: Human-readable identifier (e.g., TTC option name, date)
- `page_data`: The actual form data for each page

#### 2. `/workspace/ttc_portal_user.py`
**Purpose**: User data management including form instances

**Key Methods**:
- `get_form_instances(form_type)` - Returns dict of form instances for a user
- `save_user_data()` (line 321) - Persists user data to GCS at `constants.USER_CONFIG_LOCATION + user_email + '.json'`
- User data structure includes form instances in the JSON

#### 3. `/workspace/api.py` (Lines 43-200)
**Purpose**: Form submission handler (incomplete, shows PHP-to-Python translation in progress)

**Key Variables**:
- `page_number` - Current page being saved
- `form_type` - Type of form (e.g., "evaluation", "evaluator_profile", "selfevaluation")
- `obj_page_json` - Form data for current page as JSON
- `form_id` - Composite ID: `{username}.{form_type}` or `{username}.{formInstanceId}.{form_type}`

**Save Logic** (PHP comments indicate):
```php
$fp = fopen(CLOUD_STORAGE_LOCATION . '/form_storage/' . $_SESSION['userObj']->username . '.' . $formId . 'page'.$pageNumber.'.txt', 'w');
fwrite($fp, $objPageJson);
fclose($fp);
```

**Form ID Construction**:
- Empty form_type: `formId = ""` (uses session-based draft storage)
- Evaluation: `formId = currentEvaluationId . '.evaluation'`
- Evaluator profile: `formId = 'evaluator_profile'`
- Self-evaluation: `formId = currentSelfEvaluationId . '.selfevaluation'`

---

## TypeScript Implementation Context

### Existing Code Structure

#### 1. `/workspace/test/typescript/steps/e2e_api_steps.ts`
**Purpose**: E2E API step definitions using test context

**Test Context Structure** (lines 53-87):
```typescript
const testContext: {
  currentEmail?: string;
  currentRole?: string;
  currentUser?: TestUser;
  currentTtcOption?: TTCOption;
  lastSubmission?: FormSubmission;
  // ... other fields
}
```

**Existing Patterns**:
- Uses `testContext` to maintain state across steps
- `loadTestUsers()` function loads from `test/fixtures/test-users.json`
- Form submissions tracked in `lastSubmission` object
- Uses API-style testing (not browser automation)

#### 2. `/workspace/test/typescript/steps/api_steps.ts`
**Purpose**: Form data upload API steps

**Existing Step**: `I submit form data to the upload form API` (line 69)
- Posts to `/users/upload-form-data`
- Payload includes: `form_type`, `form_instance`, `form_data`, `form_instance_page_data`, `form_instance_display`

**Note**: This is a skeleton that needs full implementation for draft save.

---

## Step Registry Status

### Steps Missing from Registry

The following steps from `draft_save_and_resume.feature` are **NOT** in `/workspace/test/bdd/step-registry.ts`:

1. `I fill in the TTC application form partially with:` - Parameterized step with table data
2. `I save the application as draft` - Core draft save action
3. `I should see my draft data persisted` - Verification step
4. `I complete the remaining required fields and submit` - Completion action
5. `I save a partial TTC application as draft` - Variant for partial save
6. `I save a partial evaluator profile as draft` - Cross-form draft support
7. `I navigate to the TTC application form` - May reuse existing "open" step
8. `I should see the TTC application draft data` - Form-specific draft verification
9. `I navigate to the evaluator profile form` - Navigation step
10. `I should see the evaluator profile draft data` - Profile-specific draft verification

### Steps Already in Registry

- `I am authenticated as a TTC applicant` → `forms_steps.py:29`, `forms_steps.ts:17`
- `I sign out of the TTC portal` → `auth_steps.py:105`, `auth_steps.ts:61`
- `I sign in with a valid Google account` → `auth_steps.py:69`, `auth_steps.ts:41`
- `the application should be marked as submitted` → `e2e_api_steps.py:1` (TODO), `e2e_api_steps.ts:1` (TODO)

---

## Implementation Notes

### Draft Data Storage Model (Legacy)

**Storage Location**: Cloud Storage (GCS)
- Path pattern: `/form_storage/{username}.{formId}page{pageNumber}.txt`
- User config: `/config/user_config/{username}.json`

**Form Instance Structure**:
```json
{
  "form_type": "ttc_application",
  "form_instance": "test_us_future",
  "form_instance_display": "TTC US Test Future",
  "page_data": {
    "page1": {"i_fname": "John", "i_lname": "Doe"},
    "page2": {"i_email": "john.doe@example.com"}
  },
  "status": "draft" | "submitted"
}
```

### Key Behaviors to Implement

1. **Partial Save**: Save form data page-by-page to GCS
2. **Draft State**: Track form status as "draft" vs "submitted"
3. **Multiple Instances**: Support multiple drafts per form type (e.g., different TTC options)
4. **Cross-Session Persistence**: Data must survive logout/login
5. **Cross-Form Support**: Separate drafts for TTC application, evaluator profile, etc.

### Test Data Requirements

**Fixtures Needed**:
- Test users with applicant and evaluator roles (exist in `test/fixtures/test-users.json`)
- TTC option with future dates (exist in `storage/forms/ttc_country_and_dates_test.json`)
- Draft form data samples (to be created)

### API Endpoints Required (TypeScript)

Based on existing patterns in `api_steps.ts`:

1. **Save Draft**: `POST /users/save-form-draft`
   - Payload: `{form_type, form_instance, page_number, form_data}`

2. **Load Draft**: `GET /users/load-form-draft`
   - Query: `?form_type={type}&form_instance={instance}`
   - Returns: Draft data for all pages

3. **Submit Form**: `POST /users/submit-form`
   - Payload: `{form_type, form_instance, form_data}`
   - Action: Change status from "draft" to "submitted"

---

## Verification Steps

To verify this research:

1. **Check form instance handling in legacy code**:
   ```bash
   grep -n "form_instance" /workspace/form.py
   ```

2. **Check user data storage**:
   ```bash
   grep -n "save_user_data\|load_user_data" /workspace/ttc_portal_user.py
   ```

3. **Verify step registry alignment**:
   ```bash
   bun scripts/bdd/verify-alignment.ts
   ```

---

## Next Steps (Planning Phase)

The planning phase should define:

1. **Step Registry Updates**: Add 10 missing step patterns
2. **Python Step Definitions**: Implement in `test/python/steps/e2e_api_steps.py`
3. **TypeScript Step Definitions**: Implement in `test/typescript/steps/e2e_api_steps.ts`
4. **Test Fixtures**: Create draft data samples in `test/fixtures/`
5. **API Mocking**: Define mock draft save/load endpoints for testing
