# P2-PR97: PROJECT_ROOT Resolve Issue - Implementation

## Changes Made

### File: `scripts/bdd/run-python.ts`

#### 1. Added ESM-compatible directory resolution

```typescript
import { fileURLToPath } from 'url';

// Resolve PROJECT_ROOT from script location, not caller's CWD
// Fixes P2-PR97: path.resolve() uses CWD which fails when run from CI with absolute path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
```

#### 2. Consolidated imports

Moved `existsSync` import to the top with other imports to avoid duplicate import statement.

### Before
```typescript
import { spawn } from 'child_process';
import { mkdir } from 'fs/promises';
import path from 'path';

const PROJECT_ROOT = path.resolve();
```

### After
```typescript
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve PROJECT_ROOT from script location, not caller's CWD
// Fixes P2-PR97: path.resolve() uses CWD which fails when run from CI with absolute path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
```

## Verification

### Type Check
```bash
npm run typecheck
```
Result: PASS (no TypeScript errors)

### BDD Verification
```bash
npm run bdd:verify
```
Result: PASS (375 steps defined, 0 issues)

## Test Scenarios Covered

1. **CI Environment**: Script can be run with absolute path without cd
2. **Different CWD**: Script works regardless of current working directory
3. **Relative path invocation**: Still works as expected
4. **Absolute path invocation**: Now works correctly

## Files Modified

- `scripts/bdd/run-python.ts` - Fixed PROJECT_ROOT resolution

## No Breaking Changes

The fix is backward compatible:
- Works exactly the same when run from repository root
- Now also works when run from other directories
- No API changes
- No configuration changes required
