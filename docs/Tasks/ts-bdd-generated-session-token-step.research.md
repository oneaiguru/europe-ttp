# TASK-089: ts-bdd-generated-session-token-step - Research

## Summary

The TypeScript step definition `Given('I generated a session token for {string}')` is **missing** from `test/typescript/steps/auth_steps.ts`. The Python implementation exists as a stub (line 285-288), but the TypeScript version is absent.

The feature file `specs/features/auth/upload_api_auth.feature` line 66 uses `And I generated a session token for "test.applicant@example.com"`.

## Current State

### Feature File Usage
- **File:** `specs/features/auth/upload_api_auth.feature:66`
- **Step text:** `And I generated a session token for "test.applicant@example.com"`
- **Scenario:** "Verify session token with valid signature"

### Python Implementation (Stub)
- **File:** `test/python/steps/auth_steps.py:285-288`
- **Status:** Stub (just `pass`, no-op implementation)
- **Pattern:** `@given('I generated a session token for {string}')`

### TypeScript Implementation (MISSING)
- **File:** `test/typescript/steps/auth_steps.ts`
- **Expected location:** After line 314 (after `Then('the token should have a valid format')`)
- **Status:** NOT IMPLEMENTED

### Step Registry Entry
- **File:** `test/bdd/step-registry.ts:1620-1623`
- **Entry shows:**
  - `python: 'test/python/steps/auth_steps.py:285'` ✓ correct
  - `typescript: 'test/typescript/steps/auth_steps.ts:129'` ✗ WRONG (line 129 is `Given('I am authenticated on the TTC portal')`)

## Related Code (Existing Implementation)

The auth utilities (`app/utils/auth.ts`) already provide:
- `generateSessionToken(email: string, secret: string): string` at line 58
- `verifySessionToken(token: string, secret: string, maxAgeSeconds?: number): string | null` at line 87

The TypeScript auth steps already have similar steps that use these utilities:

**1. `Given('I have a valid session token for {string}')`** (line 165-170)
```typescript
Given('I have a valid session token for {string}', async (email: string) => {
  const auth = await getAuthUtils();
  const secret = process.env.UPLOAD_HMAC_SECRET || 'test-secret-for-hmac-signing';
  const token = auth.generateSessionToken(email, secret);
  authContext.sessionToken = token;
});
```

**2. `When('I generate a session token for {string}')`** (line 277-281)
```typescript
When('I generate a session token for {string}', async (email: string) => {
  const auth = await getAuthUtils();
  const secret = process.env.UPLOAD_HMAC_SECRET || 'test-secret-for-hmac-signing';
  authContext.sessionToken = auth.generateSessionToken(email, secret);
});
```

## Gap Analysis

The difference between the existing steps and the missing step:

| Step Keyword | Existing | Missing |
|--------------|----------|---------|
| `When('I generate a session token for {string}')` | ✓ line 277 | |
| `Given('I generated a session token for {string}')` | | ✗ MISSING |

The feature file (line 66) uses `And I generated a session token for...`, which resolves to a `Given` step (because `And` inherits from the previous step keyword).

## Implementation Notes

1. The missing step should be identical to the existing `When` version at line 277-281, just using `Given` instead of `When`.

2. The implementation should:
   - Lazy-load auth utilities via `getAuthUtils()`
   - Get the secret from `process.env.UPLOAD_HMAC_SECRET` with fallback
   - Call `auth.generateSessionToken(email, secret)`
   - Store result in `authContext.sessionToken`

3. Placement: After line 314 (after `Then('the token should have a valid format')`)

4. After adding the step, the step registry at line 1623 will need the correct line number updated.

## Files to Modify

1. `test/typescript/steps/auth_steps.ts` - Add `Given('I generated a session token for {string}')` step
2. `test/bdd/step-registry.ts` - Update line number for the TypeScript entry (currently wrong at line 129)

## References

- `app/utils/auth.ts:58` - `generateSessionToken()` function
- `test/typescript/steps/auth_steps.ts:277-281` - Similar `When` step to use as template
- `test/typescript/steps/auth_steps.ts:165-170` - Similar `Given` step pattern
- `specs/features/auth/upload_api_auth.feature:64-68` - Scenario that uses the step
