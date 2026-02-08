# TASK-071: fix-ts-bdd-upload-form-auth - Implementation Plan

## Overview
Add the `x-user-email` authentication header to the TypeScript BDD step that submits form data to the upload form API. The API requires this header (added in TASK-059) but the test step doesn't include it.

## Implementation Steps

### Step 1: Import authContext in api_steps.ts
**File**: `test/typescript/steps/api_steps.ts`
**Location**: Line 1 (after existing imports)

Add import:
```typescript
import { authContext } from './auth_steps.js';
```

### Step 2: Add x-user-email header to Request
**File**: `test/typescript/steps/api_steps.ts`
**Location**: Lines 96-98 (headers object)

Change from:
```typescript
headers: {
  'content-type': 'application/json',
},
```

To:
```typescript
headers: {
  'content-type': 'application/json',
  'x-user-email': authContext.currentUser?.email ?? 'test.applicant@example.com',
},
```

The fallback ensures the header is always present even if auth context is unset.

## Verification Commands

```bash
# Run the specific feature file
bun run bdd:typescript specs/features/api/upload_form.feature

# Verify step registry alignment
bun run bdd:verify

# Type check
bun run typecheck

# Lint
bun run lint
```

## Expected Outcomes
- `specs/features/api/upload_form.feature` scenario passes
- No orphan steps in registry
- All verifications pass

## Risks
- **Low risk**: Single line change to add header
- **Rollback**: Remove the `x-user-email` line from headers object

## Dependencies
- None

## Notes
- The feature file already has `Given I am authenticated on the TTC portal` which sets `authContext.currentUser`
- The test-users.json fixture has default email `test.applicant@example.com`
- Using optional chaining and nullish coalescing for defensive coding
