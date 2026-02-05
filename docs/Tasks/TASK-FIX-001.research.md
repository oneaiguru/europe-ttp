# TASK-FIX-001: Research

## Problem Summary

TypeScript compilation fails with 12 type errors across 3 files:

1. `app/api/reports/participant-list/route.ts` - Missing `next/server` module
2. `test/typescript/steps/draft_steps.ts` - World state initialization mismatch
3. `test/typescript/steps/integrity_steps.ts` - Undefined handling issues

## Research Findings

### Issue 1: Missing next/server Module

**Location:** `app/api/reports/participant-list/route.ts:1`

**Root Cause:**
- File imports `NextRequest, NextResponse` from `next/server`
- `next` is NOT in `package.json` dependencies or devDependencies
- This is a stub API route file for future Next.js implementation
- Not currently used by any BDD tests

**Evidence:**
```json
// package.json has no "next" dependency
{
  "devDependencies": {
    "@cucumber/cucumber": "^11.1.0",
    // ... no next.js
  }
}
```

**Solution:** Remove or stub the file since it's not needed for current tests.

---

### Issue 2: World State Initialization Mismatch

**Location:** `test/typescript/steps/draft_steps.ts:15-19`

**Root Cause:**
- File initializes `globalThis.testContext = {}` with empty object
- The expected interface (from `e2e_api_steps.ts:21-78`) requires many properties:
  - `whitelist`, `whitelistGraceExpired`, `evaluations`, `evaluationsCount`
  - `applicantSubmissions`, `applicants`, `graduates`
  - `testModeEnabled`, `userSummary`, `evaluationsList`
  - And more...

**Evidence:**
```typescript
// draft_steps.ts - WRONG (line 18)
if (typeof globalThis.testContext === 'undefined') {
  globalThis.testContext = {};  // Missing all required properties!
}

// e2e_api_steps.ts:84-96 - CORRECT
if (typeof globalThis.testContext === 'undefined') {
  globalThis.testContext = {
    whitelist: [],
    whitelistGraceExpired: false,
    evaluations: [],
    // ... all required properties
  };
}
```

**Solution:** Remove the initialization from `draft_steps.ts` since `e2e_api_steps.ts` already handles it.

---

### Issue 3: Undefined Handling in integrity_steps.ts

**Location:** `test/typescript/steps/integrity_steps.ts`

**Sub-issues:**

a) **Line 122** - Index access with possibly undefined:
```typescript
getIntegrityContext().integrityData[getIntegrityContext().currentEmail]
// currentEmail may be undefined, used as index
```

b) **Line 138** - Array may be undefined:
```typescript
getIntegrityContext().evaluations.push(...)  // evaluations could be undefined
```

c) **Lines 156, 287-290** - evalEntry possibly undefined in iteration
d) **Lines 298, 310, 314** - csvData and rows possibly undefined

**Solution:** Add proper type guards and optional chaining.

## Implementation Plan

### 1. Fix `participant-list/route.ts`
- Delete or stub the file (not used in tests)

### 2. Fix `draft_steps.ts`
- Remove lines 15-19 (empty object initialization)
- Keep usage of `globalThis.testContext` (line 153) since e2e_api_steps initializes properly

### 3. Fix `integrity_steps.ts`
- Line 87-92: Ensure `currentEmail` has a default value
- Line 134: Initialize `evaluations` array properly
- Line 156: Add optional chaining
- Lines 287-290: Add type guard for `evalEntry`
- Lines 298, 310, 314: Add optional chaining and non-null assertions after validation

## Files to Modify

1. `app/api/reports/participant-list/route.ts` - DELETE or comment
2. `test/typescript/steps/draft_steps.ts` - Remove initialization block
3. `test/typescript/steps/integrity_steps.ts` - Add type guards
