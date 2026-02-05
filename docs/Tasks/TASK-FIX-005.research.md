# TASK-FIX-005: Research Findings

## Problem Statement
The task description claimed Cucumber.js was not expanding Scenario Outline examples, showing:
- Python: 99 scenarios
- TypeScript: 90 scenarios
- Gap: 9 scenarios

## Investigation Results

### Root Cause
**The premise was incorrect.** The issue was with the **verification script**, not Cucumber.js behavior.

### Evidence

1. **Cucumber.js IS expanding Scenario Outline examples correctly:**

   ```bash
   # Running dependent_fields feature shows:
   $ cucumber-js specs/features/e2e/dependent_fields_do_not_break_completeness.feature
   6 scenarios (6 passed)  # 3 regular + 3 from Scenario Outline
   ```

2. **Both Python and TypeScript have 99 scenarios:**

   When counting by `type=='scenario'` (the correct JSON field):
   - Python: 99 scenarios
   - TypeScript: 99 scenarios
   - Match: **YES**

3. **The faulty counting script** used `keyword=='Scenario'` which excludes expanded examples:

   - TypeScript expanded examples keep `keyword='Scenario Outline'` (not `'Scenario'`)
   - Python expanded examples also keep `keyword='Scenario Outline'` but add `-- @1.1` suffix to name
   - Both have `type='scenario'` for all testable scenarios

### JSON Output Comparison

**TypeScript (Cucumber.js v11.1.0):**
```json
{
  "keyword": "Scenario Outline",
  "type": "scenario",
  "name": "Different numbers of evaluators",
  "id": "dependent-fields-do-not-break-form-completeness;different-numbers-of-evaluators"
}
```

**Python (Behave):**
```json
{
  "keyword": "Scenario Outline",
  "type": "scenario",
  "name": "Different numbers of evaluators -- @1.1 ",
  "id": "...different-numbers-of-evaluators"
}
```

### Test Results by Feature

| Feature | Regular Scenarios | Outline Examples | Total |
|---------|-------------------|------------------|-------|
| dependent_fields_do_not_break_completeness.feature | 3 | 3 | 6 |
| home_country_changes_available_ttcs.feature | 3 | 3 | 6 |
| ttc_application_to_admin_review.feature | 1 | 3 | 4 |

**Total across E2E: 16 scenarios** (all passing in both Python and TypeScript)

### Cucumber Configuration

Current config (`.cucumberrc.cjs`):
```javascript
module.exports = {
  format: 'test/reports/typescript_bdd.json',
  formatOptions: { snippetInterface: 'async-await' },
  requireModule: ['ts-node/register'],
  require: ['test/typescript/steps/**/*.ts']
};
```

Runner (`scripts/bdd/run-typescript.ts`) correctly uses:
- `tsx` for TypeScript execution
- `--import` flag to load step definitions
- JSON formatter for reports

## Conclusion

**No fix needed.** Cucumber.js v11.1.0 correctly expands Scenario Outline examples into individual test scenarios. The 99 scenario count matches Python's Behave exactly.

### Recommendation

1. Update the verification script in TASK-FIX-005 to use `type=='scenario'` instead of `keyword=='Scenario'`
2. Mark this task as **DONE / CANCELLED** since the premise was based on incorrect counting
3. Document the correct counting method for future reference

## Files Examined

- `.cucumberrc.cjs` - Cucumber configuration
- `scripts/bdd/run-typescript.ts` - TypeScript BDD runner
- `specs/features/e2e/dependent_fields_do_not_break_completeness.feature` - Scenario Outline example
- `specs/features/e2e/home_country_changes_available_ttcs.feature` - Scenario Outline example
- `specs/features/e2e/ttc_application_to_admin_review.feature` - Scenario Outline example
- `test/reports/python_bdd.json` - Python test results
- `test/reports/typescript_bdd.json` - TypeScript test results
- `package.json` - Cucumber version (v11.1.0)
