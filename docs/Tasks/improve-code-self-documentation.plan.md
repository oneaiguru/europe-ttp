# TASK-073: improve-code-self-documentation - Implementation Plan

## Overview
Add JSDoc annotations and clarifying comments to key files that need improved documentation, focusing on the highest-value improvements identified in research.

## Files to Change

### 1. `scripts/bdd/verify-alignment.ts` (Medium Priority)
**Changes:**
- Add JSDoc to `extractFeatureSteps()` explaining the regex pattern for extracting Gherkin steps
- Add JSDoc to `stepMatchesPattern()` documenting the matching algorithm and Cucumber placeholder semantics
- Add explanatory comments for the regex patterns (`{string}`, `{int}`, `{float}`, `*`)
- Add comments explaining the "dead" vs "orphan" step terminology in the report output

### 2. `app/users/upload-form-data/route.ts` (Low Priority)
**Changes:**
- Add JSDoc to `requireAuth()` helper function
- Add JSDoc to `validatePayload()` helper function
- Add JSDoc to `readPayload()` helper function

### 3. `test/typescript/steps/api_steps.ts` (Low Priority)
**Changes:**
- Add JSDoc to `loadTestConfig()`
- Add JSDoc to `loadFormSubmissions()`
- Add JSDoc to `resolveSubmission()`
- Add JSDoc to `buildPayload()`

### 4. `test/typescript/steps/uploads_steps.ts` (Low Priority)
**Changes:**
- Add JSDoc comment to `World` interface explaining its role in Cucumber

### 5. `test/typescript/steps/test_steps.ts` (Low Priority)
**Changes:**
- Clarify the test scenario purpose in the file header comment

## Files Already Well-Documented (No Changes)
- `app/api/upload/signed-url/route.ts` - Excellent security documentation
- `app/api/upload/verify/route.ts` - Good documentation
- `app/utils/crypto.ts` - Comprehensive JSDoc with usage examples
- `test/typescript/steps/common.ts` - Clear purpose and reset logic
- `test/typescript/steps/reports_steps.ts` - Good section organization
- `test/typescript/steps/e2e_api_steps.ts` - Excellent structure and type docs

## Implementation Steps

### Step 1: Improve `scripts/bdd/verify-alignment.ts`
1. Add JSDoc to `extractFeatureSteps()`:
   - Document the regex pattern for matching Gherkin keywords (Given/When/Then/And)
   - Explain how it extracts step text and captures line numbers
2. Add JSDoc to `stepMatchesPattern()`:
   - Document the Cucumber placeholder matching algorithm
   - Explain the `{string}`, `{int}`, `{float}` pattern matching
   - Explain the asterisk (`*`) wildcard support
3. Add inline comments for regex patterns:
   - Document the `STRING_PATTERN`, `INT_PATTERN`, `FLOAT_PATTERN` constants
   - Explain the `ESCAPE_CHARS` and `replacePlaceholders()` logic
4. Add report output comments:
   - Explain what "orphan" steps are (defined in code but not used in features)
   - Explain what "dead" steps are (used in features but not defined in code)

### Step 2: Improve `app/users/upload-form-data/route.ts`
1. Add JSDoc to `requireAuth()`:
   - Document that it extracts and validates `x-user-email` header
   - Explain the authentication requirement for POST requests
2. Add JSDoc to `validatePayload()`:
   - Document the field whitelist validation
   - Explain the payload size limit check
3. Add JSDoc to `readPayload()`:
   - Document how it reads and parses the request body
   - Explain error handling for malformed JSON

### Step 3: Improve `test/typescript/steps/api_steps.ts`
1. Add JSDoc to `loadTestConfig()`:
   - Document that it loads test configuration from `test/fixtures/test-config.json`
   - Explain caching behavior
2. Add JSDoc to `loadFormSubmissions()`:
   - Document that it loads form submission fixtures
   - Explain caching behavior
3. Add JSDoc to `resolveSubmission()`:
   - Document the form ID and email-based lookup
   - Explain return type
4. Add JSDoc to `buildPayload()`:
   - Document how it merges base form data with overrides
   - Explain the parameter transformation

### Step 4: Improve `test/typescript/steps/uploads_steps.ts`
1. Add JSDoc comment to `World` interface:
   - Explain its role as the Cucumber World object
   - Document the properties used for upload test state

### Step 5: Improve `test/typescript/steps/test_steps.ts`
1. Clarify the file header comment:
   - Explain the purpose of the test fixture scenario
   - Document the asterisk step support

## Verification

After implementing changes, run:
```bash
bun run typecheck
bun run lint
bun run bdd:verify
```

Expected results:
- ✓ `bun run typecheck` passes with no errors
- ✓ `bun run lint` passes with no errors
- ✓ `bun run bdd:verify` runs successfully
- ✓ No functional changes - only documentation additions

## Risks / Rollback

### Risks
- **Low risk**: This task only adds comments and JSDoc annotations
- No functional code changes
- Cannot break existing functionality
- Type errors from JSDoc syntax are unlikely but possible

### Rollback Strategy
If any issues arise:
1. Revert the commit that added documentation
2. Run `bun run typecheck` and `bun run lint` to verify baseline
3. Re-apply changes incrementally, testing after each file

## Notes

1. **Focus on high-value documentation**: The BDD verification script has the most complex logic and benefits most from explanatory comments.

2. **Keep documentation concise**: Add only necessary documentation. Over-documenting can reduce code readability.

3. **JSDoc consistency**: Follow existing JSDoc style in the codebase (use `@param` for parameters, `@returns` for return values).

4. **No functional changes**: This is purely a documentation task. Ensure no logic is modified.
