# TASK-FIX-010: Implementation Plan

## Goal
Remove `node_modules/node_modules` symlink workaround in TypeScript runner.

## Implementation

### Change Required
Remove lines 10 and 21-31 from `scripts/bdd/run-typescript.ts`:

```typescript
// REMOVE these imports (line 10):
import { lstat, mkdir, realpath, symlink } from 'fs/promises';

// REMOVE this block (lines 21-31):
const nodeModulesReal = await realpath(path.join(PROJECT_ROOT, 'node_modules')).catch(() => '');
if (nodeModulesReal) {
  const nestedNodeModules = path.join(nodeModulesReal, 'node_modules');
  try {
    await lstat(nestedNodeModules);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      await symlink(nodeModulesReal, nestedNodeModules, 'dir');
    }
  }
}
```

Replace with simpler imports (keep mkdir for OUTPUT_DIR):
```typescript
import { mkdir } from 'fs/promises';
```

### Verification Steps
1. Remove the code block
2. Run `bun scripts/bdd/run-typescript.ts specs/features/` - all 99 scenarios should pass
3. Run `bun run bdd:typescript` - should pass
4. Verify no nested symlink exists: `ls node_modules/node_modules` should fail

### Files to Modify
- `scripts/bdd/run-typescript.ts` - Remove symlink creation logic

### Rollback
If issues occur, the workaround code can be restored from git history.
