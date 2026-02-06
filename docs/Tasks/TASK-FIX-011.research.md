# TASK-FIX-011: Research Document

## Summary
This task addresses BDD test quality issues in TypeScript step definitions, specifically:
1. State mutation in "Then" steps (anti-pattern)
2. No-op assertions that always pass
3. State reset verification between scenarios

---

## Issue 1: State Mutation in "Then" Steps

### Location
**File:** `test/typescript/steps/e2e_api_steps.ts:629-631`

```typescript
Then('the evaluation should count toward the applicant\'s evaluation total', () => {
  testContext.evaluationsCount++;  // ❌ BUG: Mutation in Then step
});
```

### Analysis
- **Step Type:** `Then` (Assertion step)
- **Issue:** Increments `testContext.evaluationsCount`
- **Why it's wrong:** "Then" steps should only ASSERT state, never mutate it
- **Impact:**
  - Scenarios that depend on the assertion to also change state
  - Test failures that don't reproduce when assertions are reordered
  - Difficulty debugging because state changes happen during verification

### Feature Usage
From step registry (`test/bdd/step-registry.ts:801-806`):
```typescript
'the evaluation should count toward the applicant\'s evaluation total': {
  pattern: /^the\ evaluation\ should\ count\ toward\ the\ applicant's\ evaluation\ total$/,
  python: 'test/python/steps/e2e_api_steps.py:1',
  typescript: 'test/typescript/steps/e2e_api_steps.ts:1',
  features: ['specs/features/e2e/evaluation_matching_tolerates_messy_inputs.feature:14', 'specs/features/e2e/evaluation_matching_tolerates_messy_inputs.feature:28'],
],
```

### Related "When" Steps (Correct Pattern)
The counter IS properly incremented in "When" steps:
- Line 323: Inside `When('I submit TTC evaluation for {string} with:', ...)` - ✅ Correct
- Line 507: Inside `When('evaluator submits evaluation with candidate email {string} for applicant {string}', ...)` - ✅ Correct

---

## Issue 2: No-Op Assertions

### Location 1
**File:** `test/typescript/steps/reports_steps.ts:72`

```typescript
assert.ok(Array.isArray(Object.keys(world.summaryData)), 'Summary data should be a dictionary');
```

**Problem:** `Object.keys()` ALWAYS returns an array, so `Array.isArray(Object.keys(...))` is always `true`.

### Location 2
**File:** `test/typescript/steps/reports_steps.ts:115`

```typescript
assert.ok(Array.isArray(Object.keys(world.integrityData)), 'Integrity data should be a dictionary');
```

**Problem:** Same no-op assertion.

### Why These Are No-Ops
```javascript
Object.keys({})        // → []
Object.keys([])        // → []
Object.keys(null)      // → TypeError (but caught by earlier assertion)
Object.keys(undefined) // → TypeError (but caught by earlier assertion)
Array.isArray([])      // → true
Array.isArray([1,2])   // → true
```

The assertion `Array.isArray(Object.keys(obj))` will ALWAYS be `true` if `Object.keys()` succeeds.

### Correct Approach
Either:
1. Check that the object is actually an object (not array, not null): `typeof obj === 'object' && obj !== null && !Array.isArray(obj)`
2. Or check for specific expected keys/structure

The earlier assertion on line 69 already does: `assert.strictEqual(typeof world.summaryData, 'object', 'Summary data should be an object');`

This is sufficient - the line 72 assertion adds no value.

---

## Issue 3: State Reset Between Scenarios

### Current Implementation
**File:** `test/typescript/steps/e2e_api_steps.ts:106-132`

```typescript
Before(() => {
  // Reset the test context properties without replacing the object
  // This ensures the const testContext reference remains valid
  testContext.whitelist = [];
  testContext.whitelistGraceExpired = false;
  testContext.evaluations = [];
  testContext.evaluationsCount = 0;
  testContext.applicantSubmissions = {};
  testContext.applicants = {};
  testContext.graduates = {};
  testContext.testModeEnabled = true;
  testContext.userSummary = {};
  testContext.evaluationsList = [];
  // Clear optional properties
  delete testContext.currentEmail;
  delete testContext.currentRole;
  delete testContext.currentUser;
  delete testContext.currentTtcOption;
  delete testContext.lastSubmission;
  delete testContext.response;
  delete testContext.homeCountry;
  delete testContext.whitelistTargetEmail;
  delete testContext.currentPage;
  delete testContext.numEvaluators;
  delete testContext.requestedReportEmail;
  delete testContext.lastNotification;
});
```

### Analysis
- The `Before` hook properly resets all test context properties
- ✅ State reset is correctly implemented
- No additional changes needed for Issue 3

---

## Implementation Notes

### Files to Modify
1. **test/typescript/steps/e2e_api_steps.ts**
   - Line 629-631: Remove state mutation, convert to proper assertion

2. **test/typescript/steps/reports_steps.ts**
   - Line 72: Replace no-op assertion with meaningful check
   - Line 115: Replace no-op assertion with meaningful check

### Step Registry
No step text changes are needed, so the step registry does not need updates.

### Testing Strategy
- Run TypeScript BDD: `bun scripts/bdd/run-typescript.ts specs/features/`
- Verify alignment: `bun scripts/bdd/verify-alignment.ts`
- Run typecheck: `bun run typecheck`
- Run lint: `bun run lint`

---

## References
- Step registry: `test/bdd/step-registry.ts:801-806` (for evaluation count step)
- Feature files using the buggy step:
  - `specs/features/e2e/evaluation_matching_tolerates_messy_inputs.feature:14`
  - `specs/features/e2e/evaluation_matching_tolerates_messy_inputs.feature:28`
