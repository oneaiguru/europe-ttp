# TASK-028: User Config Management - Implementation Plan

## Overview
Implement BDD steps for user configuration management (get and update config) in both Python and TypeScript.

## Step 1: Update Step Registry

**File**: `test/bdd/step-registry.ts`

Update the following entries (currently pointing to line 1 placeholder):

### Entry 1: "I request my user configuration" (line 206-211)
```typescript
'I request my user configuration': {
  pattern: /^I\ request\ my\ user\ configuration$/,
  python: 'test/python/steps/user_steps.py:<NEW_LINE>',
  typescript: 'test/typescript/steps/user_steps.ts:<NEW_LINE>',
  features: ['specs/features/user/config_management.feature:9'],
}
```

### Entry 2: "I should receive my saved configuration" (line 308-313)
```typescript
'I should receive my saved configuration': {
  pattern: /^I\ should\ receive\ my\ saved\ configuration$/,
  python: 'test/python/steps/user_steps.py:<NEW_LINE>',
  typescript: 'test/typescript/steps/user_steps.ts:<NEW_LINE>',
  features: ['specs/features/user/config_management.feature:10'],
}
```

### Entry 3: "I update my user configuration" (line 500-505)
```typescript
'I update my user configuration': {
  pattern: /^I\ update\ my\ user\ configuration$/,
  python: 'test/python/steps/user_steps.py:<NEW_LINE>',
  typescript: 'test/typescript/steps/user_steps.ts:<NEW_LINE>',
  features: ['specs/features/user/config_management.feature:15'],
}
```

### Entry 4: "my configuration should be saved" (line 542-547)
```typescript
'my configuration should be saved': {
  pattern: /^my\ configuration\ should\ be\ saved$/,
  python: 'test/python/steps/user_steps.py:<NEW_LINE>',
  typescript: 'test/typescript/steps/user_steps.ts:<NEW_LINE>',
  features: ['specs/features/user/config_management.feature:16'],
}
```

---

## Step 2: Extend MockTTCPortalUser Class (Python)

**File**: `test/python/steps/user_steps.py`

Add the following methods to the `MockTTCPortalUser` class (after line 79):

```python
def get_config(self):
    """Get user configuration."""
    return self.config

def set_config(self, config_params):
    """Set user configuration parameters."""
    if not isinstance(config_params, dict):
        config_params = json.loads(config_params) if isinstance(config_params, str) else {}

    # Update config with provided params
    for key, value in config_params.items():
        self.config[key] = value

    # Special handling for i_home_country if present
    # (Note: in real implementation, this calls set_home_country,
    # but for testing we just store it in config)
```

---

## Step 3: Implement Python Step Definitions

**File**: `test/python/steps/user_steps.py`

Add the following step definitions after existing steps (append to file):

```python
@when('I request my user configuration')
def request_user_config(context):
    """Request the user's configuration."""
    ttc_user = getattr(context, 'ttc_user', None)
    if ttc_user:
        context.user_config = ttc_user.get_config()
    else:
        context.user_config = {}


@then('I should receive my saved configuration')
def should_receive_saved_config(context):
    """Verify that user configuration is received."""
    assert hasattr(context, 'user_config'), "No configuration was retrieved"
    assert isinstance(context.user_config, dict), "Configuration should be a dictionary"
    # For the get scenario, we expect an empty config initially
    assert context.user_config is not None, "Configuration should not be None"


@when('I update my user configuration')
def update_user_config(context):
    """Update the user's configuration with test data."""
    ttc_user = getattr(context, 'ttc_user', None)
    if ttc_user:
        # Sample config update
        test_config = {'i_home_country': 'IN'}
        ttc_user.set_config(test_config)
        context.last_config_update = test_config
    else:
        context.last_config_update = {}


@then('my configuration should be saved')
def config_should_be_saved(context):
    """Verify that configuration was saved."""
    ttc_user = getattr(context, 'ttc_user', None)
    assert ttc_user is not None, "User should be authenticated"
    assert hasattr(context, 'last_config_update'), "Config should have been updated"

    saved_config = ttc_user.get_config()
    assert saved_config is not None, "Saved config should not be None"
    # Verify the update was persisted
    for key, value in context.last_config_update.items():
        assert saved_config.get(key) == value, f"Config key {key} should be {value}"
```

---

## Step 4: Extend MockTTCPortalUser Class (TypeScript)

**File**: `test/typescript/steps/user_steps.ts`

Add the following methods to the `MockTTCPortalUser` class (after line 86):

```typescript
getConfig(): Record<string, unknown> {
  return this.config;
}

setConfig(configParams: Record<string, unknown> | string): void {
  let params: Record<string, unknown>;

  if (typeof configParams === 'string') {
    params = JSON.parse(configParams);
  } else {
    params = configParams;
  }

  // Update config with provided params
  for (const [key, value] of Object.entries(params)) {
    this.config[key] = value;
  }
}
```

---

## Step 5: Implement TypeScript Step Definitions

**File**: `test/typescript/steps/user_steps.ts`

Add the following step definitions after existing steps (append to file):

```typescript
When('I request my user configuration', function () {
  const ttcUser = (this as any).ttcUser;
  if (ttcUser) {
    (this as any).userConfig = ttcUser.getConfig();
  } else {
    (this as any).userConfig = {};
  }
});

Then('I should receive my saved configuration', function () {
  const userConfig = (this as any).userConfig;
  assert.ok(userConfig, 'No configuration was retrieved');
  assert.ok(typeof userConfig === 'object', 'Configuration should be an object');
  assert.ok(userConfig !== null, 'Configuration should not be null');
});

When('I update my user configuration', function () {
  const ttcUser = (this as any).ttcUser;
  if (ttcUser) {
    const testConfig = { i_home_country: 'IN' };
    ttcUser.setConfig(testConfig);
    (this as any).lastConfigUpdate = testConfig;
  } else {
    (this as any).lastConfigUpdate = {};
  }
});

Then('my configuration should be saved', function () {
  const ttcUser = (this as any).ttcUser;
  assert.ok(ttcUser, 'User should be authenticated');

  const lastUpdate = (this as any).lastConfigUpdate;
  assert.ok(lastUpdate, 'Config should have been updated');

  const savedConfig = ttcUser.getConfig();
  assert.ok(savedConfig, 'Saved config should not be null');

  // Verify the update was persisted
  for (const [key, value] of Object.entries(lastUpdate)) {
    assert.strictEqual(savedConfig[key], value, `Config key ${key} should be ${value}`);
  }
});
```

---

## Step 6: Test Commands

After implementation, run the following tests in order:

### 6.1 Verify Step Registry Alignment
```bash
bun scripts/bdd/verify-alignment.ts
```

### 6.2 Run Python BDD Tests
```bash
bun scripts/bdd/run-python.ts specs/features/user/config_management.feature
```

### 6.3 Run TypeScript BDD Tests
```bash
bun scripts/bdd/run-typescript.ts specs/features/user/config_management.feature
```

### 6.4 Type Check
```bash
bun run typecheck
```

### 6.5 Lint
```bash
bun run lint
```

---

## Test Data

- **Test User Email**: `test.applicant@example.com` (from auth fixtures)
- **Initial Config**: Empty dictionary `{}`
- **Update Config**: `{ i_home_country: 'IN' }`

---

## Implementation Order

1. **Update step registry** (must be first)
2. **Extend Python MockTTCPortalUser class**
3. **Implement Python step definitions**
4. **Verify Python tests pass**
5. **Extend TypeScript MockTTCPortalUser class**
6. **Implement TypeScript step definitions**
7. **Verify TypeScript tests pass**
8. **Run alignment check**
9. **Update coverage matrix and IMPLEMENTATION_PLAN.md**
10. **Remove ACTIVE_TASK.md**

---

## Success Criteria

- [ ] Step registry updated with correct line numbers
- [ ] Python scenario "Get user configuration" passes
- [ ] Python scenario "Update user configuration" passes
- [ ] TypeScript scenario "Get user configuration" passes
- [ ] TypeScript scenario "Update user configuration" passes
- [ ] `verify-alignment.ts` passes (0 orphan, 0 dead)
- [ ] `typecheck` passes
- [ ] `lint` passes
