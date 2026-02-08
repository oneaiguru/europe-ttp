# TASK-097: prune-stale-test-bdd-js-registry - Implementation Plan

## Summary
Remove obsolete JavaScript BDD step registry files that have been superseded by the TypeScript version.

## Changes Required

### 1. Delete Stale Files
| File | Action |
|------|--------|
| `test/bdd/step-registry.js` | Delete (1398 lines, outdated) |
| `test/bdd/step-registry.js.bak` | Delete (991 lines, outdated backup) |

### 2. No Code Changes Needed
- `scripts/bdd/verify-alignment.ts` imports without extension: `import { STEPS } from '../../test/bdd/step-registry'`
- TypeScript module resolution resolves to `step-registry.ts`
- No other scripts reference the `.js` files

## Verification Steps

1. **Check for remaining references** (should find none):
   ```bash
   grep -r "step-registry.js" --include="*.sh" --include="*.ts" --include="*.js" .
   ```

2. **Run BDD verification**:
   ```bash
   bun run bdd:verify
   ```

3. **Run TypeScript BDD test**:
   ```bash
   bun run bdd:typescript specs/features/test/placeholder_matching.feature
   ```

4. **Verify git status**:
   ```bash
   git status
   ```
   Should show two deleted files.

## Risks
- **Low Risk**: Files are not imported by any active code
- TypeScript version (`test/bdd/step-registry.ts`) is the canonical source of truth
- Similar cleanup completed successfully in TASK-091

## Rollback
If needed after commit:
```bash
git checkout HEAD~ -- test/bdd/step-registry.js test/bdd/step-registry.js.bak
```
