# TASK-089: ts-bdd-generated-session-token-step - Implementation Plan

## Overview
Add the missing TypeScript BDD step definition `Given('I generated a session token for {string}')` to match the feature file requirements and align with the Python stub.

## Implementation Steps

### Step 1: Add the Given step to `test/typescript/steps/auth_steps.ts`

**Location:** After line 314 (after `Then('the token should have a valid format')`)

**Implementation:** Copy the pattern from the existing `When('I generate a session token for {string}')` step at lines 277-281, but use `Given` as the step keyword:

```typescript
Given('I generated a session token for {string}', async (email: string) => {
  const auth = await getAuthUtils();
  const secret = process.env.UPLOAD_HMAC_SECRET || 'test-secret-for-hmac-signing';
  authContext.sessionToken = auth.generateSessionToken(email, secret);
});
```

### Step 2: Verify the step registry

The step registry `test/bdd/step-registry.ts` has an incorrect line number (129) for this step. After adding the step, run `bun scripts/bdd/verify-alignment.ts` to auto-update the registry with the correct line number.

**Note:** The step registry at lines 1620-1623 will need to be updated. The verification script should detect and fix this automatically.

## Files to Change

1. **`test/typescript/steps/auth_steps.ts`**
   - Add `Given('I generated a session token for {string}')` step definition after line 314

2. **`test/bdd/step-registry.ts`** (auto-updated by verification script)
   - Line 1623 will be updated with the correct line number

## Test Commands

```bash
# Run the specific feature file to verify the step works
bun run bdd:typescript specs/features/auth/upload_api_auth.feature

# Verify no orphan steps exist
bun run bdd:verify

# Type check
bun run typecheck
```

## Risks / Rollback

| Risk | Mitigation |
|------|------------|
| Step name conflict with existing steps | The pattern is unique (`Given` with "generated" past tense vs `When` with "generate" present tense) |
| Registry misalignment | The `bun run bdd:verify` script will detect and report any issues |
| Breaking existing tests | The step is only used in one scenario (line 66 of upload_api_auth.feature) |

**Rollback:** If issues occur, simply delete the added step definition from `auth_steps.ts`.

## Success Criteria

- [ ] `Given('I generated a session token for {string}')` exists in `test/typescript/steps/auth_steps.ts`
- [ ] Step generates valid session token and stores in `authContext.sessionToken`
- [ ] `bun run bdd:typescript specs/features/auth/upload_api_auth.feature` passes
- [ ] `bun run bdd:verify` passes with no orphan steps
- [ ] `bun run typecheck` passes
