# TASK-067: tsconfig-missing-test-bdd - Research

## Current State

### tsconfig.json Configuration
**File: `tsconfig.json:13-14`**

```json
"include": ["test/typescript/**/*.ts", "scripts/**/*.ts", "app/**/*.tsx", "app/**/*.ts"],
"exclude": ["node_modules", "test/typescript/node_modules", "app/api"],
```

### Observations
1. **Missing `test/bdd/**/*.ts`** - The step registry (`test/bdd/step-registry.ts`) is NOT included in typecheck
2. **`scripts/bdd/**/*.ts` IS included** - BDD verification scripts ARE covered via `scripts/**/*.ts`
3. **`app/api` is explicitly excluded** - This is related to TASK-068 (tsconfig-excludes-app-api)

### BDD Tooling Files

| File | Type | Status |
|------|------|--------|
| `test/bdd/step-registry.ts` | TypeScript export | **NOT typechecked** |
| `scripts/bdd/verify-alignment.ts` | TypeScript script | Typechecked (via `scripts/**/*.ts`) |
| `scripts/bdd/run-python.ts` | TypeScript script | Typechecked (via `scripts/**/*.ts`) |
| `scripts/bdd/run-typescript.ts` | TypeScript script | Typechecked (via `scripts/**/*.ts`) |

### Dependencies
**File: `scripts/bdd/verify-alignment.ts:3`**
```typescript
import { STEPS } from '../../test/bdd/step-registry';
```

The verification script imports directly from `test/bdd/step-registry.ts`. Since the registry is not typechecked, type errors in it (or in modules it imports) would NOT be caught by `bun run typecheck`.

### Current Typecheck Behavior
- `bun run typecheck` runs: `tsc --noEmit`
- Uses `tsconfig.json` for configuration
- `test/bdd/step-registry.ts` is NOT analyzed
- Type errors in the registry would only surface at runtime (when running `bun run bdd:verify`)

### Step Registry Structure
**File: `test/bdd/step-registry.ts:1-1488`**

The registry is a large const export:
```typescript
export const STEPS = {
  'I am authenticated as a Sahaj TTC graduate': {
    pattern: /^I\ am\ authenticated\ as\ a\ Sahaj\ TTC\ graduate$/,
    python: 'test/python/steps/forms_steps.py:67',
    typescript: 'test/typescript/steps/forms_steps.ts:73',
    features: ['specs/features/forms/post_sahaj_ttc_self_eval.feature:8', ...],
  },
  // ... 1000+ more steps
} as const;
```

The registry currently has no complex types that would fail typecheck, but:
1. Adding new step entries with typos in file paths would not be caught
2. Refactors that change types in step definition files wouldn't be validated against registry references
3. The `as const` assertion could mask structural type mismatches

## Related Code References

### Package.json Scripts
**File: `package.json:7-11`**
```json
"bdd:verify": "bun scripts/bdd/verify-alignment.ts",
"bdd:python": "bun scripts/bdd/run-python.ts",
"bdd:typescript": "bun scripts/bdd/run-typescript.ts",
"bdd:all": "bun run bdd:verify && bun run bdd:python && bun run bdd:typescript",
"typecheck": "tsc --noEmit",
```

### Verification Script
**File: `scripts/bdd/verify-alignment.ts:1-136`**

Imports the registry and validates:
- All feature steps have matching registry entries
- All registry entries are used in features (orphan detection)
- Python and TypeScript step paths are present

## Impact Analysis

### Risk Level: Medium

**Without this fix:**
- Type errors in `test/bdd/step-registry.ts` are not caught during CI/development
- Refactors that move step definition files won't break typecheck but will break runtime
- The registry can accumulate dead references (stale file paths)

**With this fix:**
- Type errors in BDD tooling are caught early
- Registry drift is detected by the typechecker
- One more source file for tsc to process (negligible performance impact)

### Dependencies on Registry
- `scripts/bdd/verify-alignment.ts` imports `STEPS` from registry
- No other TypeScript code currently imports the registry
- The registry is essentially build-time metadata, not runtime application code

## Implementation Constraints

1. **Minimal change** - Only need to add `test/bdd/**/*.ts` to `include` array
2. **No new dependencies** - Registry uses only built-in types (`Record`, `RegExp`, `as const`)
3. **Backward compatible** - Change only affects typecheck, not runtime behavior
4. **Related task** - TASK-068 (tsconfig-excludes-app-api) may be addressed together

## Files to Modify

| File | Change | Reason |
|------|--------|--------|
| `tsconfig.json:13` | Add `"test/bdd/**/*.ts"` to `include` array | Enable typecheck for BDD registry |
