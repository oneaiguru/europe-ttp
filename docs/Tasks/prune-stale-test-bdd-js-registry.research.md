# TASK-097: prune-stale-test-bdd-js-registry - Research

## Status of Files

| File | Lines | Status |
|------|-------|--------|
| `test/bdd/step-registry.ts` | 1626 | Current (source of truth) |
| `test/bdd/step-registry.js` | 1398 | Outdated (can be removed) |
| `test/bdd/step-registry.js.bak` | 991 | Outdated backup (can be removed) |

## Active References

### Scripts (verify-alignment.ts)
- `scripts/bdd/verify-alignment.ts:3` imports from `../../test/bdd/step-registry`
  - Uses TypeScript module resolution (no `.js` extension)
  - Resolves to `step-registry.ts`

### BDD Runners
- `scripts/bdd/run-typescript.ts` - No reference to step-registry
- `scripts/bdd/run-python.ts` - No reference to step-registry

### Documentation References
- All references in docs point to `.ts` version as source of truth
- `.js` version only mentioned in:
  - `IMPLEMENTATION_PLAN.md` (this task's definition)
  - Task documentation files (being researched now)
  - `prune-stale-bdd-js-scripts.research.md` (noting it could be removed)

## Code Comparison

All three files export the same structure:
```typescript
export const STEPS = {
  'step text': {
    pattern: /.../,
    python: '...',
    typescript: '...',
    features: [...],
  },
  // ...
};
```

The `.ts` version is the most current (1626 lines vs 1398 for `.js`).

## Findings

1. **No active imports**: No script imports `step-registry.js` or `step-registry.js.bak`
2. **TypeScript module resolution**: `scripts/bdd/verify-alignment.ts` imports without extension, resolving to `.ts`
3. **Source of truth**: `test/bdd/step-registry.ts` is the canonical version
4. **Safe to remove**: Both `.js` and `.bak` files can be safely deleted

## Related Work

- TASK-091 (`prune-stale-bdd-js-scripts`) removed old BDD runner scripts
- This task completes the cleanup by removing the obsolete registry files
