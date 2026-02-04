# TASK-025: User Form Data Upload - Implementation Plan

## Overview
Implement BDD step definitions for form data upload functionality in both Python and TypeScript, following the legacy `TTCPortalUser.set_form_data()` behavior.

---

## 1. Python Step Definition Implementation

### 1.1 Step: `When I upload form data for a specific form instance`

**File**: `test/python/steps/user_steps.py`

**Function Signature**:
```python
@when('I upload form data for a specific form instance')
def step_upload_form_data(context):
```

**Implementation Plan**:
1. Reuse helper functions from `api_steps.py`:
   - `_resolve_submission()` - get form submission from fixtures
   - `_resolve_email()` - get user email
   - `_resolve_home_country()` - get home country (default 'US')
   - `_get_ttc_portal_user()` - import TTCPortalUser module
   - `_stub_users_api()` - mock Google App Engine users API
   - `_patch_ttc_portal_user_storage()` - mock GCS storage

2. Import required modules:
   - `from behave import when`
   - `import json`
   - Import helper functions from `api_steps.py`

3. Build payload with:
   - `form_type`: from submission (default 'ttc_application')
   - `form_instance`: from submission (default 'default')
   - `form_data`: JSON string of form field data
   - `form_instance_page_data`: JSON string of page metadata
   - `form_instance_display`: display label
   - `user_home_country_iso`: home country

4. Create TTCPortalUser instance with mocked storage
5. Call `set_form_data()` method
6. Store result in `context.uploaded_form_data` for verification

### 1.2 Step: `Then my form data should be stored for that instance`

**File**: `test/python/steps/user_steps.py`

**Function Signature**:
```python
@then('my form data should be stored for that instance')
def step_form_data_should_be_stored(context):
```

**Implementation Plan**:
1. Get form type and instance from `context.uploaded_form_data`
2. Call `get_form_data(f_type, f_instance)` on the user object
3. Assert that returned data matches the uploaded data
4. Verify metadata fields are set:
   - `is_form_complete`: boolean
   - `is_agreement_accepted`: boolean
   - `is_form_submitted`: boolean
   - `last_update_datetime`: string
   - `form_instance_display`: string
   - `form_instance_page_data`: dict

---

## 2. TypeScript Step Definition Implementation

### 2.1 Step: `When I upload form data for a specific form instance`

**File**: `test/typescript/steps/user_steps.ts`

**Function Signature**:
```typescript
When('I upload form data for a specific form instance', async function () {
  // Implementation
});
```

**Implementation Plan**:
1. Import required modules:
   - `import { When, Then } from '@cucumber/cucumber';`
   - `import assert from 'assert';`
   - Helper functions from `api_steps.ts` (reuse `resolveSubmission`, `buildPayload`)

2. Create shared context object for user form data:
   ```typescript
   const userFormContext: {
     lastUpload?: {
       formType: string;
       formInstance: string;
       formData: Record<string, any>;
     };
     storedData?: Record<string, any>;
   } = {};
   ```

3. Use existing route handler pattern from `api_steps.ts:79-88`:
   - Dynamic import of `app/users/upload-form-data/route`
   - Create POST request with payload
   - Store response status and data in context

### 2.2 Step: `Then my form data should be stored for that instance`

**File**: `test/typescript/steps/user_steps.ts`

**Function Signature**:
```typescript
Then('my form data should be stored for that instance', function () {
  // Implementation
});
```

**Implementation Plan**:
1. Retrieve upload data from context
2. In integration tests: call GET endpoint to verify storage
3. For now: verify response status and basic structure
4. Assert that stored data matches uploaded data

---

## 3. Step Registry Updates

### 3.1 Update Entry for Step 2

**File**: `test/bdd/step-registry.ts:506-511`

**Update to**:
```typescript
'I upload form data for a specific form instance': {
  pattern: /^I\ upload\ form\ data\ for\ a\ specific\ form\ instance$/,
  python: 'test/python/steps/user_steps.py:XX',  // Update line number
  typescript: 'test/typescript/steps/user_steps.ts:XX',  // Update line number
  features: ['specs/features/user/form_data_upload.feature:9'],
}
```

### 3.2 Update Entry for Step 3

**File**: `test/bdd/step-registry.ts:548-553`

**Update to**:
```typescript
'my form data should be stored for that instance': {
  pattern: /^my\ form\ data\ should\ be\ stored\ for\ that\ instance$/,
  python: 'test/python/steps/user_steps.py:XX',  // Update line number
  typescript: 'test/typescript/steps/user_steps.ts:XX',  // Update line number
  features: ['specs/features/user/form_data_upload.feature:10'],
}
```

---

## 4. Test Commands

### 4.1 Python Verification
```bash
# Run specific feature
python -m behave specs/features/user/form_data_upload.feature

# Or via script
npx tsx scripts/bdd/run-python.ts specs/features/user/form_data_upload.feature
```

### 4.2 TypeScript Verification
```bash
# Run specific feature
npx tsx scripts/bdd/run-typescript.ts specs/features/user/form_data_upload.feature
```

### 4.3 Alignment Verification
```bash
npx tsx scripts/bdd/verify-alignment.ts
```

---

## 5. Implementation Order

1. **Update step registry FIRST** with correct line numbers (to be determined after implementation)
2. **Implement Python steps** in `test/python/steps/user_steps.py`
3. **Verify Python passes** - DO NOT proceed until this is true
4. **Implement TypeScript steps** in `test/typescript/steps/user_steps.ts`
5. **Verify TypeScript passes**
6. **Run alignment check** - must pass (0 orphan, 0 dead)
7. **Quality checks** - typecheck and lint

---

## 6. Key Considerations

### 6.1 Reuse Existing Patterns
- Python: Copy helper functions from `api_steps.py` for consistency
- TypeScript: Copy payload building and route import patterns from `api_steps.ts`

### 6.2 Test Data
- Use existing fixture: `test/fixtures/form-submissions.json`
- First submission typically has `form_type: 'ttc_application'`

### 6.3 Mocking Strategy
- Python: Patch `TTCPortalUser.load_user_data` and `save_user_data` to avoid GCS
- Python: Stub `users.get_current_user()` with `StubUser`
- TypeScript: Currently stubs are minimal; verify response status

### 6.4 Differences from api_steps
- `api_steps` tests the `/api/upload-form` endpoint (legacy/internal)
- These steps test the user-facing `/users/upload-form-data` endpoint
- Focus on **data persistence verification**, not just API response

---

## 7. Expected Outcomes

### 7.1 After Implementation
- Feature file `specs/features/user/form_data_upload.feature` passes in both languages
- Step registry has correct line numbers for both implementations
- No orphan or dead steps in alignment check
- Type checking and linting pass

### 7.2 Definition of Done
- [ ] Step registry updated with correct paths
- [ ] Python `when` step implemented and passes
- [ ] Python `then` step implemented and passes
- [ ] Python feature scenario passes
- [ ] TypeScript `when` step implemented and passes
- [ ] TypeScript `then` step implemented and passes
- [ ] TypeScript feature scenario passes
- [ ] Alignment check passes (0 orphan, 0 dead)
- [ ] Typecheck passes
- [ ] Lint passes
