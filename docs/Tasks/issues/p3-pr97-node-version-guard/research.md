# Research: P3-PR97-NODE-VERSION-GUARD

## Issue
`checkNodeVersion()` in `scripts/check-node-version.mjs` runs at module load time even when imported as a utility. This causes:

1. **Double execution** - Importers call it explicitly after import
2. **process.exit() during import** - Can terminate before caller's logic runs

## Root Cause Analysis

### File: `/Users/m/git/clients/aol/europe-ttp/scripts/check-node-version.mjs`

The original implementation (lines 40-44) had a guard:
```javascript
// Run check when executed directly
// Use direct-exec guard: only auto-run when this file is the main entrypoint
if (import.meta.url === `file://${process.argv[1]}`) {
  checkNodeVersion();
}
```

### Problems with the Original Guard

1. **URL encoding mismatch**: `import.meta.url` uses proper URL encoding, while `file://${process.argv[1]}` is a simple string concatenation that may not handle special characters.

2. **Symlink resolution**: On macOS, `/tmp` is a symlink to `/private/tmp`. The URL comparison fails when paths resolve differently.

3. **Platform differences**: Windows uses different path separators and drive letters.

## Usage Patterns

The module is used in two ways:

### 1. Direct Execution (npm scripts)
```json
// package.json
"precheck": "node scripts/check-node-version.mjs",
"predev": "node scripts/check-node-version.mjs",
```

### 2. Import and Explicit Call (BDD runners)
```typescript
// scripts/bdd/run-typescript.ts (line 10-11)
import { checkNodeVersion } from '../check-node-version.mjs';
checkNodeVersion();

// scripts/bdd/run-python.ts (line 14-15)
import { checkNodeVersion } from '../check-node-version.mjs';
checkNodeVersion();
```

## Solution

Use Node.js's `realpathSync` from the `fs` module to resolve symlinks and compare real paths:

```javascript
import { fileURLToPath, pathToFileURL } from 'url';
import { realpathSync } from 'fs';

// ...

if (process.argv[1]) {
  try {
    const scriptRealPath = realpathSync(fileURLToPath(import.meta.url));
    const entryRealPath = realpathSync(process.argv[1]);
    if (scriptRealPath === entryRealPath) {
      checkNodeVersion();
    }
  } catch {
    // Fallback for edge cases (e.g., path doesn't exist)
    try {
      const entryUrl = pathToFileURL(process.argv[1]).href;
      if (import.meta.url === entryUrl) {
        checkNodeVersion();
      }
    } catch {
      // Last resort: simple string comparison
      if (import.meta.url === `file://${process.argv[1]}`) {
        checkNodeVersion();
      }
    }
  }
}
```

### Why This Works

1. `realpathSync()` resolves symlinks to their real paths
2. `fileURLToPath()` converts `import.meta.url` to a filesystem path
3. Comparing real paths handles macOS `/tmp` -> `/private/tmp` symlinks
4. Multi-level fallback ensures robustness in edge cases

## Verification

### Test 1: Direct Execution
```bash
$ node scripts/check-node-version.mjs
[check-node-version] OK: Node.js v20.20.0
```

### Test 2: Import (No Auto-Run)
```javascript
import { checkNodeVersion } from './scripts/check-node-version.mjs';
// No output here - function not called
checkNodeVersion();  // Now it runs
[check-node-version] OK: Node.js v20.20.0
```

## Impact

- **Risk**: Low - Only affects the guard logic, not the core functionality
- **Scope**: Internal tooling only
- **Breaking Changes**: None - behavior is more correct, not changed
