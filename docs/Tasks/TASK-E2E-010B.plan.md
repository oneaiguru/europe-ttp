# TASK-E2E-010B: Implementation Plan

## Overview
Implement `I am authenticated as {string}` step definition in both Python and TypeScript to support authentication by email only with role inference from user data.

## Step 1: Update Step Registry (FIRST)
File: `test/bdd/step-registry.ts`

Update lines 757-758:
```typescript
python: 'test/python/steps/e2e_api_steps.py:51',  // After line 48 (after step_auth_as_role)
typescript: 'test/typescript/steps/e2e_api_steps.ts:174',  // After line 171 (after step_auth_as_role with email)
```

## Step 2: Implement Python Step Definition
File: `test/python/steps/e2e_api_steps.py`

Add after line 48 (after `step_auth_as_role` function):
```python
@given('I am authenticated as "{email}"')
def step_auth_by_email(context, email):
    """Set the current user context by email, inferring role from user data."""
    user = context.get_user(email) if hasattr(context, 'get_user') else None
    if user:
        context.current_user = user
        context.current_email = email
        context.current_role = user.get('role', 'applicant')
    else:
        # Fallback if no user found
        context.current_email = email
        context.current_role = 'applicant'
        context.current_user = None
```

## Step 3: Verify Python Implementation
Run Python BDD tests to confirm step is defined:
```bash
npx tsx scripts/bdd/run-python.ts specs/features/e2e/home_country_changes_available_ttcs.feature
```

**Expected**: Step should be recognized (no "Undefined" error). May still fail if TTC fixtures are missing.

## Step 4: Implement TypeScript Step Definition
File: `test/typescript/steps/e2e_api_steps.ts`

Add after line 171 (after `I am authenticated as {string} with email {string}`):
```typescript
Given('I am authenticated as {string}', (email: string) => {
  const user = getUserByEmail(email);
  if (user) {
    testContext.currentUser = user;
    testContext.currentEmail = email;
    testContext.currentRole = user.role;
  } else {
    // Fallback if no user found
    testContext.currentEmail = email;
    testContext.currentRole = 'applicant';
    testContext.currentUser = undefined;
  }
});
```

Also add test users for CA and IN to `loadTestUsers()` function (after line 101):
```typescript
{ email: 'test.applicant.ca@example.com', role: 'applicant', home_country: 'CA', name: 'Test Applicant Canada' },
{ email: 'test.applicant.in@example.com', role: 'applicant', home_country: 'IN', name: 'Test Applicant India' },
```

Add TTC options for CA and IN to `loadTestTTCOptions()` function (after line 121):
```typescript
{
  value: 'test_ca_future',
  display: 'Test TTC (Future) - Canada',
  display_until: '2027-12-31 23:59:59',
  display_countries: ['CA'],
  display_data: { country: 'Canada', venue: 'Test Venue, Canada', fees: '$4500 CAD' },
},
{
  value: 'test_in_future',
  display: 'Test TTC (Future) - India',
  display_until: '2027-12-31 23:59:59',
  display_countries: ['IN'],
  display_data: { country: 'India', venue: 'Test Venue, India', fees: '₹150000 INR' },
},
{
  value: 'test_multi_country',
  display: 'Test TTC (Multi-Country)',
  display_until: '2027-12-31 23:59:59',
  display_countries: ['US', 'CA'],
  display_data: { country: 'Multi', venue: 'Test Venue, Multi', fees: 'Varies' },
},
```

## Step 5: Verify TypeScript Implementation
Run TypeScript BDD tests:
```bash
npx tsx scripts/bdd/run-typescript.ts specs/features/e2e/home_country_changes_available_ttcs.feature
```

**Expected**: All scenarios should pass (4 scenarios, 13 steps).

## Step 6: Run Alignment Check
```bash
npx tsx scripts/bdd/verify-alignment.ts
```

**Expected**: 0 orphan steps, 0 dead steps.

## Step 7: Update IMPLEMENTATION_PLAN.md
Mark the task as complete or in progress.

## Test Commands Summary
```bash
# Alignment check
npx tsx scripts/bdd/verify-alignment.ts

# Python tests
npx tsx scripts/bdd/run-python.ts specs/features/e2e/home_country_changes_available_ttcs.feature

# TypeScript tests
npx tsx scripts/bdd/run-typescript.ts specs/features/e2e/home_country_changes_available_ttcs.feature
```

## Success Criteria
- [ ] Step registry updated with correct line numbers
- [ ] Python step definition added and tests pass
- [ ] TypeScript step definition added and tests pass
- [ ] Missing TTC fixtures (CA, IN, multi-country) added
- [ ] Alignment check passes (0 orphan, 0 dead)
- [ ] ACTIVE_TASK.md removed
