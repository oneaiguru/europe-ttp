# TASK-066: ts-reports-steps-mocked-calls-false-green

## Goal
Ensure TS report steps validate meaningful behavior instead of hard-coded success values that always pass.

## References
- File: `test/typescript/steps/reports_steps.ts`
- Review: `docs/review/REVIEW_DRAFTS.md`

## Problem Statement
The TypeScript reports steps (`test/typescript/steps/reports_steps.ts`) contain mocked implementations that hard-code success status (200) and fake response data. This creates "false green" tests that always pass regardless of actual implementation status.

Specific issues identified in `reports_steps.ts`:
- Lines 34-59: `When I run the user summary report load job` hard-codes `loadStatus = 200` with a comment "For now, simulate success"
- Lines 61-72: `Then I should receive the user summary data` validates only that the mock succeeded, not real API behavior
- Similar patterns throughout for integrity, user report, combined report, forms report, print form, participant list, and certificate PDF

## Acceptance Criteria
1. `When` steps either call real report endpoints OR use explicit fixture-backed stubs that can fail
2. `Then` steps validate meaningful fields from responses (not just status codes and empty objects)
3. Tests fail when endpoints return errors or malformed data
4. Existing test suite continues to pass after changes

## Files to Modify
- `test/typescript/steps/reports_steps.ts`

## Implementation Approach
1. Identify which report endpoints exist in the Next.js app/api routes
2. For existing endpoints: Call real endpoints using fetch/test utilities
3. For non-existent endpoints: Create fixture-based stubs that can fail (not just hard-coded success)
4. Update `Then` assertions to validate meaningful response fields

## Test Commands
```bash
bun run bdd:typescript specs/features/reports/*.feature
bun run bdd:verify
bun run typecheck
```
