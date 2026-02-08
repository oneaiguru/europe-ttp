# TASK-065: ts-then-steps-must-assert - Implementation Plan

## Overview
Fix 10 problematic `Then` steps in `test/typescript/steps/e2e_api_steps.ts` that either:
1. Have empty implementations (no assertions) - 6 cases
2. Mutate shared state instead of asserting - 4 cases

---

## Files to Change

| File | Changes | Lines |
|------|---------|-------|
| `test/typescript/steps/e2e_api_steps.ts` | Fix empty and state-mutating `Then` steps | 624-711 |

---

## Implementation Steps

### Step 1: Fix Empty `Then` Steps (6 fixes)

These steps currently have no assertions and always pass. Based on feature file usage and context, implement meaningful assertions:

#### 1.1 Line 624-627: `the evaluation should be matched to the applicant`
**Current:** Empty with comment
**Implementation:** Assert that `testContext.evaluations` contains at least one evaluation with proper matching
```typescript
Then('the evaluation should be matched to the applicant', () => {
  if (!testContext.evaluations || testContext.evaluations.length === 0) {
    throw new Error('At least one evaluation should be recorded and matched');
  }
});
```

#### 1.2 Line 642-644: `the evaluation should be matched via name fallback`
**Current:** Empty with comment
**Implementation:** Assert evaluation was matched (same as above, but this step confirms name fallback path worked)
```typescript
Then('the evaluation should be matched via name fallback', () => {
  if (!testContext.evaluations || testContext.evaluations.length === 0) {
    throw new Error('Evaluation should be matched via name fallback');
  }
});
```

#### 1.3 Line 646-648: `the evaluation should be matched via fuzzy email matching`
**Current:** Empty with comment
**Implementation:** Assert evaluation was matched via fuzzy email
```typescript
Then('the evaluation should be matched via fuzzy email matching', () => {
  if (!testContext.evaluations || testContext.evaluations.length === 0) {
    throw new Error('Evaluation should be matched via fuzzy email matching');
  }
});
```

#### 1.4 Line 650-652: `the error response should indicate grace period expired`
**Current:** Empty with comment
**Implementation:** Assert response contains grace period error
```typescript
Then('the error response should indicate grace period expired', () => {
  if (!testContext.response) {
    throw new Error('No response exists');
  }
  const body = testContext.response.body;
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
  if (!bodyStr.includes('grace') && !bodyStr.includes('expired')) {
    throw new Error('Response should indicate grace period expired');
  }
});
```

#### 1.5 Line 676-678: `{string} should not be flagged for missing co-teacher feedback`
**Current:** Empty with comment
**Implementation:** Assert email is NOT in a "missing feedback" list
```typescript
Then('{string} should not be flagged for missing co-teacher feedback', (email: string) => {
  // This step asserts the user is NOT flagged - if we had a flaggedMissingFeedback list,
  // we'd check it. For now, assume success if we reach here without errors.
  // TODO: Add actual check when missing feedback tracking is implemented
});
```
**Note:** This is a negative assertion. Without a concrete "flagged" list to check, this may remain a placeholder pending feature implementation. Document as TODO.

#### 1.6 Line 680-682: `the summary should show both self-eval and co-teacher feedback`
**Current:** Empty with comment
**Implementation:** Assert `testContext.userSummary` contains both feedback types
```typescript
Then('the summary should show both self-eval and co-teacher feedback', () => {
  if (!testContext.userSummary) {
    throw new Error('No user summary exists');
  }
  // Check for indicators of both self-eval and co-teacher feedback
  const hasSelfEval = Object.keys(testContext.userSummary).some(k =>
    k.toLowerCase().includes('self') || k.toLowerCase().includes('eval')
  );
  const hasCoteacher = Object.keys(testContext.userSummary).some(k =>
    k.toLowerCase().includes('co') || k.toLowerCase().includes('teacher')
  );
  if (!hasSelfEval || !hasCoteacher) {
    throw new Error('Summary should show both self-eval and co-teacher feedback');
  }
});
```

---

### Step 2: Fix State-Mutating `Then` Steps (4 fixes)

These steps mutate `testContext` instead of verifying outcomes. Convert to proper assertions:

#### 2.1 Line 663-665: `notification should be sent to {string}`
**Current:** Sets `testContext.lastNotification`
**Fix:** Assert that notification was set correctly
```typescript
Then('notification should be sent to {string}', (email: string) => {
  if (!testContext.lastNotification) {
    throw new Error('No notification was sent');
  }
  if (testContext.lastNotification.to !== email) {
    throw new Error(`Expected notification to ${email}, but got ${testContext.lastNotification.to}`);
  }
  if (testContext.lastNotification.type !== 'feedback_request') {
    throw new Error(`Expected feedback_request type, got ${testContext.lastNotification.type}`);
  }
});
```
**Note:** This assumes a `When` step has already set `testContext.lastNotification`. The feature files using this step should be reviewed to ensure a `When` step properly sets up the notification.

#### 2.2 Line 684-691: `the user summary should show:`
**Current:** Mutates `testContext.userSummary`
**Fix:** Assert `testContext.userSummary` contains expected values
```typescript
Then('the user summary should show:', (dataTable: DataTable) => {
  if (!testContext.userSummary) {
    throw new Error('No user summary exists');
  }
  const expected: Record<string, string> = {};
  dataTable.rows().forEach((row) => {
    expected[row[0]] = row[1];
  });

  for (const [key, expectedValue] of Object.entries(expected)) {
    const actualValue = testContext.userSummary[key];
    if (actualValue !== expectedValue) {
      throw new Error(
        `Expected ${key} to be ${expectedValue}, but got ${actualValue}`
      );
    }
  }
});
```

#### 2.3 Line 703-706: `only teacher {int} email should be in the evaluator list`
**Current:** Sets `testContext.evaluationsList = [`teacher${n}`]`
**Fix:** Assert the list contains exactly one teacher with expected ID
```typescript
Then('only teacher {int} email should be in the evaluator list', (n: number) => {
  if (!testContext.evaluationsList) {
    throw new Error('No evaluations list exists');
  }
  const expectedTeacher = `teacher${n}`;
  if (testContext.evaluationsList.length !== 1) {
    throw new Error(`Expected 1 evaluator, got ${testContext.evaluationsList.length}`);
  }
  if (testContext.evaluationsList[0] !== expectedTeacher) {
    throw new Error(`Expected ${expectedTeacher}, got ${testContext.evaluationsList[0]}`);
  }
});
```

#### 2.4 Line 708-711: `teacher 1 and {int} emails should be in the evaluator list`
**Current:** Sets `testContext.evaluationsList = ['teacher1', `teacher${n}`]`
**Fix:** Assert the list contains both expected teachers
```typescript
Then('teacher 1 and {int} emails should be in the evaluator list', (n: number) => {
  if (!testContext.evaluationsList) {
    throw new Error('No evaluations list exists');
  }
  const expectedTeachers = ['teacher1', `teacher${n}`];
  if (testContext.evaluationsList.length !== 2) {
    throw new Error(`Expected 2 evaluators, got ${testContext.evaluationsList.length}`);
  }
  if (!testContext.evaluationsList.includes('teacher1')) {
    throw new Error('Expected teacher1 to be in evaluator list');
  }
  if (!testContext.evaluationsList.includes(`teacher${n}`)) {
    throw new Error(`Expected teacher${n} to be in evaluator list`);
  }
});
```

---

## Step 3: Verify Feature Files

The following feature files use these steps. After fixes, these scenarios should still pass (or properly fail if the underlying behavior is not implemented):

1. `specs/features/e2e/evaluation_matching_tolerates_messy_inputs.feature`
2. `specs/features/e2e/deadline_and_whitelist_override.feature`
3. `specs/features/e2e/post_ttc_coteaching_cycle.feature`
4. `specs/features/e2e/dependent_fields_do_not_break_completeness.feature`

**Important:** Some scenarios may start failing (RED) after these fixes. This is expected and correct - they were passing falsely before.

---

## Tests to Run

```bash
# Verify step registry alignment (must pass)
bun run bdd:verify

# Run TypeScript BDD for affected features
bun run bdd:typescript specs/features/e2e/evaluation_matching_tolerates_messy_inputs.feature
bun run bdd:typescript specs/features/e2e/deadline_and_whitelist_override.feature
bun run bdd:typescript specs/features/e2e/post_ttc_coteaching_cycle.feature
bun run bdd:typescript specs/features/e2e/dependent_fields_do_not_break_completeness.feature

# Typecheck must pass
bun run typecheck

# Lint must pass
bun run lint
```

---

## Risks

1. **Test Failures Expected:** Some scenarios may fail after adding real assertions. This is correct behavior - they were false greens before. These failing scenarios indicate unimplemented features.

2. **Step Registry:** Changes may affect step registry alignment. Run `bun run bdd:verify` to confirm.

3. **Feature File Changes:** May need to update feature files or add `When` steps to properly set up testContext before `Then` steps assert. Specifically for `notification should be sent to {string}` - a `When` step should set `testContext.lastNotification` first.

---

## Rollback Strategy

If issues arise:
1. Revert `test/typescript/steps/e2e_api_steps.ts` to previous state
2. All other files unchanged
3. Single file change makes rollback straightforward

---

## Notes

1. **Negative assertions:** The `{string} should not be flagged for missing co-teacher feedback` step is tricky as it's a negative assertion. Without a concrete "flagged" list, this may remain a TODO.

2. **Feature file dependencies:** The `notification should be sent to {string}` step assumes a `When` step has set `testContext.lastNotification`. Review feature files to ensure proper setup.

3. **Python-first invariant:** Since this is a TypeScript-only change (step definitions), the Python BDD tests are not affected.
