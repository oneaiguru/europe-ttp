# TASK-FIX-011: TS BDD Step State Leakage and Mutation Bugs

## Task ID
TASK-FIX-011

## Priority
p2 (Important - BDD Test Quality)

## Feature File
N/A (Fix/hardening task)

## Failing Scenario
Not a feature-based failure - this is a code quality issue identified during review

## Steps Needing Implementation

This task fixes the following issues in TypeScript BDD step definitions:

### Issue 1: State Mutation in "Then" Steps (e2e_api_steps.ts)
- **Line 323**: `testContext.evaluationsCount++;` - When step increments counter
- **Line 507**: `testContext.evaluationsCount++;` - When step increments counter
- **Line 630**: `testContext.evaluationsCount++;` - Then step increments counter

**Problem**: "Then" steps should only ASSERT state, never mutate it. Mutating in "Then" steps causes:
1. Scenarios that depend on the assertion to also change state
2. Test failures that don't reproduce when assertions are reordered
3. Difficulty debugging because state changes happen during verification

**Fix**: Move all state increments to appropriate "When" steps. "Then" steps should only read and assert.

### Issue 2: No-Op Assertions (reports_steps.ts)
- **Line 72**: `assert.ok(Array.isArray(Object.keys(world.summaryData))`
- **Line 115**: `assert.ok(Array.isArray(Object.keys(world.integrityData))`

**Problem**: `Object.keys()` ALWAYS returns an array, so `Array.isArray(Object.keys(...))` is always true. This assertion never fails and provides no value.

**Fix**: Replace with meaningful assertions that actually verify the expected data structure or content.

### Issue 3: State Reset Between Scenarios
Ensure that the test world/context is properly reset between scenarios. The `BeforeAll` / `BeforeEach` hooks must fully reset shared state.

## Acceptance Criteria

1. No "Then" step mutates shared state (testContext, world, etc.)
2. All assertions are meaningful (no always-true conditions like `Array.isArray(Object.keys(...))`)
3. Test world is fully reset between scenarios (no state leakage)
4. All BDD tests continue to pass after fixes
5. `verify-alignment.ts` passes (0 orphan, 0 dead)
6. `typecheck` passes
7. `lint` passes

## Implementation Notes

- Use TypeScript BDD runner (bun scripts/bdd/run-typescript.ts)
- Focus on: `test/typescript/steps/e2e_api_steps.ts`, `test/typescript/steps/reports_steps.ts`
- Do NOT modify Python step definitions (this is TS-specific)
- Ensure step registry is updated if any step text changes
