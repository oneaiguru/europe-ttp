# TASK-063: bdd-verify-placeholder-semantics - Research

## Overview
Research the placeholder matching logic in `scripts/bdd/verify-alignment.ts` to align with Cucumber expression semantics.

## Current Implementation

### Location: `scripts/bdd/verify-alignment.ts:52-67`

```typescript
const hasPlaceholders = registryKey.includes('{string}') || registryKey.includes('{int}') || registryKey.includes('{float}');
if (hasPlaceholders) {
  const escaped = registryKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patternStr = escaped
    .replace(/\\\{string\\\}/g, '"[^"]*"')
    .replace(/\\\{int\\\}/g, '\\d+')
    .replace(/\\\{float\\\}/g, '\\d+\\.?\\d*');
  const pattern = new RegExp(`^${patternStr}$`);
  return pattern.test(featureStep);
}
```

## Cucumber Expression Semantics

### Standard Cucumber Parameter Types

Based on Cucumber documentation and step definition implementations:

1. **`{string}`** - Matches quoted strings
   - **Double-quoted**: `"hello"` or `"test value"`
   - **Single-quoted**: `'hello'` or `'test value'`
   - Current implementation: `"[^"]*"` (only double quotes)

2. **`{int}`** - Matches integer values
   - Positive: `0`, `1`, `42`, `1000`
   - Negative: `-1`, `-42`, `-1000`
   - Current implementation: `\\d+` (only positive)

3. **`{float}`** - Matches floating-point numbers
   - Integer forms: `0`, `1`, `42`
   - Decimal forms: `0.5`, `1.5`, `3.14`, `-1.5`
   - Scientific: `1e10` (rare in features)
   - Current implementation: `\\d+\\.?\\d*` (only positive)

## Real-World Usage in Features

### Double-quoted strings ( predominant pattern)
From `specs/features/e2e/ttc_application_to_admin_review.feature:9`:
```gherkin
And I am authenticated as applicant with email "test.applicant@example.com"
```

Registry entry: `I am authenticated as applicant with email {string}`
Pattern: `/^I\ am\ authenticated\ as\ applicant\ with\ email\ "([^"]*)"$/`

### Integer values
From `specs/features/uploads/upload_security.feature:27`:
```gherkin
And the signed URL should expire within 15 minutes
```

Registry entry: `the signed URL should expire within {int} minutes`
Pattern: `/^the\ signed\ URL\ should\ expire\ within\ (\d+)\ minutes$/`

### Potential gaps in current implementation

#### 1. Single-quoted strings
No current examples found, but Cucumber supports both quote styles.

#### 2. Negative numbers
No current examples found in features, but Cucumber `{int}` and `{float}` support negative values.

## Step Registry Analysis

### Entries with placeholder patterns
From `test/bdd/step-registry.ts`:

| Registry Key | Pattern Field | Uses Placeholder Fallback |
|--------------|---------------|---------------------------|
| `I am authenticated as applicant with email {string}` | `/^I\ am\ authenticated\ as\ applicant\ with\ email\ "([^"]*)"$/` | No |
| `the signed URL should expire within {int} minutes` | `/^the\ signed\ URL\ should\ expire\ within\ (\d+)\ minutes$/` | No |
| `test placeholder step with value {string}` | **NONE** | **YES** |

### The test case
From `test/bdd/step-registry.ts:1448-1452`:
```typescript
'test placeholder step with value {string}': {
  python: 'test/python/steps/test_steps.py:21',
  typescript: 'test/typescript/steps/test_steps.ts:18',
  features: ['specs/features/test/placeholder_matching.feature:10'],
  // NO pattern field - tests fallback placeholder logic
},
```

## Issues Identified

### Issue 1: Single-quote string support not implemented
Current: `"[^"]*"` (only double quotes)
Cucumber spec: Both `'...'` and `"..."`

### Issue 2: Negative number support not implemented
Current `{int}`: `\\d+` (only positive)
Cucumber spec: `-?\\d+`

Current `{float}`: `\\d+\\.?\\d*` (only positive)
Cucumber spec: `-?\\d+\\.?\\d*`

### Issue 3: Float pattern may match integers too broadly
Current: `\\d+\\.?\\d*` matches `15` as float
This could cause ambiguity if a step has both `{int}` and `{float}` patterns

## Test Coverage

### Existing test file
`specs/features/test/placeholder_matching.feature`:
```gherkin
Scenario: Test string placeholder without explicit pattern
  Given I have a registry entry with placeholder but no pattern
  When the alignment check runs
  Then the step should match correctly

Scenario: Test placeholder step with actual value
  Given test placeholder step with value "example value"
  When the alignment check runs
  Then the step should match correctly
```

### Gaps in test coverage
1. No test for single-quoted strings
2. No test for negative integers
3. No test for negative floats
4. No test for decimal floats like `0.5` or `-1.5`

## Implementation References

### Cucumber Expression documentation (TypeScript/JavaScript)
- `{string}` parameter type: Matches single or double-quoted strings
- `{int}` parameter type: Matches optional minus sign followed by digits
- `{float}` parameter type: Matches optional minus sign, digits, optional decimal point and more digits

### Related implementation files
- `scripts/bdd/verify-alignment.ts:48-71` - `stepMatchesPattern()` function
- `test/bdd/step-registry.ts:1448-1452` - Test entry without pattern field
- `specs/features/test/placeholder_matching.feature` - Test scenarios
- `test/typescript/steps/test_steps.ts:18` - `{string}` parameter implementation
- `test/python/steps/test_steps.py:21` - Python `{string}` parameter implementation

## Summary

### Current state
The fallback placeholder matching in `verify-alignment.ts` works for the most common cases:
- Double-quoted strings (`"value"`)
- Positive integers (`15`)
- Positive floats (`1.5`, `0.5`)

### Gaps identified
1. Single-quoted strings (`'value'`) not supported
2. Negative integers (`-1`) not supported
3. Negative floats (`-1.5`) not supported

### Impact
- Low risk: All existing features use double-quoted strings and positive numbers
- Medium completeness: Cucumber spec allows single quotes and negative numbers
- Future-proofing: New features may use these patterns

## File References

| File | Lines | Description |
|------|-------|-------------|
| `scripts/bdd/verify-alignment.ts` | 48-71 | Placeholder matching logic |
| `test/bdd/step-registry.ts` | 1448-1452 | Test registry entry without pattern |
| `specs/features/test/placeholder_matching.feature` | 1-13 | Test scenarios |
| `test/typescript/steps/test_steps.ts` | 18 | {string} step definition |
| `test/python/steps/test_steps.py` | 21 | {string} step definition |
| `specs/features/uploads/upload_security.feature` | 27 | Example of {int} usage |
| `specs/features/e2e/ttc_application_to_admin_review.feature` | 9 | Example of {string} usage |
