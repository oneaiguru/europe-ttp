# TASK-E2E-010B: Research Findings

## Problem Statement
The step `I am authenticated as {string}` is undefined in both Python and TypeScript. The step is used in `specs/features/e2e/home_country_changes_available_ttcs.feature` line 35 and similar features.

## Existing Implementations

### Python Steps (test/python/steps/e2e_api_steps.py)
**Line 43-48**: `I am authenticated as "{role}" with email "{email}"`
```python
@given('I am authenticated as "{role}" with email "{email}"')
def step_auth_as_role(context, role, email):
    """Set the current user context with specified role and email."""
    context.current_user = context.get_user(email) if hasattr(context, 'get_user') else None
    context.current_email = email
    context.current_role = role
```

**Other related patterns:**
- Line 17-22: `I am authenticated as applicant with email "{email}"` - explicitly sets role to 'applicant'
- Line 25-30: `I am authenticated as evaluator with email "{email}"` - explicitly sets role to 'evaluator'
- Line 33-40: `I am authenticated as admin` - no email, hardcodes admin role

### TypeScript Steps (test/typescript/steps/e2e_api_steps.ts)
**Line 167-171**: `I am authenticated as {string} with email {string}`
```typescript
Given('I am authenticated as {string} with email {string}', (role: string, email: string) => {
  testContext.currentUser = getUserByEmail(email);
  testContext.currentEmail = email;
  testContext.currentRole = role;
});
```

**Other related patterns:**
- Line 148-152: `I am authenticated as applicant with email {string}` - explicitly sets role to 'applicant'
- Line 154-158: `I am authenticated as evaluator with email {string}` - explicitly sets role to 'evaluator'
- Line 160-165: `I am authenticated as admin` - no email, gets admin user by role

## Key Differences
The missing step takes **only an email** parameter and needs to **infer the role** from the user data. This differs from the existing step which takes both role and email.

## Test Fixtures

### Python (test/python/support/fixtures.py)
The context has `get_user(email)` method that returns user dict with 'role' field.

### TypeScript (test/typescript/steps/e2e_api_steps.ts)
Line 93-103: `loadTestUsers()` returns array of TestUser with `role` field.
Line 132-134: `getUserByEmail(email)` finds user by email.

## Implementation Notes

### For Python
1. Add new step: `I am authenticated as "{email}"`
2. Use `context.get_user(email)` to get user dict
3. Extract role from user data: `user.get('role')`
4. Set `context.current_email`, `context.current_role`, `context.current_user`

### For TypeScript
1. Add new step: `I am authenticated as {string}`
2. Use existing `getUserByEmail(email)` function
3. Extract role from user data: `user.role`
4. Set `testContext.currentEmail`, `testContext.currentRole`, `testContext.currentUser`

## Step Registry Entry
Already exists at line 755-760 in test/bdd/step-registry.ts but needs:
- `python: 'test/python/steps/e2e_api_steps.py:XX'` (where XX is new line number)
- `typescript: 'test/typescript/steps/e2e_api_steps.ts:XX'` (where XX is new line number)

## Files to Modify
1. `test/python/steps/e2e_api_steps.py` - add step definition after line 48
2. `test/typescript/steps/e2e_api_steps.ts` - add step definition after line 171
3. `test/bdd/step-registry.ts` - update line 757-758 with actual line numbers
