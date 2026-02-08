# TASK-065: ts-then-steps-must-assert - Research

## Overview
Research findings on `Then` steps in TypeScript BDD step definitions that:
1. Have empty implementations (no assertions) - false greens
2. Mutate shared state instead of asserting (should be `Given/When`)

---

## Problem 1: Empty `Then` Steps (No Assertions)

These `Then` steps never fail, creating false green test results.

### test/typescript/steps/e2e_api_steps.ts

**Line 624-627: Empty step**
```typescript
Then('the evaluation should be matched to the applicant', () => {
  // In a real implementation, this would check the matching logic
  // For now, we assume success
});
```
**Issue**: No assertion - always passes.

**Line 642-644: Empty step**
```typescript
Then('the evaluation should be matched via name fallback', () => {
  // Assert fuzzy name matching worked
});
```
**Issue**: No assertion - always passes.

**Line 646-648: Empty step**
```typescript
Then('the evaluation should be matched via fuzzy email matching', () => {
  // Assert fuzzy email matching worked
});
```
**Issue**: No assertion - always passes.

**Line 650-652: Empty step**
```typescript
Then('the error response should indicate grace period expired', () => {
  // Assert grace period expired error
});
```
**Issue**: No assertion - always passes.

**Line 676-678: Empty step**
```typescript
Then('{string} should not be flagged for missing co-teacher feedback', (_email: string) => {
  // Assert not flagged for missing feedback
});
```
**Issue**: No assertion - always passes.

**Line 680-682: Empty step**
```typescript
Then('the summary should show both self-eval and co-teacher feedback', () => {
  // Assert both types present
});
```
**Issue**: No assertion - always passes.

---

## Problem 2: `Then` Steps That Mutate State

These `Then` steps mutate `testContext` instead of asserting outcomes. This violates BDD principles where `Then` steps should only verify results.

### test/typescript/steps/e2e_api_steps.ts

**Line 663-665: Mutates state in `Then`**
```typescript
Then('notification should be sent to {string}', (email: string) => {
  testContext.lastNotification = { to: email, type: 'feedback_request' };
});
```
**Issue**: This sets state rather than verifying that a notification was sent.
**Recommendation**: Either:
1. Move to `When` step and create a separate `Then` that asserts `testContext.lastNotification` has expected values
2. Keep as `Then` but add assertion: `assert.strictEqual(testContext.lastNotification?.to, email)`

**Line 684-691: Mutates state in `Then`**
```typescript
Then('the user summary should show:', (dataTable: DataTable) => {
  const expected: Record<string, string> = {};
  dataTable.rows().forEach((row) => {
    expected[row[0]] = row[1];
  });

  testContext.userSummary = { ...testContext.userSummary, ...expected };
});
```
**Issue**: This modifies `testContext.userSummary` rather than asserting it contains expected values.
**Recommendation**: Assert that `testContext.userSummary` contains the expected key-value pairs.

**Line 703-706: Mutates state in `Then`**
```typescript
Then('only teacher {int} email should be in the evaluator list', (n: number) => {
  // Assert conditional field logic
  testContext.evaluationsList = [`teacher${n}`];
});
```
**Issue**: Sets state instead of verifying the evaluator list.
**Recommendation**: Assert `testContext.evaluationsList` contains exactly one teacher with expected ID.

**Line 708-711: Mutates state in `Then`**
```typescript
Then('teacher 1 and {int} emails should be in the evaluator list', (n: number) => {
  // Assert conditional field logic
  testContext.evaluationsList = ['teacher1', `teacher${n}`];
});
```
**Issue**: Sets state instead of verifying the evaluator list.
**Recommendation**: Assert `testContext.evaluationsList` contains both expected teachers.

---

## Other Files Examined (No Issues Found)

### test/typescript/steps/reports_steps.ts
- All `Then` steps use `assert.ok()`, `assert.strictEqual()`, or similar assertions
- No state mutation in `Then` steps
- Examples: Lines 42-50, 61-72, 84-92, 103-114

### test/typescript/steps/integrity_steps.ts
- All `Then` steps use `assert.ok()` or `assert.strictEqual()`
- One `Then` at line 284 does set `mismatchedEvaluation` but this is for convenience in subsequent assertions (line 287-296)
- Generally well-implemented

### test/typescript/steps/auth_steps.ts
- All `Then` steps use `assert.equal()`, `assert.ok()`
- No state mutation in `Then` steps

### test/typescript/steps/portal_steps.ts
- All `Then` steps use `assert.ok()`
- No state mutation in `Then` steps

### test/typescript/steps/forms_steps.ts
- All `Then` steps use `assert.ok()`
- No state mutation in `Then` steps

### test/typescript/steps/api_steps.ts
- `Then` at line 105-107 uses `assert.equal()`
- No state mutation in `Then` steps

---

## Feature File Usage

The problematic `Then` steps are used in the following feature files:

| Step Pattern | Feature File | Lines |
|--------------|--------------|-------|
| `the evaluation should be matched to the applicant` | `specs/features/e2e/evaluation_matching_tolerates_messy_inputs.feature` | 11, 43 |
| `the evaluation should be matched via name fallback` | `specs/features/e2e/evaluation_matching_tolerates_messy_inputs.feature` | 19 |
| `the evaluation should be matched via fuzzy email matching` | `specs/features/e2e/evaluation_matching_tolerates_messy_inputs.feature` | 27, 35 |
| `the error response should indicate grace period expired` | `specs/features/e2e/deadline_and_whitelist_override.feature` | 34 |
| `{string} should not be flagged for missing co-teacher feedback` | `specs/features/e2e/post_ttc_coteaching_cycle.feature` | 27, 63 |
| `the summary should show both self-eval and co-teacher feedback` | `specs/features/e2e/post_ttc_coteaching_cycle.feature` | 28 |
| `notification should be sent to {string}` | `specs/features/e2e/post_ttc_coteaching_cycle.feature` | 16, 58 |
| `only teacher {int} email should be in the evaluator list` | `specs/features/e2e/dependent_fields_do_not_break_completeness.feature` | 12, 20 |
| `teacher 1 and {int} emails should be in the evaluator list` | `specs/features/e2e/dependent_fields_do_not_break_completeness.feature` | 27, 35 |
| `the user summary should show:` | *(no usage found)* | - |

## Summary Table

| File | Line | Issue | Type | Feature Usage |
|------|------|-------|------|---------------|
| e2e_api_steps.ts | 624-627 | Empty `Then` | No assertion | evaluation_matching_tolerates_messy_inputs.feature |
| e2e_api_steps.ts | 642-644 | Empty `Then` | No assertion | evaluation_matching_tolerates_messy_inputs.feature |
| e2e_api_steps.ts | 646-648 | Empty `Then` | No assertion | evaluation_matching_tolerates_messy_inputs.feature |
| e2e_api_steps.ts | 650-652 | Empty `Then` | No assertion | deadline_and_whitelist_override.feature |
| e2e_api_steps.ts | 676-678 | Empty `Then` | No assertion | post_ttc_coteaching_cycle.feature |
| e2e_api_steps.ts | 680-682 | Empty `Then` | No assertion | post_ttc_coteaching_cycle.feature |
| e2e_api_steps.ts | 663-665 | Mutates `testContext.lastNotification` | State mutation | post_ttc_coteaching_cycle.feature |
| e2e_api_steps.ts | 684-691 | Mutates `testContext.userSummary` | State mutation | *(unused)* |
| e2e_api_steps.ts | 703-706 | Mutates `testContext.evaluationsList` | State mutation | dependent_fields_do_not_break_completeness.feature |
| e2e_api_steps.ts | 708-711 | Mutates `testContext.evaluationsList` | State mutation | dependent_fields_do_not_break_completeness.feature |

---

## Notes

1. **Empty steps**: The 6 empty `Then` steps all have comments indicating what "should" be asserted. These appear to be TODO placeholders that were never completed.

2. **State mutation in `Then`**: The 4 mutating `Then` steps appear to be setting up test data rather than verifying outcomes. This creates a false sense of testing - the tests "pass" but don't actually verify anything.

3. **Impact**: These problematic steps result in scenarios that pass even when the underlying behavior is not implemented or is broken.

4. **testContext structure**: The context fields being mutated are:
   - `testContext.lastNotification`
   - `testContext.userSummary`
   - `testContext.evaluationsList`

5. **Good examples**: Other step files (reports_steps.ts, integrity_steps.ts) demonstrate proper `Then` step patterns using Node's `assert` module.
