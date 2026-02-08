# TASK-080: tighten-ts-bdd-step-assertions - Research

## Goal
Add meaningful assertions to TypeScript BDD steps that currently lack proper validation or have tautological/weak assertions, ensuring test failures are detected.

## Files Analyzed

### Primary Files from Task Refs
1. `test/typescript/steps/uploads_steps.ts`
2. `test/typescript/steps/form_prerequisites_steps.ts`
3. `test/typescript/steps/e2e_api_steps.ts`

### Additional Files Reviewed for Comprehensive Coverage
4. `test/typescript/steps/integrity_steps.ts`
5. `test/typescript/steps/forms_steps.ts`
6. `test/typescript/steps/reports_steps.ts`
7. `test/typescript/steps/validation_steps.ts`
8. `test/typescript/steps/api_steps.ts`
9. `test/typescript/steps/user_steps.ts`
10. `test/typescript/steps/draft_steps.ts`
11. `test/typescript/steps/auth_steps.ts`
12. `test/typescript/steps/portal_steps.ts`
13. `test/typescript/steps/admin_steps.ts`
14. `test/typescript/steps/certificate_steps.ts`
15. `test/typescript/steps/eligibility_dashboard_steps.ts`

## Issues Found

### 1. `uploads_steps.ts` - Tautological Assertions

**Location**: Lines 48-49, 73-74

**Current Code**:
```typescript
if (!this.uploadKey) {
  throw new Error('No upload key was generated');
}
if (this.uploadKey.length === 0) {  // Tautological - already checked !this.uploadKey above
  throw new Error('Upload key is empty');
}
```

**Issue**: After checking `!this.uploadKey` which would be true for an empty string, checking `length === 0` is redundant - it can never be reached.

**Fix**: Remove the redundant length check.

### 2. `form_prerequisites_steps.ts` - Weak Assertion

**Location**: Lines 280-286

**Current Code**:
```typescript
Then('India-specific TTC options should become available', function () {
  if (prerequisitesContext.home_country !== 'IN') {
    throw new Error('Home country should be IN');
  }
  // For this test, we just verify the country is set correctly
  // In a real implementation, this would check country-specific forms
});
```

**Issue**: The step only verifies the country is set to 'IN', but doesn't verify any India-specific TTC options are actually available. This creates a false green - the test passes even if no India options exist.

**Fix**: Add verification that India-specific forms (e.g., `ttc_application_in`) are in the `available_forms` list.

### 3. `api_steps.ts` - Ignored Parameters (Tautological Assertion)

**Location**: Lines 227-233

**Current Code**:
```typescript
Then('the API response should have {string} equal to {string}', async (_key: string, _value: string) => {
  // The response body check is based on status code
  // 200 for success (ok=true), 413 for payload too large
  // Since we can't easily check the response body without modifying the route handler,
  // we verify via the status code which indicates the outcome
  assert.ok(apiContext.responseStatus === 200 || apiContext.responseStatus === 413);
});
```

**Issue**: The step accepts `key` and `value` parameters but completely ignores them. It only checks if the status is 200 or 413, which doesn't validate the actual response content.

**Fix**: Either:
1. Remove the unused parameters and clarify the step purpose, OR
2. Implement proper response body validation with the key/value pair

### 4. `e2e_api_steps.ts` - Weak Fuzzy Matching Assertions

**Location**: Lines 710-713, 716-719

**Current Code**:
```typescript
Then('the evaluation should be matched via name fallback', () => {
  if (!testContext.evaluations || testContext.evaluations.length === 0) {
    throw new Error('Evaluation should be matched via name fallback');
  }
});

Then('the evaluation should be matched via fuzzy email matching', () => {
  if (!testContext.evaluations || testContext.evaluations.length === 0) {
    throw new Error('Evaluation should be matched via fuzzy email matching');
  }
});
```

**Issue**: Both steps only check that evaluations array is non-empty. They don't verify the actual matching mechanism (name fallback or fuzzy email) was used. This creates false greens - the tests pass even if the wrong matching method was used.

**Fix**: Add assertions that verify:
- For name fallback: The evaluation's `candidate_name` field was used for matching (not email)
- For fuzzy email: The evaluation's `candidate_email` was normalized/fuzzied before matching

### 5. Files with GOOD Assertions (No Changes Needed)

The following files already have proper, meaningful assertions:
- `integrity_steps.ts` - Uses `assert` module with descriptive messages
- `reports_steps.ts` - Validates fixture structure properly
- `forms_steps.ts` - Checks for expected HTML content
- `validation_steps.ts` - Validates field errors with messages
- `certificate_steps.ts` - Verifies completion gating with reasons
- `eligibility_dashboard_steps.ts` - Validates course eligibility properly
- `user_steps.ts` - Proper field-by-field validation
- `draft_steps.ts` - Validates draft persistence
- `auth_steps.ts` - Token format validation is comprehensive
- `portal_steps.ts` - XSS checks are meaningful
- `admin_steps.ts` - Authorization checks are proper

## Summary Table

| File | Line(s) | Issue | Severity |
|------|---------|-------|----------|
| `uploads_steps.ts` | 48-49, 73-74 | Tautological length check | Low (redundant) |
| `form_prerequisites_steps.ts` | 280-286 | Missing actual options verification | Medium (false green) |
| `api_steps.ts` | 227-233 | Ignored parameters | Medium (misleading API) |
| `e2e_api_steps.ts` | 710-713, 716-719 | Weak fuzzy matching assertions | Medium (false green) |

## Related Evidence from Review Draft

From `docs/review/REVIEW_DRAFTS.md`, the `ts-then-steps-must-assert` task (lines 212-218) references:
- `test/typescript/steps/e2e_api_steps.ts:624-627`
- `test/typescript/steps/e2e_api_steps.ts:663-665`
- `test/typescript/steps/e2e_api_steps.ts:703-710`

Our research identified additional issues beyond these line ranges.

## Next Steps

The implementation plan should:
1. Fix tautological assertions in `uploads_steps.ts`
2. Add India-specific form verification in `form_prerequisites_steps.ts`
3. Either implement or deprecate the weak assertion in `api_steps.ts`
4. Add proper fuzzy matching verification in `e2e_api_steps.ts`
