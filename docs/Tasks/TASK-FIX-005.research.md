# TASK-FIX-005: Research Findings

## Root Cause Analysis

### The Problem
`test/bdd/step-registry.js` is stale (Feb 5 01:14) while `test/bdd/step-registry.ts` is current (Feb 5 12:44). The verification script `scripts/bdd/verify-alignment.js` imports the `.js` file, missing 14 steps that were added to the `.ts` file.

### File Locations
- `test/bdd/step-registry.ts` (1471 lines, 231 steps) - Source of truth
- `test/bdd/step-registry.js` (1398 lines, missing steps) - Stale compiled output
- `scripts/bdd/verify-alignment.js` - Imports `.js` file
- `scripts/bdd/verify-alignment.ts` - Imports `.ts` file (works with tsx/bun)

### Missing Steps in .js Registry
All 14 "dead steps" are actually defined in the `.ts` registry:
1. `test placeholder step with value {string}` - line 1448
2. `I have a registry entry with placeholder but no pattern` - line 1453
3. `the alignment check runs` - line 1459
4. `the step should match correctly` - line 1465
5. `I request a signed upload URL without authentication` - line 194
6. `I should receive a 401 error` - line 212
7. `no signed URL should be generated` - line 224
8. `I request a signed URL with filepath {string}` - line 200
9. `I should receive a 400 error` - line 218
10. `the error should mention {string}` - line 230
11. `I request a signed URL with content type {string}` - line 206
12. `the signed URL should expire within {int} minutes` - line 236
13. Upload security test steps

### Build Configuration
- `tsconfig.json` uses `module: "ESNext"` and `moduleResolution: "bundler"`
- No build script in `package.json` - only `typecheck` with `--noEmit`
- All BDD scripts expect to run via `bun` or `tsx` which handle `.ts` directly

### Why the .js File Exists
The `.js` file was likely generated during development but there's no automated process to keep it in sync.

## Solution Options

### Option 1: Use tsx to run .ts files directly
Change `verify-alignment.js` to use tsx loader:
```javascript
import { register } from 'tsx';
import { STEPS } from '../../test/bdd/step-registry.ts';
```
**Pros**: Uses source of truth, no build step
**Cons**: Requires tsx in execution environment

### Option 2: Compile .ts to .js as build step
Add to `package.json`:
```json
"build": "tsc --project tsconfig.json",
"pretest": "npm run build"
```
**Pros**: Standard approach, works with node
**Cons**: Requires build step, need to track .js files

### Option 3: Delete .js files and require tsx
Remove stale `.js` files, document that tsx/bun is required.
**Pros**: Single source of truth, simpler
**Cons**: Harder dependency on tsx/bun

## Recommended Solution
**Option 2 with modification**: Use `tsc` to compile just the registry file:
```json
"build:registry": "tsc test/bdd/step-registry.ts --outDir test/bdd --module ESNext --target ES2022 --moduleResolution bundler --esModuleInterop --skipLibCheck"
```

Then update the verification scripts to import from the compiled `.js` file, ensuring they stay in sync.

## Related Code
- `test/bdd/step-registry.ts:1-1471` - Full registry with 231 steps
- `test/bdd/step-registry.js:1-1398` - Stale registry missing 14 steps
- `scripts/bdd/verify-alignment.js:3` - `import { STEPS } from '../../test/bdd/step-registry.js';`
- `scripts/bdd/verify-alignment.ts:3` - `import { STEPS } from '../../test/bdd/step-registry';`
