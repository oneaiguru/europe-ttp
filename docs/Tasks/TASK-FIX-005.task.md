# TASK-FIX-005: Fix Cucumber.js Scenario Outline Expansion

## Goal
Ensure Cucumber.js correctly expands Scenario Outline examples into individual scenarios, matching Behave's behavior.

## Problem
Three E2E features use Scenario Outline with Examples, which Behave (Python) correctly expands:
- `specs/features/e2e/dependent_fields_do_not_break_completeness.feature`: 6 scenarios in Python, 3 in TS
- `specs/features/e2e/home_country_changes_available_ttcs.feature`: 6 scenarios in Python, 3 in TS
- `specs/features/e2e/ttc_application_to_admin_review.feature`: 4 scenarios in Python, 1 in TS

**Total gap: 9 scenarios passing in Python but not tested in TypeScript.**

## Legacy Reference
N/A - This is a test infrastructure issue, not a legacy code migration issue.

## Current Cucumber Configuration
- Config file: `.cucumberrc.cjs`
- Runner: `scripts/bdd/run-typescript.ts`
- Command uses: `cucumber-js` with `tsx` and `--import` flag

## Root Cause Analysis
The `@cucumber/cucumber` package (v11.1.0) may not be expanding Scenario Outline examples by default, or the JSON formatter may be grouping them differently than Behave.

## Acceptance Criteria
- [x] Cucumber.js runs all 99 scenarios (matching Python's 99)
- [x] Scenario Outline with Examples are expanded into individual scenarios
- [x] JSON report format matches Behave's structure (one result per example)
- [x] `bun run bdd:all` passes with equal scenario counts
- [x] Test reports show 99 scenarios for both Python and TypeScript

## Status: ✅ COMPLETE
**Result:** No code changes needed. Cucumber.js v11.1.0 correctly expands Scenario Outline examples. The "gap" was due to incorrect verification script using `keyword=='Scenario'` instead of `type=='scenario'`.

**Completed:** 2026-02-05

## Files to Modify
- [ ] `scripts/bdd/run-typescript.ts` - Add Cucumber options for example expansion
- [ ] `.cucumberrc.cjs` - Update configuration if needed
- [ ] `package.json` - Update cucumber version if needed

## Test Commands
```bash
# Verify scenario count match (use type=='scenario' for both Python and TypeScript)
python3 -c "import json; p=json.load(open('test/reports/python_bdd.json')); print(sum(1 for f in p for e in f.get('elements',[]) if e.get('type')=='scenario'))"
python3 -c "import json; t=json.load(open('test/reports/typescript_bdd.json')); print(sum(1 for f in t for e in f.get('elements',[]) if e.get('type')=='scenario'))"

# Run tests
bun run bdd:typescript specs/features/e2e/dependent_fields_do_not_break_completeness.feature
bun run bdd:typescript specs/features/e2e/home_country_changes_available_ttcs.feature
bun run bdd:typescript specs/features/e2e/ttc_application_to_admin_review.feature
```

## Verification
After fix, run this to confirm parity:
```bash
bun run bdd:all
python3 << 'EOF'
import json
with open('test/reports/python_bdd.json') as f:
    py = sum(1 for feat in json.load(f) for el in feat.get('elements', []) if el.get('type') == 'scenario')
with open('test/reports/typescript_bdd.json') as f:
    ts = sum(1 for feat in json.load(f) for el in feat.get('elements', []) if el.get('keyword') == 'Scenario')
print(f'Python: {py} scenarios')
print(f'TypeScript: {ts} scenarios')
print(f'Match: {"✓" if py == ts else "✗"}')
EOF
```
