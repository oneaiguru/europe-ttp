# TASK-091: Prune Stale BDD JS Scripts - Research

## Files Confirmed Present

All three stale files exist in `scripts/bdd/`:
- `scripts/bdd/run-verify.mjs` (136 lines)
- `scripts/bdd/run-python.js` (54 lines)
- `scripts/bdd/run-typescript.js` (46 lines)

## TypeScript Replacements Confirmed

All three have TypeScript superseding versions:
- `scripts/bdd/verify-alignment.ts` (266 lines) - supersedes `run-verify.mjs`
- `scripts/bdd/run-python.ts` (54 lines) - supersedes `run-python.js`
- `scripts/bdd/run-typescript.ts` (46 lines) - supersedes `run-typescript.js`

## package.json References (package.json:7-9)

All `package.json` scripts use the TypeScript versions:
```json
"bdd:verify": "bun scripts/bdd/verify-alignment.ts"
"bdd:python": "bun scripts/bdd/run-python.ts"
"bdd:typescript": "bun scripts/bdd/run-typescript.ts"
```

No references to the `.js` or `.mjs` files.

## Import Analysis

No files import or require any of the stale JS files:
- Searched for `require('...run-*.js*')` - no matches
- Searched for `import ...run-*.js*` - no matches
- Searched for dynamic imports - no matches

The only reference to `step-registry.js` is from `run-verify.mjs:3`:
```javascript
import { STEPS } from '../../test/bdd/step-registry.js';
```

The TypeScript version `verify-alignment.ts:3` imports without extension:
```typescript
import { STEPS } from '../../test/bdd/step-registry';
```

TypeScript's module resolution will resolve this to `step-registry.ts`, not `step-registry.js`.

## Code Comparison

### verify-alignment.ts vs run-verify.mjs
The TS version has significant enhancements:
- Ambiguity detection (lines 189-233)
- Better error formatting with specific counts
- Symlink-safe directory walking using `lstatSync` instead of `statSync` (line 21)
- Support for `*` Gherkin keyword (line 7)
- More comprehensive placeholder matching (lines 82-103)

### run-python.ts vs run-python.js
- Both 54 lines
- TS version has type annotations
- Same functionality

### run-typescript.ts vs run-typescript.js
- Both 46 lines
- TS version has type annotations
- Same functionality

## References in Codebase (grep results)

Only references to the stale files are:
- `docs/Tasks/prune-stale-bdd-js-scripts.task.md` (this task)
- `IMPLEMENTATION_PLAN.md` (this task's row)

No documentation, scripts, or configuration references these files.

## Step Registry Files

Both JS and TS versions of the step registry exist:
- `test/bdd/step-registry.js`
- `test/bdd/step-registry.ts`

The TS BDD runners import from the TS registry (via extensionless import).
The JS `run-verify.mjs` imports from the JS registry.

Since `run-verify.mjs` is being removed, the JS registry (`test/bdd/step-registry.js`) may also be stale. This is noted but out of scope for this task.

## Risk Assessment

**Zero risk** - These files are:
1. Not referenced in `package.json` scripts
2. Not imported by any other code
3. Superseded by functionally-equivalent TypeScript versions
4. Only referenced in this task's own documentation

## Conclusion

All three files are safe to delete. The TypeScript versions provide equivalent functionality and are the active runners used by the project.
