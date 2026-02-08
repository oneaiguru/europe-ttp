# TASK-065: ts-then-steps-must-assert

## Slug
`ts-then-steps-must-assert`

## Goal
Eliminate false greens by ensuring `Then` steps assert real outcomes and do not mutate state to force success.

## Refs
- `docs/review/REVIEW_DRAFTS.md`
- `test/typescript/steps/e2e_api_steps.ts`

## Acceptance Criteria

1. **All `Then` steps must assert at least one concrete condition**
   - Remove empty `Then` steps
   - Implement meaningful assertions for placeholder `Then` steps
   - No `Then` step should pass without validating some condition

2. **`Then` steps must not mutate shared state**
   - Convert any `Then` steps that mutate `testContext` or other shared state to `Given/When` steps
   - `Then` steps should be assertion-only

3. **Evidence from review drafts at specific locations:**
   - `test/typescript/steps/e2e_api_steps.ts:624-627`
   - `test/typescript/steps/e2e_api_steps.ts:663-665`
   - `test/typescript/steps/e2e_api_steps.ts:703-710`

## Verification

```bash
# Verify all BDD steps are still aligned
bun run bdd:verify

# Run TypeScript BDD to ensure no regressions
bun run bdd:typescript

# Typecheck must pass
bun run typecheck

# Lint must pass
bun run lint
```

## Files to Examine

- `test/typescript/steps/e2e_api_steps.ts` - Lines 624-627, 663-665, 703-710
- `test/typescript/steps/reports_steps.ts` - May have similar issues
- `test/typescript/steps/*.ts` - Scan for other problematic `Then` steps

## Notes

From the review draft, the specific issues are:
- Lines 624-627: `Then` step that may not be asserting
- Lines 663-665: `Then` step that may not be asserting
- Lines 703-710: `Then` step that may be mutating state

These need to be examined and fixed to ensure they are proper assertions.
