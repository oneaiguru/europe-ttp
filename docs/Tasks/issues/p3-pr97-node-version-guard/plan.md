# Plan: P3-PR97-NODE-VERSION-GUARD

## Summary
Fix the direct-execution guard in `scripts/check-node-version.mjs` to properly prevent auto-execution when the module is imported.

## Changes

### File: `scripts/check-node-version.mjs`

1. **Add imports** (line 7-8):
   ```javascript
   import { fileURLToPath, pathToFileURL } from 'url';
   import { realpathSync } from 'fs';
   ```

2. **Update guard logic** (lines 43-67):
   ```javascript
   // Run check only when executed directly (not when imported as a module)
   // Uses realpathSync to resolve symlinks for accurate comparison
   if (process.argv[1]) {
     try {
       const scriptRealPath = realpathSync(fileURLToPath(import.meta.url));
       const entryRealPath = realpathSync(process.argv[1]);
       if (scriptRealPath === entryRealPath) {
         checkNodeVersion();
       }
     } catch {
       // Fallback for edge cases (e.g., path doesn't exist)
       // Use URL comparison as secondary check
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

## Validation Steps

1. **Run direct execution test**:
   ```bash
   node scripts/check-node-version.mjs
   # Expected: [check-node-version] OK: Node.js v20.20.0
   ```

2. **Run import test** (no auto-execution):
   ```javascript
   // test-import.mjs
   import { checkNodeVersion } from './scripts/check-node-version.mjs';
   console.log('Import complete, no output from checkNodeVersion yet');
   checkNodeVersion();
   ```
   Expected: No output until explicit call

3. **Run typecheck**:
   ```bash
   npm run typecheck
   ```

4. **Run bdd:verify**:
   ```bash
   npm run bdd:verify
   ```

## Rollback
If issues arise, revert to:
```javascript
if (import.meta.url === `file://${process.argv[1]}`) {
  checkNodeVersion();
}
```

## Priority
P3 - Low risk, internal tooling only
