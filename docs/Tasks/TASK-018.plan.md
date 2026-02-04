# TASK-018: Post-Sahaj TTC Self Evaluation - Implementation Plan

## Status
✅ **ALREADY IMPLEMENTED** - Verification Phase

## Summary
All step definitions and implementations are complete. This task is in verification phase to ensure both Python and TypeScript BDD tests pass.

## Current State

### Python BDD
- ✅ Status: **PASSING**
- ✅ 1 feature passed, 0 failed
- ✅ 1 scenario passed, 0 failed
- ✅ 3 steps passed, 0 failed, 0 undefined

### TypeScript BDD
- ⚠️ Status: **BLOCKED** - Runner configuration issue
- Issue: Deprecated `--loader ts-node/esm` flag causing circular dependency error
- Error: `ERR_REQUIRE_CYCLE_MODULE` in admin_steps.ts

## Implementation Plan

Since all code is already implemented, this plan focuses on **verification and cleanup**:

### Step 1: Fix TypeScript BDD Runner (BLOCKER)
**File**: `scripts/bdd/run-typescript.ts`

**Problem**: Using deprecated `--loader ts-node/esm` flag

**Solution Options**:
1. Use `--import` flag with `register()` (Node.js 22+)
2. Use bun directly instead of node (since project uses bun)
3. Configure ts-node properly in tsconfig.json

**Recommended Approach**: Update to use bun's native TypeScript support:
```typescript
const proc = spawn(
  'bun',
  [
    'test/typescript/cucumber.ts',  // Create a wrapper
    featurePath,
    '-f',
    `json:${path.join(OUTPUT_DIR, 'typescript_bdd.json')}`,
  ],
  // ...
);
```

### Step 2: Verify TypeScript BDD Test
Run: `bun scripts/bdd/run-typescript.ts features/forms/post_sahaj_ttc_self_eval.feature`

Expected result:
- 1 scenario passed
- 3 steps passed

### Step 3: Run Alignment Verification
```bash
bun scripts/bdd/verify-alignment.ts
```

Expected result:
- 0 orphan steps
- 0 dead steps

### Step 4: Update Coverage Matrix
**File**: `docs/coverage_matrix.md`

Action: Mark TASK-018 as complete for both Python and TypeScript

### Step 5: Update Implementation Plan
**File**: `IMPLEMENTATION_PLAN.md`

Action: Mark TASK-018 as complete

### Step 6: Remove Active Task
```bash
rm docs/Tasks/ACTIVE_TASK.md
```

## Step Registry Status

All three steps are already registered:

1. **Line 2-6**: "I am authenticated as a Sahaj TTC graduate"
   - Python: `test/python/steps/forms_steps.py:85-88`
   - TypeScript: `test/typescript/steps/forms_steps.ts:101-105`

2. **Line 152-156**: "I open the post-Sahaj TTC self evaluation form"
   - Python: `test/python/steps/forms_steps.py:107-113`
   - TypeScript: `test/typescript/steps/forms_steps.ts:132-145`

3. **Line 458-463**: "I should see the post-Sahaj TTC self evaluation questions"
   - Python: `test/python/steps/forms_steps.py:116-119`
   - TypeScript: `test/typescript/steps/forms_steps.ts:147-152`

## Implementation Files

### Existing (No Changes Needed)
- `test/python/steps/forms_steps.py:85-119`
- `test/typescript/steps/forms_steps.ts:101-152`
- `app/forms/post_sahaj_ttc_self_evaluation/render.ts`

## Test Commands

```bash
# Python (already passing)
bun scripts/bdd/run-python.ts features/forms/post_sahaj_ttc_self_eval.feature

# TypeScript (blocked by runner issue)
bun scripts/bdd/run-typescript.ts features/forms/post_sahaj_ttc_self_eval.feature

# Alignment verification
bun scripts/bdd/verify-alignment.ts

# Type check
bun run typecheck

# Lint
bun run lint
```

## Acceptance Criteria

- [x] User authenticated as Sahaj TTC graduate can access the form
- [x] Form renders with Sahaj-specific self-evaluation questions
- [x] Python BDD scenario passes
- [ ] TypeScript BDD scenario passes (blocked by runner config)
- [ ] Alignment verification passes (0 orphan, 0 dead)
- [ ] Coverage matrix updated
- [ ] Implementation plan updated
- [ ] Active task removed

## Notes

1. **No code implementation needed** - all steps are already implemented
2. **Primary blocker**: TypeScript BDD runner needs modernization
3. **Priority**: p2
4. **Estimated time to completion**: 1-2 hours (mostly fixing runner)

## Next Actions

1. Fix `scripts/bdd/run-typescript.ts` to use bun's native TypeScript support
2. Verify TypeScript BDD test passes
3. Complete cleanup steps 3-6 above
