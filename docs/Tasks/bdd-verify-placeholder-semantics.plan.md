# TASK-063: bdd-verify-placeholder-semantics - Plan

## Implementation Steps

### Step 1: Update `{string}` placeholder pattern
**File**: `scripts/bdd/verify-alignment.ts`

Current:
```typescript
.replace(/\\\{string\\\}/g, '"[^"]*"')
```

New:
```typescript
.replace(/\\\{string\\\}/g, '("([^"]*)"|\'([^\']*)\')')
```

This matches both:
- Double-quoted strings: `"hello"`, `"test value"`
- Single-quoted strings: `'hello'`, `'test value'`

### Step 2: Update `{int}` placeholder pattern
**File**: `scripts/bdd/verify-alignment.ts`

Current:
```typescript
.replace(/\\\{int\\\}/g, '\\d+')
```

New:
```typescript
.replace(/\\\{int\\\}/g, '-?\\d+')
```

This matches both positive and negative integers: `0`, `1`, `-1`, `42`, `-42`

### Step 3: Update `{float}` placeholder pattern
**File**: `scripts/bdd/verify-alignment.ts`

Current:
```typescript
.replace(/\\\{float\\\}/g, '\\d+\\.?\\d*')
```

New:
```typescript
.replace(/\\\{float\\\}/g, '-?\\d+\\.?\\d*')
```

This matches:
- Positive floats: `0.5`, `1.5`, `3.14`
- Negative floats: `-0.5`, `-1.5`, `-3.14`
- Integer forms: `0`, `1`, `42` (Cucumber `{float}` accepts integers)

### Step 4: Add test coverage
**File**: `specs/features/test/placeholder_matching.feature`

Add new scenarios:
```gherkin
Scenario: Test single-quoted string placeholder
  Given test placeholder step with value 'single quoted'
  When the alignment check runs
  Then the step should match correctly

Scenario: Test negative integer placeholder
  Given the signed URL should expire within -5 minutes
  When the alignment check runs
  Then the step should match correctly

Scenario: Test negative float placeholder
  Given test placeholder step with float -1.5
  When the alignment check runs
  Then the step should match correctly
```

## Files to Change

| File | Change Type | Description |
|------|-------------|-------------|
| `scripts/bdd/verify-alignment.ts` | Edit | Update placeholder regex patterns |
| `specs/features/test/placeholder_matching.feature` | Edit | Add test scenarios |
| `test/bdd/step-registry.ts` | Edit | Add registry entries for new tests |

## Tests to Run

```bash
# Run verification script
bun run bdd:verify

# Run TypeScript BDD tests
bun run bdd:typescript test/typescript/steps/test_steps.ts

# Run Python BDD tests
bun run bdd:python test/python/steps/test_steps.py

# Type check
bun run typecheck

# Lint
bun run lint
```

## Risks / Rollback

### Risk 1: Pattern ambiguity
If both `{int}` and `{float}` appear in the same step text, the float pattern may match integers. This is consistent with Cucumber behavior but may cause unexpected matches.

**Mitigation**: The verification script only checks for exact pattern matches, not parameter type discrimination. This is acceptable for alignment verification.

### Risk 2: Quote escaping
The new patterns don't handle escaped quotes inside strings (`"hello \"world\""`). This matches the current implementation's simplicity level.

**Mitigation**: Escaped quotes in feature files are extremely rare. The current implementation doesn't handle them either.

### Rollback Plan
If issues arise:
1. Revert `scripts/bdd/verify-alignment.ts` to original patterns
2. Remove new test scenarios from `specs/features/test/placeholder_matching.feature`
3. Remove new registry entries from `test/bdd/step-registry.ts`

## Verification

After implementation, verify:
1. `bun run bdd:verify` passes with no "dead step" false positives
2. All new test scenarios pass
3. Existing tests continue to pass
4. No regressions in step matching accuracy
