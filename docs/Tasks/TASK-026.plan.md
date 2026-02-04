# TASK-026 Implementation Plan

## Overview

Implement BDD step definitions for retrieving saved form data in both Python and TypeScript. The steps will test the ability to retrieve previously stored form data, enabling users to continue their applications.

---

## Step 1: Update Step Registry (FIRST)

**File**: `/workspace/test/bdd/step-registry.ts`

### Updates needed:

1. **'I have previously saved form data for a form instance'**
   - Currently: `python: 'test/python/steps/user_steps.py:1'` (placeholder)
   - Update to: `python: 'test/python/steps/user_steps.py:XXX'` (actual line number)
   - Currently: `typescript: 'test/typescript/steps/user_steps.ts:1'` (placeholder)
   - Update to: `typescript: 'test/typescript/steps/user_steps.ts:XXX'` (actual line number)

2. **'I request that form data'**
   - Currently: `python: 'test/python/steps/user_steps.py:1'` (placeholder)
   - Update to: `python: 'test/python/steps/user_steps.py:XXX'` (actual line number)
   - Currently: `typescript: 'test/typescript/steps/user_steps.ts:1'` (placeholder)
   - Update to: `typescript: 'test/typescript/steps/user_steps.ts:XXX'` (actual line number)

3. **'I should receive the stored form data'**
   - Currently: `python: 'test/python/steps/user_steps.py:1'` (placeholder)
   - Update to: `python: 'test/python/steps/user_steps.py:XXX'` (actual line number)
   - Currently: `typescript: 'test/typescript/steps/user_steps.ts:1'` (placeholder)
   - Update to: `typescript: 'test/typescript/steps/user_steps.ts:XXX'` (actual line number)

---

## Step 2: Implement Python Step Definitions

**File**: `/workspace/test/python/steps/user_steps.py`

### Add after line 318 (after the config steps):

```python
# Get Form Data Steps

@given('I have previously saved form data for a form instance')
def step_given_saved_form_data(context):
    """Set up test context with previously saved form data."""
    # Load form submission from fixtures
    submission = _resolve_submission(context)
    form_type = submission.get('form_type', 'ttc_application')
    form_instance = submission.get('form_instance', 'default')
    form_data = submission.get('data', {'i_fname': 'John', 'i_lname': 'Doe'})
    form_instance_page_data = submission.get('form_instance_page_data', {})
    form_instance_display = (
        submission.get('id')
        or submission.get('ttc_option')
        or 'default'
    )

    # Try to use real TTCPortalUser if available, otherwise use mock
    ttc_portal_user_module = _get_ttc_portal_user_module()
    if ttc_portal_user_module:
        try:
            user = ttc_portal_user_module.TTCPortalUser()
            user_email = _resolve_email(context, submission)
            user.load_user_data(user_email)
            user.set_form_data(
                f_type=form_type,
                f_instance=form_instance,
                f_data=form_data,
                f_instance_page_data=form_instance_page_data,
                f_instance_display=form_instance_display
            )
            context.saved_form_user = user
            context.saved_form_type = form_type
            context.saved_form_instance = form_instance
            context.saved_form_data = form_data
            return
        except Exception:
            pass

    # Use mock implementation
    user = MockTTCPortalUser()
    user_email = _resolve_email(context, submission)
    user.load_user_data(user_email)
    user.set_form_data(
        f_type=form_type,
        f_instance=form_instance,
        f_data=form_data,
        f_instance_page_data=form_instance_page_data,
        f_instance_display=form_instance_display
    )
    context.saved_form_user = user
    context.saved_form_type = form_type
    context.saved_form_instance = form_instance
    context.saved_form_data = form_data


@when('I request that form data')
def step_request_form_data(context):
    """Request the previously saved form data."""
    user = getattr(context, 'saved_form_user', None)
    assert user is not None, 'Expected saved_form_user to be set in context'

    form_type = getattr(context, 'saved_form_type', 'ttc_application')
    form_instance = getattr(context, 'saved_form_instance', 'default')

    # Call get_form_data to retrieve the stored data
    retrieved_data = user.get_form_data(form_type, form_instance)
    context.retrieved_form_data = retrieved_data


@then('I should receive the stored form data')
def step_should_receive_stored_data(context):
    """Verify that the retrieved form data matches what was stored."""
    assert hasattr(context, 'retrieved_form_data'), 'Expected retrieved_form_data to be set'
    assert hasattr(context, 'saved_form_data'), 'Expected saved_form_data to be set'

    retrieved = context.retrieved_form_data
    original = context.saved_form_data

    # Verify all fields from original data are in retrieved data
    for key, value in original.items():
        assert key in retrieved, 'Expected key {} to be in retrieved data'.format(key)
        assert retrieved[key] == value, \
            'Expected {} to be {}, got {}'.format(key, value, retrieved[key])
```

---

## Step 3: Verify Python Implementation

**Command**: `python3 -m behave specs/features/user/get_form_data.feature`

**Expected Result**: All 3 steps should pass

---

## Step 4: Implement TypeScript Step Definitions

**File**: `/workspace/test/typescript/steps/user_steps.ts`

### Add after line 300 (after the config steps):

```typescript
// Get Form Data Context
interface GetFormDataContext {
  savedFormUser?: MockTTCPortalUser;
  savedFormType?: string;
  savedFormInstance?: string;
  savedFormData?: Record<string, unknown>;
  retrievedFormData?: Record<string, unknown>;
}

const getFormDataContext: GetFormDataContext = {};

Given('I have previously saved form data for a form instance', async function () {
  const submission = resolveSubmission();
  const formType = submission.form_type ?? 'ttc_application';
  const formInstance = submission.form_instance ?? 'default';
  const formData = submission.data ?? { i_fname: 'John', i_lname: 'Doe' };
  const formInstancePageData = submission.form_instance_page_data ?? {};
  const formInstanceDisplay = submission.id ?? submission.ttc_option ?? 'default';

  // Create mock user and save data
  const user = new MockTTCPortalUser();
  const userEmail = resolveEmail(this, submission);
  user.loadUserData(userEmail);

  user.setFormData(formType, formInstance, formData, formInstancePageData, formInstanceDisplay);

  // Store in context for later steps
  getFormDataContext.savedFormUser = user;
  getFormDataContext.savedFormType = formType;
  getFormDataContext.savedFormInstance = formInstance;
  getFormDataContext.savedFormData = formData;
});

When('I request that form data', async function (this: World) {
  const user = getFormDataContext.savedFormUser;
  assert.ok(user, 'Expected savedFormUser to be set in context');

  const formType = getFormDataContext.savedFormType ?? 'ttc_application';
  const formInstance = getFormDataContext.savedFormInstance ?? 'default';

  // Call getFormData to retrieve the stored data
  const retrievedData = user.getFormData(formType, formInstance);
  assert.ok(retrievedData, 'Expected getFormData to return data');

  // Extract the 'data' field from the stored form structure
  getFormDataContext.retrievedFormData = retrievedData.data ?? {};
});

Then('I should receive the stored form data', function () {
  const retrieved = getFormDataContext.retrievedFormData;
  const original = getFormDataContext.savedFormData;

  assert.ok(retrieved, 'Expected retrievedFormData to be set');
  assert.ok(original, 'Expected savedFormData to be set');

  // Verify all fields from original data are in retrieved data
  for (const [key, value] of Object.entries(original)) {
    assert.ok(key in retrieved, `Expected key ${key} to be in retrieved data`);
    assert.strictEqual(
      retrieved[key],
      value,
      `Expected ${key} to be ${value}, got ${retrieved[key]}`
    );
  }
});
```

---

## Step 5: Verify TypeScript Implementation

**Command**: `bun scripts/bdd/run-typescript.ts specs/features/user/get_form_data.feature`

**Expected Result**: All 3 steps should pass

---

## Step 6: Run Alignment Verification

**Command**: `bun scripts/bdd/verify-alignment.ts`

**Expected Result**:
- 0 orphan steps (steps in registry but not in features)
- 0 dead steps (steps in features but not in registry)
- All 3 new steps should have valid Python and TypeScript paths

---

## Step 7: Quality Checks

**Commands**:
```bash
# Type check
bun run typecheck

# Lint
bun run lint
```

**Expected Result**: No errors

---

## Step 8: Update Documentation

**Files to update**:
1. `/workspace/IMPLEMENTATION_PLAN.md`
   - Change TASK-026 status from 🔴 TODO to ✅ DONE

2. `/workspace/docs/coverage_matrix.md` (if exists)
   - Mark get_form_data.feature as ✓ for TypeScript

---

## Implementation Notes

1. **MockTTCPortalUser Compatibility**:
   - The mock class already implements `get_form_data()` in Python and `getFormData()` in TypeScript
   - No changes needed to the mock classes

2. **Fixture Reuse**:
   - Use existing `/workspace/test/fixtures/form-submissions.json` for test data
   - Reuse `_resolve_submission()` and `resolveEmail()` helper functions

3. **Pattern Consistency**:
   - Follow the same pattern as TASK-025 (form_data_upload)
   - Use context variables to pass data between steps

4. **Data Structure**:
   - `get_form_data()` returns the nested `'data'` field
   - Mock implementation mirrors legacy behavior

---

## Success Criteria

- [ ] Step registry updated with correct line numbers
- [ ] Python steps implemented and pass behave tests
- [ ] TypeScript steps implemented and pass cucumber tests
- [ ] Alignment verification passes (0 orphan, 0 dead)
- [ ] Type check passes
- [ ] Lint passes
- [ ] IMPLEMENTATION_PLAN.md updated
- [ ] Active task removed (docs/Tasks/ACTIVE_TASK.md deleted)
