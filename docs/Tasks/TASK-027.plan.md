# TASK-027: User Get Form Instances - Implementation Plan

## Overview
Implement BDD steps for the `/users/get-form-instances` API endpoint that returns a list of form instances for a given form type, excluding the 'default' instance.

---

## Phase 1: Update Step Registry

### File: `test/bdd/step-registry.ts`

**Action**: Update the three placeholder entries (lines 56-64) with correct line numbers after implementation.

**Current State**:
```typescript
'I have multiple form instances for a form type': {
  pattern: /^I\ have\ multiple\ form\ instances\ for\ a\ form\ type$/,
  python: 'test/python/steps/user_steps.py:1',  // TODO: update after impl
  typescript: 'test/typescript/steps/user_steps.ts:1',  // TODO: update
  features: ['specs/features/user/get_form_instances.feature:8'],
},
```

**Post-Implementation State**: Update with actual line numbers from implementation.

---

## Phase 2: Python Implementation

### Step 2.1: Add `get_form_instances` Method to MockTTCPortalUser

**File**: `test/python/steps/user_steps.py`
**Location**: After `get_config` method (after line 92)

**Method to Add**:
```python
def get_form_instances(self, f_type):
    """Get all form instances for a form type, excluding 'default'.

    Args:
        f_type: The form type (e.g., 'ttc_application')

    Returns:
        Dictionary of instances with page_data and display info.
    """
    _form_instances = {}
    if f_type in self.form_data:
        for instance_id in self.form_data[f_type]:
            if instance_id != 'default':
                _form_instances[instance_id] = {
                    'page_data': self.form_data[f_type][instance_id].get(
                        'form_instance_page_data', {}
                    ),
                    'display': self.form_data[f_type][instance_id].get(
                        'form_instance_display', instance_id
                    )
                }
    return _form_instances
```

### Step 2.2: Implement Python BDD Steps

**File**: `test/python/steps/user_steps.py`
**Location**: After existing step definitions (find good location after line 300+)

**Step 1: Given I have multiple form instances for a form type**
```python
@given('I have multiple form instances for a form type')
def step_multiple_form_instances(context):
    """Set up a user with multiple form instances for testing."""
    _ttc_user = _get_ttc_portal_user_module()
    if _ttc_user:
        user = _ttc_user.TTCPortalUser()
    else:
        user = MockTTCPortalUser()

    user.load_user_data('test.applicant@example.com')

    # Set up multiple form instances for ttc_application
    user.set_form_data(
        'ttc_application',
        'test_us_future',
        {'i_fname': 'John', 'i_lname': 'Doe', 'i_email': 'john@example.com'},
        {'dates': 'Jan 2025', 'country': 'US'},
        'US TTC - January 2025'
    )

    user.set_form_data(
        'ttc_application',
        'test_india_future',
        {'i_fname': 'Jane', 'i_lname': 'Smith', 'i_email': 'jane@example.com'},
        {'dates': 'Feb 2025', 'country': 'IN'},
        'India TTC - February 2025'
    )

    context.user = user
    context.form_type = 'ttc_application'
```

**Step 2: When I request the list of form instances**
```python
@when('I request the list of form instances')
def step_request_form_instances(context):
    """Request the list of form instances for the stored form type."""
    context.form_instances = context.user.get_form_instances(context.form_type)
```

**Step 3: Then I should receive the available form instances**
```python
@then('I should receive the available form instances')
def step_receive_form_instances(context):
    """Verify that form instances are returned correctly."""
    assert isinstance(context.form_instances, dict), \
        "Form instances should be a dictionary"

    # Verify 'default' is excluded
    assert 'default' not in context.form_instances, \
        "'default' instance should not be in the results"

    # Verify we have the expected instances
    assert 'test_us_future' in context.form_instances, \
        "test_us_future instance should be present"
    assert 'test_india_future' in context.form_instances, \
        "test_india_future instance should be present"

    # Verify structure of each instance
    for instance_id, instance_data in context.form_instances.items():
        assert 'page_data' in instance_data, \
            f"Instance {instance_id} should have 'page_data'"
        assert 'display' in instance_data, \
            f"Instance {instance_id} should have 'display'"

    # Verify specific values
    assert context.form_instances['test_us_future']['display'] == 'US TTC - January 2025'
    assert context.form_instances['test_us_future']['page_data']['country'] == 'US'
    assert context.form_instances['test_india_future']['display'] == 'India TTC - February 2025'
    assert context.form_instances['test_india_future']['page_data']['country'] == 'IN'
```

---

## Phase 3: TypeScript Implementation

### Step 3.1: Add `getFormInstances` Method to MockTTCPortalUser

**File**: `test/typescript/steps/user_steps.ts`
**Location**: After `setConfig` method (after line 106)

**Method to Add**:
```typescript
getFormInstances(formType: string): Record<string, { page_data: Record<string, unknown>; display: string }> {
  /** Get all form instances for a form type, excluding 'default'. */
  const formInstances: Record<string, { page_data: Record<string, unknown>; display: string }> = {};

  if (this.formData[formType]) {
    for (const instanceId in this.formData[formType]) {
      if (instanceId !== 'default') {
        const instance = this.formData[formType][instanceId];
        formInstances[instanceId] = {
          page_data: instance.form_instance_page_data,
          display: instance.form_instance_display,
        };
      }
    }
  }

  return formInstances;
}
```

### Step 3.2: Implement TypeScript BDD Steps

**File**: `test/typescript/steps/user_steps.ts`
**Location**: After existing step definitions

**Step 1: Given I have multiple form instances for a form type**
```typescript
Given('I have multiple form instances for a form type', function () {
  const user = new MockTTCPortalUser();
  user.loadUserData('test.applicant@example.com');

  // Set up multiple form instances for ttc_application
  user.setFormData(
    'ttc_application',
    'test_us_future',
    { i_fname: 'John', i_lname: 'Doe', i_email: 'john@example.com' },
    { dates: 'Jan 2025', country: 'US' },
    'US TTC - January 2025'
  );

  user.setFormData(
    'ttc_application',
    'test_india_future',
    { i_fname: 'Jane', i_lname: 'Smith', i_email: 'jane@example.com' },
    { dates: 'Feb 2025', country: 'IN' },
    'India TTC - February 2025'
  );

  userFormContext.user = user;
  userFormContext.formType = 'ttc_application';
});
```

**Step 2: When I request the list of form instances**
```typescript
When('I request the list of form instances', function () {
  if (!userFormContext.user) {
    throw new Error('User not initialized');
  }
  userFormContext.formInstances = userFormContext.user.getFormInstances(
    userFormContext.formType as string
  );
});
```

**Step 3: Then I should receive the available form instances**
```typescript
Then('I should receive the available form instances', function () {
  assert.ok(userFormContext.formInstances, 'Form instances should be defined');
  assert.ok(typeof userFormContext.formInstances === 'object', 'Form instances should be an object');

  const instances = userFormContext.formInstances as Record<string, unknown>;

  // Verify 'default' is excluded
  assert.ok(!('default' in instances), "'default' instance should not be in the results");

  // Verify we have the expected instances
  assert.ok('test_us_future' in instances, 'test_us_future instance should be present');
  assert.ok('test_india_future' in instances, 'test_india_future instance should be present');

  // Verify structure
  const usInstance = instances.test_us_future as Record<string, unknown>;
  const indiaInstance = instances.test_india_future as Record<string, unknown>;

  assert.ok('page_data' in usInstance, 'US instance should have page_data');
  assert.ok('display' in usInstance, 'US instance should have display');
  assert.equal(usInstance.display, 'US TTC - January 2025');

  const usPageData = usInstance.page_data as Record<string, unknown>;
  assert.equal(usPageData.country, 'US');

  assert.ok('page_data' in indiaInstance, 'India instance should have page_data');
  assert.ok('display' in indiaInstance, 'India instance should have display');
  assert.equal(indiaInstance.display, 'India TTC - February 2025');

  const indiaPageData = indiaInstance.page_data as Record<string, unknown>;
  assert.equal(indiaPageData.country, 'IN');
});
```

---

## Phase 4: Verification

### Step 4.1: Update TypeScript Context Interface

**File**: `test/typescript/steps/user_steps.ts`
**Location**: Update `UserFormContext` interface (around line 109)

**Add to Interface**:
```typescript
interface UserFormContext {
  lastUpload?: {
    formType: string;
    formInstance: string;
    formData: Record<string, unknown>;
    formInstanceDisplay: string;
    formInstancePageData: Record<string, unknown>;
    user: MockTTCPortalUser;
  };
  user?: MockTTCPortalUser;
  formType?: string;
  formInstances?: Record<string, { page_data: Record<string, unknown>; display: string }>;
}
```

### Step 4.2: Test Commands

**Run Python BDD Tests**:
```bash
bun scripts/bdd/run-python.ts specs/features/user/get_form_instances.feature
```

**Expected Result**: All 3 steps pass, scenario passes.

**Run TypeScript BDD Tests**:
```bash
bun scripts/bdd/run-typescript.ts specs/features/user/get_form_instances.feature
```

**Expected Result**: All 3 steps pass, scenario passes.

**Run Alignment Verification**:
```bash
bun scripts/bdd/verify-alignment.ts
```

**Expected Result**:
- 0 orphan steps
- 0 dead steps
- All three steps have valid Python and TypeScript paths

---

## Phase 5: Update Step Registry (Final)

### File: `test/bdd/step-registry.ts`

After implementing the steps, update the line numbers:

1. Find actual line numbers in `test/python/steps/user_steps.py` for each step
2. Find actual line numbers in `test/typescript/steps/user_steps.ts` for each step
3. Update the registry entries

**Example**:
```typescript
'I have multiple form instances for a form type': {
  pattern: /^I\ have\ multiple\ form\ instances\ for\ a\ form\ type$/,
  python: 'test/python/steps/user_steps.py:125',  // actual line
  typescript: 'test/typescript/steps/user_steps.ts:180',  // actual line
  features: ['specs/features/user/get_form_instances.feature:8'],
},
```

---

## Phase 6: Quality Checks

### Type Check
```bash
bun run typecheck
```

### Lint
```bash
bun run lint
```

---

## Summary

### Files to Modify
1. `test/python/steps/user_steps.py` - Add method + 3 step definitions
2. `test/typescript/steps/user_steps.ts` - Add method + 3 step definitions
3. `test/bdd/step-registry.ts` - Update line numbers

### Key Implementation Details

1. **Method Logic**: Simple iteration over `form_data[f_type]`, filtering out 'default'
2. **Data Structure**: Returns `{instance_id: {page_data, display}}`
3. **Test Data**: Uses two TTC instances (US and India) for comprehensive testing
4. **Assertions**: Verify structure, exclusion of 'default', and correct values

### Success Criteria
- [ ] Python scenario passes
- [ ] TypeScript scenario passes
- [ ] Alignment check passes (0 orphan, 0 dead)
- [ ] Type check passes
- [ ] Lint passes
- [ ] Step registry updated with correct line numbers
