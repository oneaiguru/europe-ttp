# TASK-FIX-011: Implementation Plan

## Summary
Fix BDD test quality issues in TypeScript step definitions:
1. Remove state mutation from "Then" step (`e2e_api_steps.ts:629`)
2. Replace no-op assertions in `reports_steps.ts` (lines 72, 115)
3. Verify state reset is working (research confirmed it's already correct)

---

## Issue 1: State Mutation in "Then" Step

### Current Code (Line 629-631)
```typescript
Then('the evaluation should count toward the applicant\'s evaluation total', () => {
  testContext.evaluationsCount++;  // ❌ BUG: Mutation in Then step
});
```

### Root Cause Analysis
- The counter is already incremented in the "When" steps (lines 323, 507)
- The "Then" step redundantly increments again, causing:
  - Double counting (count = 2 for one evaluation)
  - Scenarios that depend on assertion side effects

### Fix Strategy
Convert the "Then" step to a proper assertion that verifies the count was incremented:

```typescript
Then('the evaluation should count toward the applicant\'s evaluation total', () => {
  // Assert that an evaluation was recorded
  assert.ok(testContext.evaluations.length > 0, 'At least one evaluation should be recorded');
  // Assert that the counter reflects the evaluations array
  assert.strictEqual(testContext.evaluationsCount, testContext.evaluations.length,
    `Evaluation count (${testContext.evaluationsCount}) should match recorded evaluations (${testContext.evaluations.length})`);
});
```

### Why This Works
- The "When" steps already increment `evaluationsCount` (lines 323, 507)
- The "Then" step now ASSERTS the count is correct instead of mutating it
- The assertion validates consistency between count and array length

### Affected Features
- `specs/features/e2e/evaluation_matching_tolerates_messy_inputs.feature:14`
- `specs/features/e2e/evaluation_matching_tolerates_messy_inputs.feature:28`

---

## Issue 2: No-Op Assertions (reports_steps.ts)

### Location 1: Line 72
**Current:**
```typescript
assert.ok(Array.isArray(Object.keys(world.summaryData)), 'Summary data should be a dictionary');
```

**Problem:** `Object.keys()` ALWAYS returns an array, so this assertion never fails.

**Fix:** Remove the line - the previous assertion on line 69 is sufficient:
```typescript
assert.strictEqual(typeof world.summaryData, 'object', 'Summary data should be an object');
```

If additional validation is needed, check for non-null object:
```typescript
assert.ok(world.summaryData !== null && !Array.isArray(world.summaryData),
  'Summary data should be a dictionary (not an array)');
```

### Location 2: Line 115
**Current:**
```typescript
assert.ok(Array.isArray(Object.keys(world.integrityData)), 'Integrity data should be a dictionary');
```

**Fix:** Same approach - replace with meaningful check or remove if line 112 is sufficient.

---

## Step Registry
No changes needed - step text remains the same.

---

## Test Commands

### 1. TypeScript BDD Tests
```bash
bun scripts/bdd/run-typescript.ts specs/features/e2e/evaluation_matching_tolerates_messy_inputs.feature
```

### 2. Alignment Verification
```bash
bun scripts/bdd/verify-alignment.ts
```
Expected: 0 orphan, 0 dead

### 3. Type Check
```bash
bun run typecheck
```

### 4. Lint
```bash
bun run lint
```

---

## Implementation Order

1. **Fix e2e_api_steps.ts:629** - Remove mutation, add proper assertion
2. **Fix reports_steps.ts:72** - Remove or fix no-op assertion
3. **Fix reports_steps.ts:115** - Remove or fix no-op assertion
4. **Run tests** - Verify all scenarios still pass
5. **Run alignment check** - Confirm no registry issues
6. **Run quality checks** - typecheck and lint

---

## Acceptance Criteria Verification

After implementation, verify:

- [ ] No "Then" step mutates `testContext` or `world` state
- [ ] All assertions are meaningful (no `Array.isArray(Object.keys(...))`)
- [ ] All BDD tests pass (especially evaluation_matching feature)
- [ ] `verify-alignment.ts` passes (0 orphan, 0 dead)
- [ ] `typecheck` passes
- [ ] `lint` passes

---

## References

- Research findings: `docs/Tasks/TASK-FIX-011.research.md`
- Files to modify:
  - `test/typescript/steps/e2e_api_steps.ts` (line 629)
  - `test/typescript/steps/reports_steps.ts` (lines 72, 115)
- Step registry entry: `test/bdd/step-registry.ts:801-806`
